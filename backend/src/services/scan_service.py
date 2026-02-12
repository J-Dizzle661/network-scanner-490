# ids-project/backend/services/scan_service.py

# -----------------------------------------------------------------------------
# Executes ML pipeline for basic network scan feature. Coordinates execution
# of functions defined in src/ml_pipeline/ scripts.
# Functions defined here are called from websocket_server.py socket event handlers.
# -----------------------------------------------------------------------------

import time
import threading
import psutil
import json
import os
import sys
from collections import deque
from datetime import datetime

from src.ml_pipeline.preprocessor import Preprocessor
from src.ml_pipeline.model_inference import ModelInference
from src.ml_pipeline.flow_capture import capture_live
from src.ml_pipeline.feature_mapping import map_features

# Helper function for PyInstaller compatibility
def get_resource_path(relative_path):
    """
    Get absolute path to resource, works for both development and PyInstaller bundle.
    When frozen by PyInstaller, resources are extracted to sys._MEIPASS.
    In development, paths are relative to the backend/ directory.
    """
    if getattr(sys, 'frozen', False):
        # Running in PyInstaller bundle
        base_path = sys._MEIPASS
    else:
        # Running in development - navigate from src/services/ to backend/
        base_path = os.path.dirname(os.path.abspath(__file__))
        base_path = os.path.join(base_path, '..', '..')
    return os.path.normpath(os.path.join(base_path, relative_path))

def get_writable_path(relative_path):
    """
    Get absolute path to writable directory (e.g., logs).
    Priority: 1) Environment variable IDS_LOG_DIR (received as command line arg; set by Electron)
              2) Current working directory (deployment fallback)
              3) Backend directory (development)
    """
    # Check if Electron provided a log directory via environment variable
    electron_log_dir = os.environ.get('IDS_LOG_DIR')
    if electron_log_dir:
        return os.path.normpath(os.path.join(electron_log_dir, relative_path))
    
    # Fallback behavior for standalone execution
    if getattr(sys, 'frozen', False):
        # Running in PyInstaller bundle - use current working directory
        base_path = os.getcwd()
    else:
        # Running in development - navigate from src/services/ to backend/
        base_path = os.path.dirname(os.path.abspath(__file__))
        base_path = os.path.join(base_path, '..', '..')
    return os.path.normpath(os.path.join(base_path, relative_path))

# Global vars
_scan_thread = None
_scan_running = False
_monitor_thread = None
_flow_logs = []  # In-memory list of flow records for current scan
_flow_counter_lock = threading.Lock()  # Lock for thread-safe flow numbering

# Hardware metrics (sliding window averages)
_cpu_samples = deque(maxlen=10)  # Keep last 10 CPU samples
_memory_samples = deque(maxlen=10)  # Keep last 10 memory samples
_metrics_lock = threading.Lock()

# Paths to saved models (PyInstaller compatible)
SCALER_PATH = get_resource_path("models/scaler.joblib")
ENCODER_PATH = get_resource_path("models/label_encoder.joblib")
RF_MODEL_PATH = get_resource_path("models/rf_model.joblib")
LR_MODEL_PATH = get_resource_path("models/lr_model.joblib")
SVM_MODEL_PATH = get_resource_path("models/svm_model.joblib")
MLP_MODEL_PATH = get_resource_path("models/mlp_model.joblib")
IF_MODEL_PATH = get_resource_path("models/if_model.joblib")

def _hardware_monitor_loop():
    """
    Monitors CPU and memory usage in background.
    CPU sampled every 1s, memory every 2s.
    Stores recent samples in sliding windows.
    """
    global _scan_running, _cpu_samples, _memory_samples, _metrics_lock
    
    last_memory_sample = time.time()
    
    while _scan_running:
        try:
            # Sample CPU every iteration (1 second interval)
            cpu_percent = psutil.cpu_percent(interval=1)
            
            with _metrics_lock:
                _cpu_samples.append(cpu_percent)
            
            # Sample memory every 2 seconds
            current_time = time.time()
            if current_time - last_memory_sample >= 2.0:
                mem = psutil.virtual_memory()
                with _metrics_lock:
                    _memory_samples.append(mem.percent)
                last_memory_sample = current_time
                
        except Exception as e:
            print(f"Hardware monitoring error: {e}", flush=True)
            break

def _get_average_cpu() -> float:
    """Get average CPU usage from recent samples."""
    with _metrics_lock:
        if not _cpu_samples:
            return 0.0
        return sum(_cpu_samples) / len(_cpu_samples)

def _get_average_memory() -> float:
    """Get average memory usage from recent samples."""
    with _metrics_lock:
        if not _memory_samples:
            return 0.0
        return sum(_memory_samples) / len(_memory_samples)

# Internal scan loop. Runs in background thread, called
# from start_scan_service().
def _scan_loop(params, emit):
    """
    Long-running scan loop executed in a background thread.
    Terminates cooperatively when _scan_running is set to False.
    """

    global _scan_running

    print("Scan service started with params:", params)
    emit("scan_status", {
        "state": "started",
        "message": "Scan initialized"
    })

    # load in preprocessor and specific model selected by user
    preprocessor = Preprocessor(SCALER_PATH)

    # Determine which model to load in based on user input
    model_type = params.get("model", "randomForest") # default to randomForest if not specified
    match model_type:
        case "randomForest":
            model = ModelInference(RF_MODEL_PATH, ENCODER_PATH)
        case "logisticRegression":
            model = ModelInference(LR_MODEL_PATH, ENCODER_PATH)
        case "supportVectorMachine":
            model = ModelInference(SVM_MODEL_PATH, ENCODER_PATH)
        case "multilayerPerceptron":
            model = ModelInference(MLP_MODEL_PATH, ENCODER_PATH)
        case "isolationForest":
            model = ModelInference(IF_MODEL_PATH, ENCODER_PATH)
        case _:
            print(f"Unknown model '{model_type}' selected; defaulting to Random Forest.")
            model = ModelInference(RF_MODEL_PATH, ENCODER_PATH)

    # evaluation metrics (per scan session)
    total_flows = 0
    total_packets = 0      # Total packets across all flows (for throughput calculation)
    scan_start_time = time.time()
    scan_end_time = 0.0
    last_flow_time = time.time()
    
    # Hardware usage tracking (incremental approach for memory efficiency)
    cpu_sum = 0.0          # Running sum of CPU usage percentages
    cpu_max = 0.0          # Highest CPU usage percentage observed
    cpu_count = 0          # Number of CPU readings taken (for calculating average)
    memory_sum = 0.0       # Running sum of memory usage percentages
    memory_max = 0.0       # Highest memory usage percentage observed
    memory_count = 0       # Number of memory readings taken (for calculating average)
    
    # Inference latency tracking
    inference_latency_sum = 0.0  # Running sum of inference latencies
    inference_latency_count = 0  # Number of inference latency readings

    # In-memory list to store flow records for this scan session
    flow_logs = []

    try:
        while _scan_running:
            for flow in capture_live(interface=params.get("interface")):
                # Allow cooperative shutdown even while capturing
                if not _scan_running:
                    break

                # Thread-safe flow number assignment
                with _flow_counter_lock:
                    total_flows += 1
                    current_flow_num = total_flows

                flow_received_time = time.time()
                
                # Map features for this single flow
                df_mapped = map_features(flow)

                # Preprocess the mapped features (single-row DataFrame)
                df_preprocessed = preprocessor.transform(df_mapped)

                # Predict label and confidence for this single flow
                predicted_labels, confidences = model.predict_with_confidence(df_preprocessed)
                predicted_label = predicted_labels[0]
                
                # Extract confidence value, handling numpy types
                conf_value = confidences[0]
                if conf_value is None:
                    confidence = None
                else:
                    # Convert numpy scalar to Python float
                    try:
                        confidence = float(conf_value.item()) if hasattr(conf_value, 'item') else float(conf_value)
                    except (ValueError, AttributeError):
                        confidence = None

                # Diagnostic logging
                # print("="*60, flush=True)
                # print(f"[{time.strftime('%H:%M:%S')}] Raw NFStream flow (#{current_flow_num}):", flush=True)
                # try:
                #     # flow may be a complex object; show its dict for readability
                #     print(flow.__dict__, flush=True)
                # except Exception:
                #     print(str(flow), flush=True)

                # print(f"[{time.strftime('%H:%M:%S')}] Feature-mapped flow (#{current_flow_num}):", flush=True)
                # print(df_mapped.loc[0].to_string(), flush=True)

                # print(f"[{time.strftime('%H:%M:%S')}] Preprocessed flow (#{current_flow_num}):", flush=True)
                # print(df_preprocessed.loc[0].to_string(), flush=True)

                # print(f"[{time.strftime('%H:%M:%S')}] Predicted label (#{current_flow_num}): {predicted_label}", flush=True)
                # print("="*60 + "\n", flush=True)

                # calculate derived evaluation metrics
                inference_latency = time.time() - flow_received_time
                flow_latency = time.time() - last_flow_time
                packet_count = getattr(flow, 'bidirectional_packets', 0)
                total_packets += packet_count  # Accumulate total packets for throughput
                throughput = packet_count / flow_latency if flow_latency > 0 else 0.0
                last_flow_time = time.time()
                
                # Get current hardware usage and update running statistics
                cpu_usage = _get_average_cpu()
                memory_usage = _get_average_memory()
                
                cpu_sum += cpu_usage
                cpu_max = max(cpu_max, cpu_usage)
                cpu_count += 1
                
                memory_sum += memory_usage
                memory_max = max(memory_max, memory_usage)
                memory_count += 1
                
                # Track inference latency for average calculation
                inference_latency_sum += inference_latency
                inference_latency_count += 1

                # Construct comprehensive flow log object
                flow_log = {
                    "timestamp": datetime.now().isoformat(),
                    "flow_number": current_flow_num,
                    "predicted_label": predicted_label,
                    "confidence": round(confidence, 4) if confidence is not None else None,
                    "inference_latency": round(inference_latency, 6),
                    "throughput": round(throughput, 2),
                    "cpu_usage_percent": round(cpu_usage, 1),
                    "memory_usage_percent": round(memory_usage, 1),
                    "flow_details": {
                        "src_ip": getattr(flow, 'src_ip', 'N/A'),
                        "dst_ip": getattr(flow, 'dst_ip', 'N/A'),
                        "src_port": getattr(flow, 'src_port', 0),
                        "dst_port": getattr(flow, 'dst_port', 0),
                        "protocol": getattr(flow, 'protocol', 0),
                        "bidirectional_packets": packet_count,
                        "bidirectional_bytes": getattr(flow, 'bidirectional_bytes', 0),
                        "duration_ms": getattr(flow, 'bidirectional_duration_ms', 0)
                    }
                }
                
                # Append to in-memory log list for this scan session
                flow_logs.append(flow_log)

                # Emit the same flow log object to client for real-time display
                emit("network_data", {
                    "flow_number": flow_log["flow_number"],
                    "predicted_label": flow_log["predicted_label"],
                    "confidence": flow_log["confidence"],
                    "inference_latency": flow_log["inference_latency"],
                    "throughput": flow_log["throughput"],
                    "cpu_usage_percent": flow_log["cpu_usage_percent"],
                    "memory_usage_percent": flow_log["memory_usage_percent"]
                })

    except KeyboardInterrupt:
        print("Scan loop interrupted by user.", flush=True)

    finally:
        scan_end_time = time.time()
        scan_duration = scan_end_time - scan_start_time
        
        # Calculate final metrics / statistics
        cpu_avg = cpu_sum / cpu_count if cpu_count > 0 else 0.0
        memory_avg = memory_sum / memory_count if memory_count > 0 else 0.0
        total_throughput = total_packets / scan_duration if scan_duration > 0 else 0.0
        avg_inference_latency = inference_latency_sum / inference_latency_count if inference_latency_count > 0 else 0.0
        
        # Construct scan_metadata object with complete scan statistics
        scan_metadata = {
            "start_time": datetime.fromtimestamp(scan_start_time).isoformat(),
            "end_time": datetime.fromtimestamp(scan_end_time).isoformat(),
            "duration_seconds": round(scan_duration, 2),
            "total_flows": total_flows,
            "total_packets": total_packets,
            "throughput_packets_per_second": round(total_throughput, 2),
            "average_inference_latency_seconds": round(avg_inference_latency, 6),
            "model_type": params.get("model", "randomForest"),
            "interface": params.get("interface", "N/A"),
            "hardware_usage": {
                "cpu_average_percent": round(cpu_avg, 2),
                "cpu_max_percent": round(cpu_max, 2),
                "memory_average_percent": round(memory_avg, 2),
                "memory_max_percent": round(memory_max, 2)
            }
        }
        
        # Emit scan summary to client
        emit("scan_summary", scan_metadata)

        # Export flow logs to file
        if flow_logs:
            try:
                # Create logs directory if it doesn't exist (PyInstaller compatible)
                logs_dir = get_writable_path("logs")
                os.makedirs(logs_dir, exist_ok=True)
                
                # Generate timestamped filename
                timestamp_str = datetime.fromtimestamp(scan_start_time).strftime("%Y%m%d_%H%M%S")
                log_filename = f"scan_{timestamp_str}.json"
                log_filepath = os.path.join(logs_dir, log_filename)
                
                # Prepare complete log data with metadata
                log_data = {
                    "scan_metadata": scan_metadata,
                    "flows": flow_logs
                }
                
                # Write to file with pretty formatting
                with open(log_filepath, 'w') as f:
                    json.dump(log_data, f, indent=2)
                
                print(f"Flow logs exported to: {log_filepath}", flush=True)
                
            except Exception as e:
                print(f"Error exporting flow logs: {e}", flush=True)
        else:
            print("No flows to export.", flush=True)

        emit("scan_status", {
            "state": "stopped",
            "message": "Scan terminated"
        })

# called from websocket_server.py "start_scan" socket event definition.
# Uses injected emitter to send diagnostics status info to client
def start_scan_service(params, emit):
    """
    Starts the IDS scan service in a background thread.
    """
    global _scan_thread, _scan_running, _monitor_thread, _cpu_samples, _memory_samples

    if _scan_running:
        print("Scan already running; ignoring start request.")
        emit("scan_status", {
            "state": "already_running",
            "message": "Scan already active"
        })
        return

    # Clear previous samples
    _cpu_samples.clear()
    _memory_samples.clear()
    
    # update global var and start threads
    # passes injected emitter so internal scan loop can also send client info
    _scan_running = True
    
    # Start hardware monitoring thread
    _monitor_thread = threading.Thread(
        target=_hardware_monitor_loop,
        daemon=True
    )
    _monitor_thread.start()
    
    # Start scan thread
    _scan_thread = threading.Thread(
        target=_scan_loop,
        args=(params, emit),
        daemon=True
    )
    _scan_thread.start()

# called from websocket_server.py "stop_scan" socket event definition
def stop_scan_service():
    """
    Stops the IDS scan service and waits for the scan thread
    to terminate cleanly.
    """
    global _scan_running, _scan_thread, _monitor_thread

    if not _scan_running:
        print("Scan is not running; ignoring stop request.")
        return

    print("Stopping scan service...")
    _scan_running = False

    # Wait for both threads to exit
    if _scan_thread and _scan_thread.is_alive():
        _scan_thread.join(timeout=5)
    
    if _monitor_thread and _monitor_thread.is_alive():
        _monitor_thread.join(timeout=5)

    _scan_thread = None
    _monitor_thread = None
    print("Scan service fully stopped.")

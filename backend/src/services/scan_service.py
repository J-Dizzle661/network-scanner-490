# ids-project/backend/services/scan_service.py

# -----------------------------------------------------------------------------
# Executes ML pipeline for basic network scan feature. Coordinates execution
# of functions defined in src/ml_pipeline/ scripts.
# Functions defined here are called from websocket_server.py socket event handlers.
#
# UPDATED: Now supports both live capture and CSV replay modes
# -----------------------------------------------------------------------------

import time
import threading

from src.ml_pipeline.preprocessor import Preprocessor
from src.ml_pipeline.model_inference import ModelInference
from src.ml_pipeline.flow_capture import capture_live
from src.ml_pipeline.flow_replay import replay_from_csv  # ADDED THIS IMPORT
from src.ml_pipeline.feature_mapping import map_features

# Global vars
_scan_thread = None
_scan_running = False

# Paths to saved models
SCALER_PATH = "models/scaler.joblib"
MODEL_PATH = "models/rf_model.joblib"
ENCODER_PATH = "models/label_encoder.joblib"


def _scan_loop(params, emit):
    """
    Long-running scan loop executed in a background thread.
    Terminates cooperatively when _scan_running is set to False.
    """

    global _scan_running

    mode = params.get("mode", "live")  # Default to live capture

    print(f"Scan service started with params:", params)
    emit("scan_status", {
        "state": "started",
        "mode": mode,
        "message": f"Scan initialized ({mode} mode)"
    })

    # load in preprocessor and model
    try:
        preprocessor = Preprocessor(SCALER_PATH)
        model = ModelInference(MODEL_PATH, ENCODER_PATH)
    except Exception as e:
        emit("scan_error", {"error": f"Failed to load models: {e}"})
        return

    # Select flow source based on mode
    try:
        if mode == "live":
            interface = params.get("interface")
            if not interface:
                emit("scan_error", {"error": "Missing interface parameter"})
                return
            flow_source = capture_live(interface=interface)

        elif mode == "replay":
            csv_path = params.get("csv_path")
            if not csv_path:
                emit("scan_error", {"error": "Missing csv_path parameter"})
                return

            delay_ms = params.get("delay_ms", 100)
            max_flows = params.get("max_flows", None)
            start_row = params.get("start_row", None)
            end_row = params.get("end_row", None)

            flow_source = replay_from_csv(
                csv_path=csv_path,
                delay_ms=delay_ms,
                max_flows=max_flows,
                start_row=start_row,
                end_row=end_row
            )
        else:
            emit("scan_error", {"error": f"Unknown mode: {mode}"})
            return

    except Exception as e:
        emit("scan_error", {"error": f"Failed to initialize flow source: {e}"})
        return

    flow_count = 0

    # Track accuracy metrics for replay mode
    if mode == "replay":
        correct_predictions = 0
        total_predictions = 0
    
    try:
        # UNIFIED PROCESSING LOOP - same for both modes
        for flow in flow_source:
            if not _scan_running:
                break

            flow_count += 1

            try:
                # This works for BOTH NFStream and CSV flows
                df_mapped = map_features(flow)
                df_preprocessed = preprocessor.transform(df_mapped)
                predicted_label = model.predict(df_preprocessed)[0]

                # For replay mode, compare with ground truth
                if mode == "replay":
                    true_label = flow.Label if hasattr(flow, 'Label') else None
                    
                    if true_label:
                        total_predictions += 1
                        if predicted_label == true_label:
                            correct_predictions += 1
                        
                        accuracy = (correct_predictions / total_predictions) * 100
                    else:
                        accuracy = None
                    
                    emit("network_data", {
                        "flow_number": flow_count,
                        "predicted_label": predicted_label,
                        "true_label": true_label,
                        "accuracy": accuracy
                    })
                else:
                    # Live mode - no ground truth
                    emit("network_data", {
                        "flow_number": flow_count,
                        "predicted_label": predicted_label
                    })
                
                # Periodic logging
                if flow_count % 100 == 0:
                    if mode == "replay" and total_predictions > 0:
                        print(f"Processed {flow_count} flows, Accuracy: {accuracy:.2f}%")
                    else:
                        print(f"Processed {flow_count} flows")
                        
            except Exception as e:
                print(f"Error processing flow #{flow_count}: {e}")
                emit("scan_error", {
                    "flow_number": flow_count,
                    "error": str(e)
                })
                continue
    
    except KeyboardInterrupt:
        print("Scan interrupted by user")
    
    finally:
        if mode == "replay" and total_predictions > 0:
            final_accuracy = (correct_predictions / total_predictions) * 100
            print(f"Final Results: {correct_predictions}/{total_predictions} correct ({final_accuracy:.2f}%)")
            
            emit("scan_complete", {
                "total_flows": flow_count,
                "correct": correct_predictions,
                "accuracy": final_accuracy
            })
        
        emit("scan_status", {
            "state": "stopped",
            "message": "Scan terminated"
        })


def start_scan_service(params, emit):
    """
    Starts the IDS scan service in a background thread.
    """
    global _scan_thread, _scan_running

    if _scan_running:
        print("Scan already running; ignoring start request.")
        emit("scan_status", {
            "state": "already_running",
            "message": "Scan already active"
        })
        return

    # update global var and start _scan_loop() as new thread
    # passes injected emitter so internal scan loop can also send client info
    _scan_running = True
    _scan_thread = threading.Thread(
        target=_scan_loop,
        args=(params, emit),
        daemon=True
    )
    _scan_thread.start()


def stop_scan_service():
    """
    Stops the IDS scan service and waits for the scan thread
    to terminate cleanly.
    """
    global _scan_running, _scan_thread

    if not _scan_running:
        print("Scan is not running; ignoring stop request.")
        return

    print("Stopping scan service...")
    _scan_running = False

    # Wait for scan thread to exit
    if _scan_thread and _scan_thread.is_alive():
        _scan_thread.join(timeout=5)

    _scan_thread = None
    print("Scan service fully stopped.")
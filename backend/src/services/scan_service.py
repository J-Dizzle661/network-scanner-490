# ids-project/backend/services/scan_service.py

# -----------------------------------------------------------------------------
# Executes ML pipeline for basic network scan feature. Coordinates execution
# of functions defined in src/ml_pipeline/ scripts.
# Functions defined here are called from websocket_server.py socket event handlers.
# -----------------------------------------------------------------------------

import time
import threading

from src.ml_pipeline.preprocessor import Preprocessor
from src.ml_pipeline.model_inference import ModelInference
from src.ml_pipeline.flow_capture import capture_live
from src.ml_pipeline.feature_mapping import map_features

# Global vars
_scan_thread = None
_scan_running = False

# Paths to saved models
SCALER_PATH = "models/scaler.joblib"
MODEL_PATH = "models/rf_model.joblib"
ENCODER_PATH = "models/label_encoder.joblib"

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

    # load in preprocessor and model
    preprocessor = Preprocessor(SCALER_PATH)
    model = ModelInference(MODEL_PATH, ENCODER_PATH)

    flow_count = 0

    try:
        while _scan_running:
            for flow in capture_live(interface=params.get("interface")):
                # Allow cooperative shutdown even while capturing
                if not _scan_running:
                    break

                flow_count += 1

                # Map features for this single flow
                df_mapped = map_features(flow)

                # Preprocess the mapped features (single-row DataFrame)
                df_preprocessed = preprocessor.transform(df_mapped)

                # Predict label for this single flow
                predicted_label = model.predict(df_preprocessed)[0]

                # Diagnostic logging
                print("="*60, flush=True)
                print(f"[{time.strftime('%H:%M:%S')}] Raw NFStream flow (#{flow_count}):", flush=True)
                try:
                    # flow may be a complex object; show its dict for readability
                    print(flow.__dict__, flush=True)
                except Exception:
                    print(str(flow), flush=True)

                print(f"[{time.strftime('%H:%M:%S')}] Feature-mapped flow (#{flow_count}):", flush=True)
                print(df_mapped.loc[0].to_string(), flush=True)

                print(f"[{time.strftime('%H:%M:%S')}] Preprocessed flow (#{flow_count}):", flush=True)
                print(df_preprocessed.loc[0].to_string(), flush=True)

                print(f"[{time.strftime('%H:%M:%S')}] Predicted label (#{flow_count}): {predicted_label}", flush=True)
                print("="*60 + "\n", flush=True)

                # Emit network data and prediction to client
                emit("network_data", {
                    "flow_number": flow_count,
                    "predicted_label": predicted_label
                })

    except KeyboardInterrupt:
        print("Scan loop interrupted by user.", flush=True)

    finally:
        print("Scan service stopping...", flush=True)
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

# called from websocket_server.py "stop_scan" socket event definition
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

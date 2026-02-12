# ids-project/backend/app.py

# -----------------------------------------------------------------------------
# Main backend execution entry point; initializes websocket server defined in
# websocket_server.py 
# -----------------------------------------------------------------------------

import multiprocessing
import sys
import os

# Required for PyInstaller compatibility with multiprocessing
# Must be called before any multiprocessing-related imports
multiprocessing.freeze_support()

from websocket_server import app, socketio

def main():
    # Accept log directory as command-line argument from Electron
    log_dir = None
    if len(sys.argv) > 1:
        log_dir = sys.argv[1]
        print(f"Using log directory: {log_dir}")
        # Set as environment variable for scan_service to access
        os.environ['IDS_LOG_DIR'] = log_dir
    
    print("Starting IDS backend...")
    print("BACKEND_READY")  # Signal to Electron that backend has started successfully

    # Start WebSocket server
    socketio.run(
        app,
        host="127.0.0.1",
        port=5000,
        debug=False,
        allow_unsafe_werkzeug=True # Flask-SocketIO won't run with Werkzeug's development server in production mode
    )

if __name__ == "__main__":
    # Set multiprocessing start method to prevent child processes from re-executing main
    multiprocessing.set_start_method('spawn', force=True)
    main()

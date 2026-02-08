# ids-project/backend/websocket_server.py

# -----------------------------------------------------------------------------
# Defines websocket server logic and coordinates services. Defines server 
# initlialization and socket events for incoming requests from client (Electron
# front end).
# Server is initialized in app.py.
# Calls business logic functions defined in scripts of src/services/
# -----------------------------------------------------------------------------

from flask import Flask
from flask_socketio import SocketIO, emit

from src.utils.interface_helper import get_network_interfaces

from src.services.scan_service import (
    start_scan_service,
    stop_scan_service
)

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# 
# CLIENT --> SERVER
# Socket event definitions for incoming requests from client (Electron 
# front end).
#
@app.route("/")
def index():
    return "Backend is running"

@socketio.on("connect")
def handle_connect():
    print("Client connected")
    emit("server_message", {"data": "Connected to IDS backend"})

@socketio.on("start_scan")
def handle_start_scan(data):
    print("Received start_scan request:", data)

    # execute scan_service.py/start_scan_service() as background task
    socketio.start_background_task(
        target=start_scan_service,  # name of function
        params=data,                # parameters of incoming client request
        emit=socketio.emit          # injected emitter for server --> client comm
    )

    emit("service_status", {
        "service": "scan",
        "status": "started"
    })


@socketio.on("stop_scan")
def handle_stop_scan():
    print("Received stop_scan request")

    # execute scan_service.py/stop_scan_service()
    stop_scan_service()

    emit("service_status", {
        "service": "scan",
        "status": "stopped"
    })

@socketio.on("request_interfaces")
def handle_interface_request():
    print("Frontend requested interface list...")
    interfaces = get_network_interfaces()
    # Send the list back to the frontend
    socketio.emit("interface_list", interfaces)

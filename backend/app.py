# ids-project/backend/app.py

# -----------------------------------------------------------------------------
# Main backend execution entry point; initializes websocket server defined in
# websocket_server.py 
# -----------------------------------------------------------------------------

from websocket_server import app, socketio

def main():
    print("Starting IDS backend...")
    
    # Start WebSocket server
    socketio.run(
        app,
        host="127.0.0.1",
        port=5000,
        debug=False
    )

if __name__ == "__main__":
    main()

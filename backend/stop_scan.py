# stop_scan.py
# Quick script to stop any running scan

import socketio

sio = socketio.Client()

print("Connecting to backend...")
sio.connect('http://127.0.0.1:5000')

print("Sending stop command...")
sio.emit('stop_scan')

import time
time.sleep(2)

print("Scan stopped. You can now run a new test.")
sio.disconnect()
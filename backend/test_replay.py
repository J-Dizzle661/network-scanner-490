# test_replay.py
import socketio
import time

# Connect to backend
sio = socketio.Client()

# Event handlers
@sio.on('connect')
def on_connect():
    print("✓ Connected to backend")

@sio.on('scan_status')
def on_status(data):
    print(f"Status: {data}")

@sio.on('network_data')
def on_data(data):
    flow_num = data.get('flow_number')
    predicted = data.get('predicted_label')
    true_label = data.get('true_label')
    accuracy = data.get('accuracy')
    
    if accuracy is not None:
        correct = "✓" if predicted == true_label else "✗"
        print(f"{correct} Flow #{flow_num}: Predicted={predicted}, True={true_label}, Accuracy={accuracy:.2f}%")
    else:
        print(f"Flow #{flow_num}: Predicted={predicted}")

@sio.on('scan_complete')
def on_complete(data):
    print("\n" + "="*60)
    print("FINAL RESULTS:")
    print(f"  Total flows: {data['total_flows']}")
    print(f"  Correct predictions: {data['correct']}")
    print(f"  Final accuracy: {data['accuracy']:.2f}%")
    print("="*60)
    sio.disconnect()

@sio.on('scan_error')
def on_error(data):
    print(f"ERROR: {data}")

# Connect
print("Connecting to backend...")
sio.connect('http://127.0.0.1:5000')

# Start replay mode
print("\nStarting CSV replay...\n")
sio.emit('start_scan', {
    'mode': 'replay',
    'csv_path': r'C:\Users\madfi\Downloads\Compressed\GeneratedLabelledFlows\TrafficLabelling_\Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv',  # Path to test CSV
    'delay_ms': 10,      # Fast replay (10ms between flows)
    'max_flows': 20000   # Test with 100 flows first
})

# Wait for completion
sio.wait()
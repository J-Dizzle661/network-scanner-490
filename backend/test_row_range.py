# test_row_range.py
# Test specific row ranges from CIC-IDS-2017 CSV
# Clean output format showing each flow's prediction vs actual

import socketio
import time

# ============================================================================
# CONFIGURE TEST HERE
# ============================================================================
csv_path = r'C:\Users\madfi\Downloads\Compressed\GeneratedLabelledFlows\TrafficLabelling_\Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv'
START_ROW = 19288  # First row to test (0-based index)
END_ROW = 19299    # Last row + 1 (exclusive)
# ============================================================================

print("="*70)
print(f"Testing CSV Rows {START_ROW} to {END_ROW-1}")
print(f"Total: {END_ROW - START_ROW} flows")
print("="*70)

# Connect to backend
sio = socketio.Client()

# Track results
correct_count = 0
total_count = 0
errors = []

@sio.on('connect')
def on_connect():
    print("\n✓ Connected to backend\n")

@sio.on('scan_status')
def on_status(data):
    if 'started' in data.get('message', ''):
        print(f"{data.get('message')}\n")

@sio.on('network_data')
def on_data(data):
    global correct_count, total_count
    
    flow_num = data.get('flow_number')
    predicted = data.get('predicted_label')
    true_label = data.get('true_label')
    accuracy = data.get('accuracy', 0)
    
    total_count += 1
    
    # Calculate actual CSV row
    csv_row = START_ROW + flow_num - 1
    
    is_correct = (predicted == true_label)
    if is_correct:
        correct_count += 1
    else:
        errors.append({
            'row': csv_row,
            'predicted': predicted,
            'actual': true_label
        })
    
    # Status indicator
    status = "✓" if is_correct else "✗"
    
    # Print flow result
    print(f"{status} Flow #{flow_num:2d} (Row {csv_row:5d}) | "
          f"Predicted: {predicted:15s} | Actual: {true_label:15s} | "
          f"Accuracy: {accuracy:5.1f}%")

@sio.on('scan_complete')
def on_complete(data):
    print("\n" + "="*70)
    print("FINAL RESULTS")
    print("="*70)
    
    total = data['total_flows']
    correct = data['correct']
    accuracy = data['accuracy']
    
    print(f"\nTotal flows:        {total}")
    print(f"Correct:            {correct}")
    print(f"Incorrect:          {total - correct}")
    print(f"Final Accuracy:     {accuracy:.2f}%")
    
    # Show errors if any
    if errors:
        print(f"\n❌ Misclassified Flows ({len(errors)}):")
        for err in errors:
            print(f"   Row {err['row']:5d}: Predicted '{err['predicted']}' but was actually '{err['actual']}'")
    else:
        print("\n✓ Perfect score! All flows classified correctly.")
    
    print("="*70 + "\n")
    
    sio.disconnect()

@sio.on('scan_error')
def on_error(data):
    print(f"\n❌ ERROR: {data.get('error', 'Unknown error')}")
    if 'details' in data:
        print(f"   Details: {data['details']}")
    sio.disconnect()

# Connect and start test
print("\nConnecting to backend...")
try:
    sio.connect('http://127.0.0.1:5000')
except Exception as e:
    print(f"Failed to connect: {e}")
    print("Make sure backend is running: python app.py")
    exit(1)

time.sleep(0.5)

print("Starting test...\n")
sio.emit('start_scan', {
    'mode': 'replay',
    'csv_path': csv_path,
    'delay_ms': 10,
    'start_row': START_ROW,
    'end_row': END_ROW
})

sio.wait()
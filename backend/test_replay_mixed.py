# test_replay_mixed.py
# Test with a mix of BENIGN and DDoS flows to verify model is actually working

import pandas as pd
import socketio
import time

# First, prepare a balanced test CSV
csv_path = r'C:\Users\madfi\Downloads\Compressed\GeneratedLabelledFlows\TrafficLabelling_\Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv'

print("Preparing balanced test set...")
df = pd.read_csv(csv_path)
df.columns = df.columns.str.strip()

# Get 50 BENIGN and 50 DDoS flows
benign = df[df['Label'] == 'BENIGN'].head(50)
ddos = df[df['Label'] == 'DDoS'].head(50)

# Combine and shuffle
test_df = pd.concat([benign, ddos]).sample(frac=1, random_state=42).reset_index(drop=True)

# Save temporary test file
test_csv_path = 'test_balanced_100.csv'
test_df.to_csv(test_csv_path, index=False)

print(f"Created balanced test set: 50 BENIGN + 50 DDoS = 100 flows")
print(f"Saved to: {test_csv_path}")

# Now run the test
sio = socketio.Client()

# Track predictions by class
benign_correct = 0
benign_total = 0
ddos_correct = 0
ddos_total = 0

@sio.on('connect')
def on_connect():
    print("\n✓ Connected to backend\n")

@sio.on('scan_status')
def on_status(data):
    print(f"Status: {data.get('message', data)}")

@sio.on('network_data')
def on_data(data):
    global benign_correct, benign_total, ddos_correct, ddos_total
    
    flow_num = data.get('flow_number')
    predicted = data.get('predicted_label')
    true_label = data.get('true_label')
    
    # Track by class
    if true_label == 'BENIGN':
        benign_total += 1
        if predicted == true_label:
            benign_correct += 1
    elif true_label == 'DDoS':
        ddos_total += 1
        if predicted == true_label:
            ddos_correct += 1
    
    is_correct = predicted == true_label
    emoji = "✓" if is_correct else "✗"
    
    # Only print every 10th flow to avoid spam
    if flow_num % 10 == 0 or not is_correct:
        print(f"{emoji} Flow #{flow_num}: Predicted={predicted:15s} True={true_label:15s}")

@sio.on('scan_complete')
def on_complete(data):
    print("\n" + "="*70)
    print("FINAL RESULTS:")
    print("="*70)
    print(f"Total flows: {data['total_flows']}")
    print(f"Overall accuracy: {data['accuracy']:.2f}%")
    print()
    
    # Per-class accuracy
    if benign_total > 0:
        benign_acc = (benign_correct / benign_total) * 100
        print(f"BENIGN: {benign_correct}/{benign_total} correct ({benign_acc:.1f}%)")
    
    if ddos_total > 0:
        ddos_acc = (ddos_correct / ddos_total) * 100
        print(f"DDoS:   {ddos_correct}/{ddos_total} correct ({ddos_acc:.1f}%)")
    
    print("="*70)
    
    # Diagnosis
    print("\nDIAGNOSIS:")
    if benign_acc > 90 and ddos_acc < 50:
        print("⚠️  Model is predicting mostly BENIGN (broken classifier)")
    elif benign_acc > 70 and ddos_acc > 70:
        print("✓ Model is working correctly!")
    elif benign_acc < 50 and ddos_acc < 50:
        print("⚠️  Model performing poorly on both classes (feature mismatch?)")
    else:
        print("ℹ️  Mixed results - need more investigation")
    
    sio.disconnect()

@sio.on('scan_error')
def on_error(data):
    print(f"ERROR: {data}")

# Connect and test
print("\nConnecting to backend...")
sio.connect('http://127.0.0.1:5000')

time.sleep(1)

print("Starting balanced test...\n")
sio.emit('start_scan', {
    'mode': 'replay',
    'csv_path': test_csv_path,  # Use our balanced test set
    'delay_ms': 5,
    'max_flows': 100
})

sio.wait()
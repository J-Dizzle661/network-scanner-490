# test_replay_comprehensive.py
# Comprehensive test with 1000 flows to get realistic accuracy

import pandas as pd
import socketio
import time

csv_path = r'C:\Users\madfi\Downloads\Compressed\GeneratedLabelledFlows\TrafficLabelling_\Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv'

print("Preparing comprehensive test set (1000 flows)...")
df = pd.read_csv(csv_path)
df.columns = df.columns.str.strip()

# Get 500 BENIGN and 500 DDoS flows randomly sampled
benign = df[df['Label'] == 'BENIGN'].sample(n=500, random_state=42)
ddos = df[df['Label'] == 'DDoS'].sample(n=500, random_state=42)

# Combine and shuffle
test_df = pd.concat([benign, ddos]).sample(frac=1, random_state=42).reset_index(drop=True)

# Save temporary test file
test_csv_path = 'test_comprehensive_1000.csv'
test_df.to_csv(test_csv_path, index=False)

print(f"Created test set: 500 BENIGN + 500 DDoS = 1000 flows")
print(f"Saved to: {test_csv_path}\n")

# Track detailed stats
sio = socketio.Client()

benign_correct = 0
benign_total = 0
ddos_correct = 0
ddos_total = 0

# Track confusion matrix
benign_as_benign = 0
benign_as_ddos = 0
ddos_as_benign = 0
ddos_as_ddos = 0

@sio.on('connect')
def on_connect():
    print("✓ Connected to backend\n")

@sio.on('scan_status')
def on_status(data):
    if 'started' in data.get('message', ''):
        print(f"Status: {data.get('message')}\n")

@sio.on('network_data')
def on_data(data):
    global benign_correct, benign_total, ddos_correct, ddos_total
    global benign_as_benign, benign_as_ddos, ddos_as_benign, ddos_as_ddos
    
    flow_num = data.get('flow_number')
    predicted = data.get('predicted_label')
    true_label = data.get('true_label')
    
    # Update confusion matrix
    if true_label == 'BENIGN':
        benign_total += 1
        if predicted == 'BENIGN':
            benign_correct += 1
            benign_as_benign += 1
        else:
            benign_as_ddos += 1
    elif true_label == 'DDoS':
        ddos_total += 1
        if predicted == 'DDoS':
            ddos_correct += 1
            ddos_as_ddos += 1
        else:
            ddos_as_benign += 1
    
    # Print progress every 100 flows
    if flow_num % 100 == 0:
        current_acc = data.get('accuracy', 0)
        print(f"Progress: {flow_num}/1000 flows, Accuracy: {current_acc:.2f}%")

@sio.on('scan_complete')
def on_complete(data):
    print("\n" + "="*70)
    print("COMPREHENSIVE TEST RESULTS (1000 flows)")
    print("="*70)
    
    overall_acc = data['accuracy']
    print(f"\n📊 Overall Accuracy: {overall_acc:.2f}%")
    print(f"   Correct: {data['correct']}/{data['total_flows']}\n")
    
    # Per-class metrics
    if benign_total > 0:
        benign_acc = (benign_correct / benign_total) * 100
        benign_precision = benign_as_benign / (benign_as_benign + ddos_as_benign) if (benign_as_benign + ddos_as_benign) > 0 else 0
        print(f"🔹 BENIGN Detection:")
        print(f"   Accuracy: {benign_acc:.1f}% ({benign_correct}/{benign_total})")
        print(f"   Precision: {benign_precision*100:.1f}%")
    
    if ddos_total > 0:
        ddos_acc = (ddos_correct / ddos_total) * 100
        ddos_precision = ddos_as_ddos / (ddos_as_ddos + benign_as_ddos) if (ddos_as_ddos + benign_as_ddos) > 0 else 0
        print(f"\n🔸 DDoS Detection:")
        print(f"   Accuracy: {ddos_acc:.1f}% ({ddos_correct}/{ddos_total})")
        print(f"   Precision: {ddos_precision*100:.1f}%")
        print(f"   Missed attacks: {ddos_as_benign}")
    
    # Confusion Matrix
    print(f"\n📋 Confusion Matrix:")
    print(f"                    Predicted:")
    print(f"                BENIGN    DDoS")
    print(f"   Actual BENIGN: {benign_as_benign:4d}    {benign_as_ddos:4d}")
    print(f"   Actual DDoS:   {ddos_as_benign:4d}    {ddos_as_ddos:4d}")
    
    print("\n" + "="*70)
    
    # Interpretation
    print("\n💡 Interpretation:")
    if overall_acc >= 95:
        print("   ✓ Excellent performance! Model is highly accurate.")
    elif overall_acc >= 85:
        print("   ✓ Good performance. Acceptable for production use.")
    elif overall_acc >= 70:
        print("   ⚠️  Moderate performance. May need tuning.")
    else:
        print("   ⚠️  Poor performance. Feature mapping may be incorrect.")
    
    if ddos_as_benign > 50:
        print(f"   ⚠️  High false negatives: {ddos_as_benign} attacks missed!")
    
    if benign_as_ddos > 50:
        print(f"   ⚠️  High false positives: {benign_as_ddos} benign flagged as attacks")
    
    print("="*70 + "\n")
    
    sio.disconnect()

@sio.on('scan_error')
def on_error(data):
    print(f"ERROR: {data}")

# Connect and run test
print("Connecting to backend...")
sio.connect('http://127.0.0.1:5000')

time.sleep(1)

print("Starting comprehensive test (this will take ~10 seconds)...\n")
sio.emit('start_scan', {
    'mode': 'replay',
    'csv_path': test_csv_path,
    'delay_ms': 5,
    'max_flows': 1000
})

sio.wait()

print("\n✓ Test complete! Check results above.\n")
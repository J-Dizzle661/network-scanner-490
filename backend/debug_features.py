# debug_features.py
# This script checks if features are being mapped correctly

import pandas as pd
from src.ml_pipeline.flow_replay import CSVFlow
from src.ml_pipeline.feature_mapping import map_features, DATASET_FEATURES

# Path to your CSV
csv_path = r'C:\Users\madfi\Downloads\Compressed\GeneratedLabelledFlows\TrafficLabelling_\Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv'

print("="*60)
print("DIAGNOSTIC: Feature Mapping Check")
print("="*60)

# Load CSV
print("\n1. Loading CSV...")
df = pd.read_csv(csv_path)
df.columns = df.columns.str.strip()  # Remove whitespace

print(f"   Loaded {len(df)} flows")
print(f"   CSV has {len(df.columns)} columns")

# Check label distribution
print("\n2. Label Distribution in CSV:")
print(df['Label'].value_counts())

# Get first flow
print("\n3. Testing Feature Mapping on First Flow...")
first_row = df.iloc[0]
csv_flow = CSVFlow(first_row)

print(f"\n   Original CSV row (first 10 features):")
for i, col in enumerate(df.columns[:10]):
    print(f"      {col}: {first_row[col]}")

print(f"\n   True Label: {first_row['Label']}")

# Map features
mapped_df = map_features(csv_flow)

print(f"\n4. Mapped Features (first 10):")
for i, col in enumerate(DATASET_FEATURES[:10]):
    print(f"      {col}: {mapped_df[col].values[0]}")

print(f"\n5. Feature Alignment Check:")
print(f"   Expected features: {len(DATASET_FEATURES)}")
print(f"   Mapped features: {len(mapped_df.columns)}")
print(f"   Match: {list(mapped_df.columns) == DATASET_FEATURES}")

# Check for zeros
print(f"\n6. Zero Value Check:")
zero_count = (mapped_df == 0).sum().sum()
total_values = len(DATASET_FEATURES)
print(f"   Zero values: {zero_count}/{total_values} ({(zero_count/total_values)*100:.1f}%)")

if zero_count > total_values * 0.5:
    print("   ⚠️  WARNING: More than 50% zeros! Features not mapping correctly!")

# Check if CSV columns match expected features
print(f"\n7. Column Name Matching:")
csv_cols = set(df.columns)
expected_cols = set(DATASET_FEATURES)
matching = csv_cols.intersection(expected_cols)
missing = expected_cols - csv_cols
extra = csv_cols - expected_cols

print(f"   Matching columns: {len(matching)}/{len(DATASET_FEATURES)}")
if missing:
    print(f"   ⚠️  Missing in CSV: {list(missing)[:5]}...")  # Show first 5
if extra:
    print(f"   ℹ️  Extra in CSV (not used): {list(extra)[:5]}...")

# Test with attack flow
print(f"\n8. Testing with Non-BENIGN Flow...")
attack_flows = df[df['Label'] != 'BENIGN']
if len(attack_flows) > 0:
    attack_row = attack_flows.iloc[0]
    print(f"   Found {len(attack_flows)} non-benign flows")
    print(f"   Attack type: {attack_row['Label']}")
    
    attack_csv_flow = CSVFlow(attack_row)
    attack_mapped = map_features(attack_csv_flow)
    
    print(f"   Attack flow features (first 5):")
    for col in DATASET_FEATURES[:5]:
        print(f"      {col}: {attack_mapped[col].values[0]}")
else:
    print("   ⚠️  No attack flows found in CSV!")

print("\n" + "="*60)
print("Diagnostic complete!")
print("="*60)
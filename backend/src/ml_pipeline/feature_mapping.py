# -----------------------------------------------------------------------------
# Defines logic to align captured NFStream flow data to the expected training dataset
# feature order. Missing features are derived via calculation or filled with zeros.
# 
# UPDATED: Now supports both NFStream flows (live) and CSV flows (replay)
# -----------------------------------------------------------------------------

import pandas as pd

# Full list of dataset features model was trained on. Note: in exact same order as training
# dataset (~70 features).
DATASET_FEATURES = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Fwd Packet Length Max",
    "Fwd Packet Length Min",
    "Fwd Packet Length Mean",
    "Fwd Packet Length Std",
    "Bwd Packet Length Max",
    "Bwd Packet Length Min",
    "Bwd Packet Length Mean",
    "Bwd Packet Length Std",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Flow IAT Mean",
    "Flow IAT Std",
    "Flow IAT Max",
    "Flow IAT Min",
    "Fwd IAT Total",
    "Fwd IAT Mean",
    "Fwd IAT Std",
    "Fwd IAT Max",
    "Fwd IAT Min",
    "Bwd IAT Total",
    "Bwd IAT Mean",
    "Bwd IAT Std",
    "Bwd IAT Max",
    "Bwd IAT Min",
    "Fwd PSH Flags",
    "Fwd URG Flags",
    "Fwd Header Length",
    "Bwd Header Length",
    "Fwd Packets/s",
    "Bwd Packets/s",
    "Min Packet Length",
    "Max Packet Length",
    "Packet Length Mean",
    "Packet Length Std",
    "Packet Length Variance",
    "FIN Flag Count",
    "SYN Flag Count",
    "RST Flag Count",
    "PSH Flag Count",
    "ACK Flag Count",
    "URG Flag Count",
    "CWE Flag Count",
    "ECE Flag Count",
    "Down/Up Ratio",
    "Average Packet Size",
    "Avg Fwd Segment Size",
    "Avg Bwd Segment Size",
    "Fwd Header Length.1",
    "Subflow Fwd Packets",
    "Subflow Fwd Bytes",
    "Subflow Bwd Packets",
    "Subflow Bwd Bytes",
    "Init_Win_bytes_forward",
    "Init_Win_bytes_backward",
    "act_data_pkt_fwd",
    "min_seg_size_forward",
    "Active Mean",
    "Active Std",
    "Active Max",
    "Active Min",
    "Idle Mean",
    "Idle Std",
    "Idle Max",
    "Idle Min"
]

# Defines a dictionary for mapping dataset feature names to known NFStream feature names
# which have 1-to-1 correspondence. Features derived via calculation are added during
# construction of aligned data list.
NFSTREAM_MAPPED = {
    "Destination Port": "dst_port",
    "Flow Duration": "bidirectional_duration_ms",
    "Total Fwd Packets": "src2dst_packets",
    "Total Backward Packets": "dst2src_packets",
    "Total Length of Fwd Packets": "src2dst_bytes",
    "Total Length of Bwd Packets": "dst2src_bytes",
    "Fwd Packet Length Max": "src2dst_max_ps",
    "Fwd Packet Length Min": "src2dst_min_ps",
    "Fwd Packet Length Mean": "src2dst_mean_ps",
    "Fwd Packet Length Std": "src2dst_stddev_ps",
    "Bwd Packet Length Max": "dst2src_max_ps",
    "Bwd Packet Length Min": "dst2src_min_ps",
    "Bwd Packet Length Mean": "dst2src_mean_ps",
    "Bwd Packet Length Std": "dst2src_stddev_ps",
    "Flow IAT Mean": "bidirectional_mean_piat_ms",
    "Flow IAT Std": "bidirectional_stddev_piat_ms",
    "Flow IAT Max": "bidirectional_max_piat_ms",
    "Flow IAT Min": "bidirectional_min_piat_ms",
    "Fwd IAT Mean": "src2dst_mean_piat_ms",
    "Fwd IAT Std": "src2dst_stddev_piat_ms",
    "Fwd IAT Max": "src2dst_max_piat_ms",
    "Fwd IAT Min": "src2dst_min_piat_ms",
    "Bwd IAT Mean": "dst2src_mean_piat_ms",
    "Bwd IAT Std": "dst2src_stddev_piat_ms",
    "Bwd IAT Max": "dst2src_max_piat_ms",
    "Bwd IAT Min": "dst2src_min_piat_ms",
    "Fwd PSH Flags": "src2dst_psh_packets",
    "Fwd URG Flags": "src2dst_urg_packets",
    "Fwd Header Length": "src2dst_header_bytes",
    "Bwd Header Length": "dst2src_header_bytes",
    "Min Packet Length": "bidirectional_min_ps",
    "Max Packet Length": "bidirectional_max_ps",
    "Packet Length Mean": "bidirectional_mean_ps",
    "Packet Length Std": "bidirectional_stddev_ps",
    "FIN Flag Count": "bidirectional_fin_packets",
    "SYN Flag Count": "bidirectional_syn_packets",
    "RST Flag Count": "bidirectional_rst_packets",
    "PSH Flag Count": "bidirectional_psh_packets",
    "ACK Flag Count": "bidirectional_ack_packets",
    "URG Flag Count": "bidirectional_urg_packets",
    "Fwd Header Length.1": "src2dst_header_bytes",
    "Subflow Fwd Packets": "src2dst_packets",
    "Subflow Fwd Bytes": "src2dst_bytes",
    "Subflow Bwd Packets": "dst2src_packets",
    "Subflow Bwd Bytes": "dst2src_bytes"
}


def map_features(flow) -> pd.DataFrame:
    """
    Aligns flow data to the expected training dataset feature order.
    Supports both NFStream flows (live capture) and CSV flows (replay mode).
    
    Args:
        flow: Either an NFStream flow object or a CSVFlow object.
    
    Returns:
        A pandas DataFrame with a single row, containing features aligned to the
        expected dataset feature order.
    """
    # Detect if this is a CSV flow (has _data attribute with CICFlowMeter features)
    if hasattr(flow, '_data') and 'Flow Duration' in flow._data:
        # CSV replay mode - flow already has CICFlowMeter features
        return _map_csv_flow(flow)
    else:
        # Live capture mode - map NFStream to CICFlowMeter
        return _map_nfstream_flow(flow)


def _map_csv_flow(flow) -> pd.DataFrame:
    """
    Extracts features from CSV flow (already in CICFlowMeter format).
    Just needs to select and order the columns correctly.
    
    Args:
        flow: CSVFlow object with _data attribute
    
    Returns:
        Single-row DataFrame with features in correct order
    """
    # Extract only the features needed for the model in the correct order
    feature_dict = {}
    
    for col in DATASET_FEATURES:
        if col in flow._data:
            feature_dict[col] = flow._data[col]
        else:
            # Fill missing features with 0
            feature_dict[col] = 0
    
    # Return as single-row DataFrame
    return pd.DataFrame([feature_dict])


def _map_nfstream_flow(flow) -> pd.DataFrame:
    """
    Maps NFStream flow to CICFlowMeter feature format.
    Handles both direct mapping and calculated features.
    
    Args:
        flow: NFStream flow object
    
    Returns:
        Single-row DataFrame with features in correct order
    """
    aligned = {}

    # Helper to safely get attribute from flow (or 0 if missing)
    def g(attr):
        return getattr(flow, attr, 0)

    for feature in DATASET_FEATURES:
        if feature in NFSTREAM_MAPPED:
            # Direct 1-to-1 mapping
            aligned[feature] = g(NFSTREAM_MAPPED[feature])
        else:
            # Calculated features
            if feature == "Flow Bytes/s":
                aligned[feature] = (g("bidirectional_bytes") / (g("bidirectional_duration_ms") or 1)) * 1000
            elif feature == "Flow Packets/s":
                aligned[feature] = (g("bidirectional_packets") / (g("bidirectional_duration_ms") or 1)) * 1000
            elif feature == "Fwd IAT Total":
                aligned[feature] = (g("src2dst_packets") - 1) * g("src2dst_mean_piat_ms")
            elif feature == "Bwd IAT Total":
                aligned[feature] = (g("dst2src_packets") - 1) * g("dst2src_mean_piat_ms")
            elif feature == "Fwd Packets/s":
                aligned[feature] = (g("src2dst_packets") / (g("bidirectional_duration_ms") or 1)) * 1000
            elif feature == "Bwd Packets/s":
                aligned[feature] = (g("dst2src_packets") / (g("bidirectional_duration_ms") or 1)) * 1000
            elif feature == "Packet Length Variance":
                aligned[feature] = g("bidirectional_stddev_ps") * g("bidirectional_stddev_ps")
            elif feature == "Down/Up Ratio":
                aligned[feature] = g("dst2src_packets") / (g("src2dst_packets") or 1)
            elif feature == "Average Packet Size":
                aligned[feature] = g("bidirectional_bytes") / (g("bidirectional_packets") or 1)
            elif feature == "Avg Fwd Segment Size":
                aligned[feature] = g("src2dst_bytes") / (g("src2dst_packets") or 1)
            elif feature == "Avg Bwd Segment Size":
                aligned[feature] = g("dst2src_bytes") / (g("dst2src_packets") or 1)
            else:
                # Unknown feature - fill with 0
                aligned[feature] = 0

    # Return as a single-row DataFrame with index 0 to keep compatibility
    return pd.DataFrame(aligned, index=[0])
# backend/src/ml_pipeline/flow_replay.py

# -----------------------------------------------------------------------------
# Replays network flows from CIC-IDS-2017 CSV files.
# Yields flow objects compatible with the existing ML pipeline.
# Supports selecting specific row ranges for targeted testing.
# -----------------------------------------------------------------------------

import pandas as pd
import time
from typing import Iterator, Optional


class CSVFlow:
    """
    Wrapper to make CSV rows look like NFStream flow objects.
    Only needs attributes that map_features() expects.
    """
    def __init__(self, row: pd.Series):
        self._data = row.to_dict()

    def __getattr__(self, name):
        """Allow attribute access like flow.src_ip"""
        if name in self._data:
            return self._data[name]
        raise AttributeError(f"CSVFlow has no attribute '{name}'")
        
    @property
    def __dict__(self):
        """For logging/debugging"""
        return self._data


def replay_from_csv(
    csv_path: str,
    delay_ms: int = 100,
    max_flows: Optional[int] = None,
    start_row: Optional[int] = None,
    end_row: Optional[int] = None
) -> Iterator[CSVFlow]:
    """
    Replays flows from a CIC-IDS-2017 CSV file.
    
    Args:
        csv_path: Path to the CIC-IDS-2017 CSV file.
        delay_ms: Delay in milliseconds between yielding flows.
        max_flows: Optional maximum number of flows to replay. (None = all)
        start_row: Optional starting row index (0-based). If specified, replay starts here.
        end_row: Optional ending row index (0-based, exclusive). If specified, replay stops here.
        
    Yields:
        CSVFlow objects compatible with map_features()
        
    Note:
        Row range takes precedence over max_flows.
        Examples:
            start_row=0, end_row=100      -> Rows 0-99 (first 100 rows)
            start_row=1000, end_row=1100  -> Rows 1000-1099 (100 rows)
            start_row=14000, end_row=14032 -> Rows 14000-14031 (32 rows)
    """
    print(f"Loading CSV from: {csv_path}")

    try:
        # If using row range, only load those specific rows (memory efficient)
        if start_row is not None and end_row is not None:
            nrows = end_row - start_row
            print(f"Loading rows {start_row} to {end_row-1} ({nrows} rows)...")
            df = pd.read_csv(csv_path, skiprows=range(1, start_row + 1), nrows=nrows)
        else:
            # Load entire CSV
            df = pd.read_csv(csv_path)
            
    except FileNotFoundError:
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    except Exception as e:
        raise ValueError(f"Error reading CSV file: {e}")

    # Strip whitespace from column names (important for CIC-IDS-2017 CSVs)
    df.columns = df.columns.str.strip()

    # Validate required columns
    required_columns = [
        'Flow Duration',
        'Flow Bytes/s',
        'Flow Packets/s',
        'Total Fwd Packets',
        'Total Backward Packets',
        'Total Length of Fwd Packets',
        'Total Length of Bwd Packets',
        'Flow IAT Mean',
        'Flow IAT Std',
        'SYN Flag Count',
        'ACK Flag Count',
        'RST Flag Count',
        'FIN Flag Count',
        'Packet Length Mean',
        'Packet Length Std',
        'Min Packet Length',
        'Max Packet Length',
        'Label'
    ]

    missing = set(required_columns) - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing required columns: {missing}")

    print(f"Loaded {len(df)} flows from CSV.")
    
    # Show label distribution for the loaded rows
    if 'Label' in df.columns:
        print("Label distribution:")
        for label, count in df['Label'].value_counts().items():
            print(f"  {label}: {count}")

    # Apply max_flows limit if no row range was specified
    if start_row is None and end_row is None and max_flows and len(df) > max_flows:
        df = df.head(max_flows)
        print(f"Limiting replay to {max_flows} flows")

    flow_count = 0
    delay_seconds = delay_ms / 1000.0

    for idx, row in df.iterrows():
        flow_count += 1

        # Yield flow wrapped in our compatibility layer
        yield CSVFlow(row)

        # Simulate real-time flow arrival
        if delay_seconds > 0:
            time.sleep(delay_seconds)

    print(f"Replay complete: {flow_count} flows processed")
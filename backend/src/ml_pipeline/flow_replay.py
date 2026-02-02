df.columns = df.columns.str.strip()

x = df[DATASET_FEATURES]
y = df["Label"]

import pandas as pd 
from ml_pipeline.feature_mapping import DATASET_FEATURES

def replay_cic_csv(csv_path, attack_only=False):
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()

    if attack_only:
        df = df[df["Label"] != "BENIGN"]

    x = df[DATASET_FEATURES]
    y = df["Label"]
    timestamps = df.get("Timestamp", None)

    for i in range(len(df)):
        yield x.iloc[[i]], y.iloce[i], timestamps.iloce[i] if timestamps is not None else None
        
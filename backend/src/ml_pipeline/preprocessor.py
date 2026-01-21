# -----------------------------------------------------------------------------
# Defines logic to scale numeric features.
# Loads the scaler model from the specified path passed to the constructor.
# -----------------------------------------------------------------------------

import joblib
import pandas as pd

class Preprocessor:

     # constructor
    def __init__(self, scaler_path):
        self.scaler = joblib.load(scaler_path)

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Scales numeric features using the saved scaler.
        Args:
            df: DataFrame containing the features to be scaled.
        Returns:
            A pandas DataFrame with scaled features.
        """
        scaled = self.scaler.transform(df)
        return pd.DataFrame(scaled, columns=df.columns, index=df.index)

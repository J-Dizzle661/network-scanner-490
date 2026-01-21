# -----------------------------------------------------------------------------
# Defines logic to apply the trained ML model to preprocessed flow data and 
# output prediction results.
# Loads the random forest model and label encoder from the specified paths 
# passed to the constructor.
# -----------------------------------------------------------------------------

import joblib
import numpy as np

class ModelInference:
    def __init__(self, model_path, encoder_path):
        self.model = joblib.load(model_path)
        self.encoder = joblib.load(encoder_path)

    def predict(self, X):
        """
        Accepts a DataFrame and returns a list of predicted labels.
        Args:
            X: DataFrame containing preprocessed features.
        Returns:
            A list of predicted labels.
        """
        preds = self.model.predict(X)
        labels = self.encoder.inverse_transform(preds)
        return labels

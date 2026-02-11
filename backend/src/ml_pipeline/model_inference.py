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
    
    def predict_with_confidence(self, X):
        """
        Accepts a DataFrame and returns predicted labels with confidence scores.
        Args:
            X: DataFrame containing preprocessed features.
        Returns:
            A tuple of (labels, confidences) where confidences are probabilities.
        """
        preds = self.model.predict(X)
        labels = self.encoder.inverse_transform(preds)
        
        try:
            # Try to get prediction probabilities (works for most classifiers)
            probabilities = self.model.predict_proba(X)
            # Confidence is the max probability for each prediction
            confidences = np.max(probabilities, axis=1)
        except AttributeError:
            # Model doesn't support predict_proba
            confidences = np.array([None] * len(preds))
        
        return labels, confidences

import pandas as pd
import numpy as np


class AnomalyDetector:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def detect_anomalies(self, col: str, threshold: float = 3.0) -> dict:
        """Detect statistical anomalies in a numeric column using Z-Score."""
        if self.df is None or self.df.empty:
            return {"error": "Empty or invalid DataFrame"}

        if col not in self.df.columns:
            return {"error": f"Column '{col}' not found"}

        series = self.df[col].dropna()
        if series.empty:
            return {"error": f"No data in column '{col}'"}

        mean = series.mean()
        std = series.std()

        if std == 0:
            return {"message": "Standard deviation is zero; anomaly detection skipped."}

        z_scores = (series - mean) / std
        anomalies = self.df.loc[z_scores.abs() > threshold]

        anomaly_indices = anomalies.index.tolist()
        anomaly_values = anomalies[col].tolist()

        # anomaly_percentage is a true percentage (0–100), not a fraction
        anomaly_percentage = (len(anomalies) / len(series)) * 100

        return {
            "column":             col,
            "mean":               float(mean),
            "std":                float(std),
            "anomaly_count":      len(anomalies),
            "anomaly_percentage": float(round(anomaly_percentage, 2)),
            "detected_indices":   anomaly_indices,
            "detected_values":    [float(x) for x in anomaly_values],
        }

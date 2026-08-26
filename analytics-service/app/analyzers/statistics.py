import pandas as pd
import numpy as np


class StatisticalAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def analyze(self) -> dict:
        """Compute descriptive statistics for numerical and categorical columns."""
        if self.df is None or self.df.empty:
            return {"error": "Empty or invalid DataFrame"}

        stats = {
            "numerical":   {},
            "categorical": {},
        }

        # ── Numerical statistics ─────────────────────────────────────────── #
        num_cols = self.df.select_dtypes(include=[np.number]).columns
        for col in num_cols:
            series = self.df[col].dropna()
            if not series.empty:
                stats["numerical"][col] = {
                    "mean":     float(series.mean()),
                    "median":   float(series.median()),
                    "std":      float(series.std()) if len(series) > 1 else 0.0,
                    "min":      float(series.min()),
                    "max":      float(series.max()),
                    "skewness": float(series.skew())  if len(series) > 2 else 0.0,
                    "kurtosis": float(series.kurt())  if len(series) > 3 else 0.0,
                }

        # ── Categorical statistics ────────────────────────────────────────── #
        cat_cols = self.df.select_dtypes(exclude=[np.number]).columns
        for col in cat_cols:
            series = self.df[col].dropna()
            if not series.empty:
                value_counts = series.value_counts()
                top_values   = value_counts.head(5).to_dict()
                top_val      = str(value_counts.idxmax()) if not value_counts.empty else None
                unique_cnt   = int(series.nunique())

                stats["categorical"][col] = {
                    # canonical names
                    "unique_values":       unique_cnt,
                    "top_value":           top_val,
                    "top_value_frequency": int(value_counts.max()) if not value_counts.empty else 0,
                    "distribution":        {str(k): int(v) for k, v in top_values.items()},

                    # frontend-friendly aliases
                    "unique_count": unique_cnt,   # expected by App.jsx line 915
                    "top":          top_val,       # expected by App.jsx line 916
                }

        return stats

import pandas as pd
import numpy as np

class KPIAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def calculate_kpis(self) -> dict:
        """Calculate key performance indicators (KPIs) from numeric columns."""
        if self.df is None or self.df.empty:
            return {"error": "Empty or invalid DataFrame"}

        kpis = {}
        num_cols = self.df.select_dtypes(include=[np.number]).columns
        
        for col in num_cols:
            series = self.df[col].dropna()
            if not series.empty:
                kpis[f"total_{col}"] = float(series.sum())
                kpis[f"average_{col}"] = float(series.mean())
                kpis[f"max_{col}"] = float(series.max())
                
        return kpis

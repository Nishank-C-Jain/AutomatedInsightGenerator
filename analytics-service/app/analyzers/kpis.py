import pandas as pd
import numpy as np


class KPIAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def calculate_kpis(self) -> dict:
        """
        Calculate key performance indicators (KPIs) from numeric columns.

        Returns a nested dict shaped as:
            {
                "<column_name>": {
                    "total":   float,
                    "average": float,
                    "max":     float,
                    "min":     float,
                    "count":   int,
                    "std":     float
                },
                ...
            }
        """
        if self.df is None or self.df.empty:
            return {}

        kpis: dict = {}
        num_cols = self.df.select_dtypes(include=[np.number]).columns

        for col in num_cols:
            series = self.df[col].dropna()
            if series.empty:
                continue

            kpis[col] = {
                "total":   float(series.sum()),
                "average": float(series.mean()),
                "max":     float(series.max()),
                "min":     float(series.min()),
                "count":   int(series.count()),
                "std":     float(series.std()) if len(series) > 1 else 0.0,
            }

        return kpis

import pandas as pd
import numpy as np

class DataProfiler:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def profile(self) -> dict:
        """Generate a high-level profile of the dataset."""
        if self.df is None or self.df.empty:
            return {"error": "Empty or invalid DataFrame"}
        
        profile_data = {
            "num_rows": int(self.df.shape[0]),
            "num_cols": int(self.df.shape[1]),
            "columns": [],
            "memory_usage_bytes": int(self.df.memory_usage(deep=True).sum())
        }
        
        for col in self.df.columns:
            col_type = str(self.df[col].dtype)
            missing_count = int(self.df[col].isnull().sum())
            missing_pct = float(missing_count / len(self.df))
            
            col_info = {
                "name": col,
                "type": col_type,
                "missing_count": missing_count,
                "missing_pct": missing_pct,
                "unique_count": int(self.df[col].nunique())
            }
            profile_data["columns"].append(col_info)
            
        return profile_data

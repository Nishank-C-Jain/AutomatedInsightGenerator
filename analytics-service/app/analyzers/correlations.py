import pandas as pd
import numpy as np

class CorrelationAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def analyze(self, method: str = 'pearson') -> dict:
        """Calculate correlations between numerical variables."""
        if self.df is None or self.df.empty:
            return {"error": "Empty or invalid DataFrame"}

        num_cols = self.df.select_dtypes(include=[np.number])
        if num_cols.shape[1] < 2:
            return {"message": "Fewer than 2 numeric columns; correlation analysis skipped."}

        corr_matrix = num_cols.corr(method=method)
        
        # Find strongest correlations (excluding self-correlation)
        strong_correlations = []
        cols = corr_matrix.columns
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                val = corr_matrix.iloc[i, j]
                if not pd.isna(val) and abs(val) > 0.4:
                    strong_correlations.append({
                        "var1": cols[i],
                        "var2": cols[j],
                        "correlation": float(val),
                        "strength": "strong" if abs(val) > 0.7 else "moderate"
                    })

        # Sort by strength desc
        strong_correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)

        return {
            "correlation_matrix": corr_matrix.replace({np.nan: None}).to_dict(),
            "strong_correlations": strong_correlations
        }

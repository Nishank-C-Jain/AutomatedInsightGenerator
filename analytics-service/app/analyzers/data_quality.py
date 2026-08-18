import pandas as pd

class DataQualityAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def analyze(self) -> dict:
        """Evaluate the data quality of the dataset."""
        if self.df is None or self.df.empty:
            return {"error": "Empty or invalid DataFrame"}

        num_rows = len(self.df)
        duplicate_count = int(self.df.duplicated().sum())
        
        column_issues = {}
        for col in self.df.columns:
            missing = int(self.df[col].isnull().sum())
            missing_pct = float(missing / num_rows) if num_rows > 0 else 0
            
            issues = []
            if missing_pct > 0.5:
                issues.append(f"High missingness ({missing_pct:.1%})")
            if self.df[col].nunique() == 1:
                issues.append("Constant column (only 1 unique value)")
                
            if issues:
                column_issues[col] = issues

        quality_score = max(0.0, 1.0 - (duplicate_count / num_rows if num_rows > 0 else 0) - (len(column_issues) / len(self.df.columns) if len(self.df.columns) > 0 else 0))

        return {
            "duplicate_rows": duplicate_count,
            "duplicate_pct": float(duplicate_count / num_rows) if num_rows > 0 else 0.0,
            "column_issues": column_issues,
            "quality_score": float(quality_score)
        }

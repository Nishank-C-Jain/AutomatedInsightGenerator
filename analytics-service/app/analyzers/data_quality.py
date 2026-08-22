import pandas as pd
import numpy as np

class DataQualityAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def analyze(self) -> dict:
        """Evaluate the data quality of the dataset."""
        if self.df is None or self.df.empty:
            return {"error": "Empty or invalid DataFrame"}

        num_rows = len(self.df)
        num_cols = len(self.df.columns)

        # 1. Duplicates
        duplicate_count = int(self.df.duplicated().sum())
        duplicate_percentage = round((duplicate_count / num_rows) * 100, 2) if num_rows > 0 else 0.0

        # Initial metrics lists
        missing_values = []
        constant_columns = []
        high_cardinality = []
        outliers = []
        column_classification = []

        # Iterate over columns to compute stats
        for col in self.df.columns:
            series = self.df[col]
            
            # --- Missing values ---
            missing = int(series.isna().sum())
            missing_pct = (missing / num_rows) * 100 if num_rows > 0 else 0.0
            if missing > 0:
                missing_values.append({
                    "column": str(col),
                    "missing_count": missing,
                    "missing_percentage": round(missing_pct, 2)
                })

            # --- Constant columns ---
            nunique = int(series.nunique(dropna=True))
            if nunique == 1:
                constant_columns.append(str(col))

            # --- Column Classification ---
            col_type = "text"
            if pd.api.types.is_bool_dtype(series):
                col_type = "boolean"
            elif pd.api.types.is_numeric_dtype(series):
                # Check if it's boolean hidden as 0/1
                unique_vals = series.dropna().unique()
                if set(unique_vals).issubset({0, 1}) and len(unique_vals) <= 2:
                    col_type = "boolean"
                else:
                    col_type = "numeric"
            elif pd.api.types.is_datetime64_any_dtype(series) or str(series.dtype).startswith('datetime'):
                col_type = "datetime"
            else:
                # Differentiate categorical vs text
                unique_pct = (nunique / num_rows) * 100 if num_rows > 0 else 0.0
                if unique_pct < 30.0 or nunique < 20:
                    col_type = "categorical"
                else:
                    col_type = "text"

            column_classification.append({
                "column": str(col),
                "classification": col_type
            })

            # --- High Cardinality ---
            unique_pct = (nunique / num_rows) * 100 if num_rows > 0 else 0.0
            if col_type in ["categorical", "text"] and unique_pct > 50.0 and num_rows > 5:
                high_cardinality.append({
                    "column": str(col),
                    "unique_count": nunique,
                    "unique_percentage": round(unique_pct, 2)
                })

            # --- Outliers (Numeric columns) ---
            if pd.api.types.is_numeric_dtype(series) and col_type == "numeric" and num_rows > 3:
                q1 = series.quantile(0.25)
                q3 = series.quantile(0.75)
                iqr = q3 - q1
                if iqr > 0:
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    outlier_mask = (series < lower_bound) | (series > upper_bound)
                    outlier_count = int(outlier_mask.sum())
                    outlier_pct = (outlier_count / num_rows) * 100
                    if outlier_count > 0:
                        outliers.append({
                            "column": str(col),
                            "outlier_count": outlier_count,
                            "outlier_percentage": round(outlier_pct, 2)
                        })

        # --- Quality Score Calculation ---
        score = 100.0
        if num_rows > 0:
            # Deduct for duplicates (up to 30 points)
            score -= (duplicate_count / num_rows) * 30.0
            
            # Deduct for missing values (up to 30 points)
            total_missing = sum(self.df[col].isna().sum() for col in self.df.columns)
            total_cells = num_rows * num_cols
            if total_cells > 0:
                score -= (total_missing / total_cells) * 30.0
                
            # Deduct for constant columns (up to 20 points)
            if num_cols > 0:
                score -= (len(constant_columns) / num_cols) * 20.0
                
            # Deduct for outliers (up to 20 points)
            numeric_cols = [c for c in column_classification if c["classification"] == "numeric"]
            if len(numeric_cols) > 0 and len(outliers) > 0:
                avg_outlier_pct = sum(o["outlier_percentage"] for o in outliers) / len(numeric_cols)
                score -= min(20.0, avg_outlier_pct * 0.5)

        score = max(0.0, min(100.0, score))
        score = round(score, 1)

        return {
            "score": score,
            "missing_values": missing_values,
            "duplicates": {
                "duplicate_count": duplicate_count,
                "duplicate_percentage": duplicate_percentage
            },
            "constant_columns": constant_columns,
            "high_cardinality": high_cardinality,
            "outliers": outliers,
            "column_classification": column_classification
        }

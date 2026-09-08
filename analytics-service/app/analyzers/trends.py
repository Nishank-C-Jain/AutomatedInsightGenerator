import pandas as pd
import numpy as np


class TrendAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def analyze_trends(self, date_col: str, value_col: str) -> dict:
        """Analyze trends in a numeric column over a time column."""
        if self.df is None or self.df.empty:
            return {"error": "Empty or invalid DataFrame"}

        if date_col not in self.df.columns or value_col not in self.df.columns:
            return {"error": f"Columns '{date_col}' or '{value_col}' not found"}

        # Copy and sort by date
        temp_df = self.df[[date_col, value_col]].copy()
        temp_df[date_col] = pd.to_datetime(
            temp_df[date_col],
            errors="coerce"
        )

        temp_df = temp_df.dropna(subset=[date_col])

        if temp_df.empty:
            return {
                "status": "skipped",
                "reason": f"No valid dates found in '{date_col}'"
            }    
        temp_df = temp_df.sort_values(by=date_col).dropna()

        if len(temp_df) < 2:
            return {"error": "Insufficient data points for trend analysis"}

        # Linear regression to find trend slope
        x = np.arange(len(temp_df))
        y = temp_df[value_col].values.astype(float)

        slope, intercept = np.polyfit(x, y, 1)

        # Fitted (smoothed) trend line values — used by the SVG chart in the UI
        trend_values = [float(slope * xi + intercept) for xi in x]

        # Percentage change first → last
        start_val = float(y[0])
        end_val   = float(y[-1])
        pct_change = float((end_val - start_val) / start_val) if start_val != 0 else 0.0

        direction = "upward" if slope > 0 else "downward" if slope < 0 else "stable"

        return {
            "slope":        float(slope),
            "intercept":    float(intercept),
            "direction":    direction,
            "pct_change":   pct_change,
            "start_value":  start_val,
            "end_value":    end_val,
            # Array of fitted values — consumed by the Trends & Forecasting SVG chart
            "trend_values": trend_values,
        }

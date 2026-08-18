import pandas as pd
import numpy as np

class Forecaster:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def forecast_linear(self, date_col: str, value_col: str, steps: int = 5) -> dict:
        """Generate a simple linear forecast based on historical points."""
        if self.df is None or self.df.empty:
            return {"error": "Empty or invalid DataFrame"}

        if date_col not in self.df.columns or value_col not in self.df.columns:
            return {"error": f"Columns '{date_col}' or '{value_col}' not found"}

        # Copy, convert dates, and sort
        temp_df = self.df[[date_col, value_col]].copy()
        temp_df[date_col] = pd.to_datetime(temp_df[date_col])
        temp_df = temp_df.sort_values(by=date_col).dropna()

        if len(temp_df) < 3:
            return {"error": "Need at least 3 data points to forecast"}

        x = np.arange(len(temp_df))
        y = temp_df[value_col].values
        
        slope, intercept = np.polyfit(x, y, 1)

        last_date = temp_df[date_col].max()
        # Guess date frequency
        inferred_freq = pd.infer_freq(temp_df[date_col]) or 'D'

        forecast_dates = pd.date_range(start=last_date, periods=steps + 1, freq=inferred_freq)[1:]
        forecast_values = []

        for i in range(1, steps + 1):
            next_idx = len(temp_df) + i - 1
            val = slope * next_idx + intercept
            forecast_values.append(float(val))

        return {
            "forecast_dates": [dt.strftime('%Y-%m-%d') for dt in forecast_dates],
            "forecast_values": forecast_values,
            "method": "Linear Regression"
        }

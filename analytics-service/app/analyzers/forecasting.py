import pandas as pd
import numpy as np


class Forecaster:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def forecast_linear(self, date_col: str, value_col: str, steps: int = 5) -> dict:
        """Generate a simple linear forecast based on historical data."""
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
        y = temp_df[value_col].values.astype(float)

        slope, intercept = np.polyfit(x, y, 1)

        last_date = temp_df[date_col].max()
        # Guess date frequency
        inferred_freq = pd.infer_freq(temp_df[date_col]) or "D"

        forecast_dates = pd.date_range(
            start=last_date, periods=steps + 1, freq=inferred_freq
        )[1:]

        # Build `forecast` as a list of {date, value} objects — matches frontend shape
        forecast: list = []
        for i, dt in enumerate(forecast_dates, start=1):
            next_idx = len(temp_df) + i - 1
            val = float(slope * next_idx + intercept)
            forecast.append({
                "date":  dt.strftime("%Y-%m-%d"),
                "value": val,
            })

        last_val   = float(y[-1])
        final_val  = forecast[-1]["value"] if forecast else last_val
        direction  = "increase" if final_val > last_val else "decrease" if final_val < last_val else "flat"
        change_pct = abs((final_val - last_val) / last_val * 100) if last_val != 0 else 0.0

        return {
            # `forecast` is the key the frontend reads (App.jsx line 1067)
            "forecast": forecast,
            # Kept for compatibility / debugging
            "forecast_values": [f["value"] for f in forecast],
            "forecast_dates":  [f["date"]  for f in forecast],
            "method":          "Linear Regression",
            "forecast_summary": (
                f"Linear projection over {steps} periods suggests a "
                f"{direction} of {change_pct:.1f}% from current value."
            ),
        }

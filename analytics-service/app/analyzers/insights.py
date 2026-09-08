import pandas as pd

class InsightSynthesizer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def generate_insights(self, profile: dict, stats: dict, anomalies: dict = None, correlations: dict = None, trends: dict = None) -> list:
        """Synthesize statistical and structural results into text-based insights."""
        insights = []

        # Row and col info
        insights.append(
            f"The dataset consists of {profile.get('num_rows')} records and {profile.get('num_cols')} variables."
        )

        # Missingness insight
        high_missing = [col['name'] for col in profile.get('columns', []) if col['missing_pct'] > 0.1]
        if high_missing:
            insights.append(
                f"Warning: Columns {', '.join(high_missing)} have over 10% missing values."
            )

        # Numerical statistics insights
        numerical_stats = stats.get('numerical', {})
        for col, s in list(numerical_stats.items())[:3]: # Cap at 3 columns for overview
            insights.append(
                f"Variable '{col}' has an average value of {s['mean']:.2f} (ranging from {s['min']:.2f} to {s['max']:.2f})."
            )

        # Anomaly detection insights
        if anomalies and anomalies.get('anomaly_count', 0) > 0:
            col = anomalies.get('column')
            count = anomalies.get('anomaly_count')
            pct = anomalies.get('anomaly_percentage', 0.0)
            insights.append(
                f"Detected {count} anomalies ({pct:.1%}) in column '{col}'."
            )

        return insights

import pandas as pd

class RecommendationGenerator:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def generate_recommendations(self, insights: list, quality: dict = None) -> list:
        """Generate recommendations based on insights and quality checks."""
        recommendations = []

        # Data quality recommendation
        if quality:
            dup_pct = quality.get('duplicate_pct', 0.0)
            if dup_pct > 0.05:
                recommendations.append({
                    "priority": "High",
                    "action": "Deduplicate data",
                    "description": f"{dup_pct:.1%} of rows are duplicate. Deduplicate rows to avoid skewing analyses."
                })
            
            issues = quality.get('column_issues', {})
            if issues:
                recommendations.append({
                    "priority": "Medium",
                    "action": "Handle missing values",
                    "description": f"Columns {', '.join(issues.keys())} have data quality flags. Consider imputation or removal."
                })

        # Generic analytics recommendations
        has_anomalies = any("anomaly" in insight.lower() or "warning" in insight.lower() for insight in insights)
        if has_anomalies:
            recommendations.append({
                "priority": "High",
                "action": "Investigate outliers",
                "description": "Examine anomalous records to identify possible telemetry errors or novel behavior."
            })

        # Base recommendation if list is empty
        if not recommendations:
            recommendations.append({
                "priority": "Low",
                "action": "Continue monitoring",
                "description": "No major data quality or statistical issues detected. Continue regular intake monitoring."
            })

        return recommendations

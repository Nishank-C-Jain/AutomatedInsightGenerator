import pandas as pd


class RecommendationGenerator:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def generate_recommendations(self, insights: list, quality: dict = None) -> list:
        """Generate prioritised recommendations based on insights and data quality."""
        recommendations = []

        # ── Data quality checks ───────────────────────────────────────────── #
        if quality:
            dup_pct = quality.get("duplicate_pct", 0.0)   # fraction (0–1)
            if dup_pct > 0.05:
                recommendations.append({
                    "priority":    "high",
                    "action":      "Deduplicate data",
                    "description": (
                        f"{dup_pct:.1%} of rows are exact duplicates. "
                        "Remove duplicates to prevent skewed aggregations and inflated KPI totals."
                    ),
                })

            issues = quality.get("column_issues", {})
            if issues:
                col_list = ", ".join(f"'{c}'" for c in list(issues.keys())[:5])
                extra    = f" (+{len(issues) - 5} more)" if len(issues) > 5 else ""
                recommendations.append({
                    "priority":    "medium",
                    "action":      "Handle missing values",
                    "description": (
                        f"Column(s) {col_list}{extra} contain missing data. "
                        "Consider mean/median imputation for numeric columns or mode imputation "
                        "for categorical ones, or drop rows if missingness exceeds 30%."
                    ),
                })

        # ── Anomaly / warning insights ────────────────────────────────────── #
        has_anomalies = any(
            "anomaly" in insight.lower() or "warning" in insight.lower()
            for insight in (insights or [])
            if isinstance(insight, str)
        )
        if has_anomalies:
            recommendations.append({
                "priority":    "high",
                "action":      "Investigate outliers",
                "description": (
                    "Statistical anomalies were detected in one or more numeric columns. "
                    "Review flagged records for data entry errors, sensor glitches, or "
                    "genuinely rare events that may warrant separate analysis."
                ),
            })

        # ── Skewness insight (if stats available via insights text) ─────────
        has_skew = any("skew" in insight.lower() for insight in (insights or []) if isinstance(insight, str))
        if has_skew:
            recommendations.append({
                "priority":    "medium",
                "action":      "Address skewed distributions",
                "description": (
                    "One or more variables show high skewness (|skew| > 1). "
                    "Consider log or Box-Cox transforms before applying regression or "
                    "clustering models that assume near-normal distributions."
                ),
            })

        # ── Correlation insight ────────────────────────────────────────────── #
        has_corr = any("correlat" in insight.lower() for insight in (insights or []) if isinstance(insight, str))
        if has_corr:
            recommendations.append({
                "priority":    "low",
                "action":      "Review correlated features",
                "description": (
                    "Strong correlations between features were detected. "
                    "Consider removing or combining highly correlated variables before "
                    "building predictive models to reduce multicollinearity."
                ),
            })

        # ── Baseline recommendation when everything looks clean ─────────────
        if not recommendations:
            recommendations.append({
                "priority":    "low",
                "action":      "Continue monitoring",
                "description": (
                    "No major data quality or statistical issues were detected. "
                    "Continue regular data intake monitoring and schedule periodic re-analysis "
                    "as new records arrive."
                ),
            })

        return recommendations

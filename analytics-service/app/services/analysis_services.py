import pandas as pd
import numpy as np

from app.analyzers.data_quality import DataQualityAnalyzer
from app.analyzers.statistics import StatisticalAnalyzer
from app.analyzers.trends import TrendAnalyzer
from app.analyzers.anomalies import AnomalyDetector
from app.analyzers.correlations import CorrelationAnalyzer
from app.analyzers.kpis import KPIAnalyzer
from app.analyzers.forecasting import Forecaster
from app.analyzers.insights import InsightSynthesizer
from app.analyzers.recommendations import RecommendationGenerator
from app.intelligence.context_builder import AIContextBuilder
from app.services.llm_service import LLMService


def analyze_dataset(df: pd.DataFrame) -> dict:
    """
    Run all analyzers on a DataFrame and return a unified results dict.

    Pipeline:
        1. DataQualityAnalyzer  — missing values, duplicates, outliers, score
        2. StatisticalAnalyzer  — descriptive stats for numeric & categorical cols
        3. CorrelationAnalyzer  — pearson correlation matrix + strong pairs
        4. KPIAnalyzer          — sum / mean / max per numeric column
        5. TrendAnalyzer        — linear trend over time (if date col present)
        6. Forecaster           — 5-step linear forecast  (if date col present)
        7. AnomalyDetector      — Z-score anomalies for every numeric column
        8. InsightSynthesizer   — human-readable insight strings
        9. RecommendationGenerator — prioritised action items
    """

    results: dict = {}

    # ------------------------------------------------------------------ #
    # 1. Data Quality                                                      #
    # ------------------------------------------------------------------ #
    data_quality = DataQualityAnalyzer(df).analyze()
    results["data_quality"] = data_quality

    # ------------------------------------------------------------------ #
    # 2. Statistics                                                        #
    # ------------------------------------------------------------------ #
    statistics = StatisticalAnalyzer(df).analyze()
    results["statistics"] = statistics

    # ------------------------------------------------------------------ #
    # 3. Correlations                                                      #
    # ------------------------------------------------------------------ #
    results["correlations"] = CorrelationAnalyzer(df).analyze()

    # ------------------------------------------------------------------ #
    # 4. KPIs                                                             #
    # ------------------------------------------------------------------ #
    results["kpis"] = KPIAnalyzer(df).calculate_kpis()

    # ------------------------------------------------------------------ #
    # 5 & 6. Trends + Forecasting (require a date column + numeric col)   #
    # ------------------------------------------------------------------ #
    datetime_cols = df.select_dtypes(include=["datetime", "datetimetz"]).columns.tolist()

    # Also try to infer datetime from object columns
    if not datetime_cols:
        for col in df.select_dtypes(include=["object"]).columns:
            try:
                sample = df[col].dropna().head(20)

                if not sample.empty:
                    converted = pd.to_datetime(
                        sample,
                        format="mixed",
                        errors="coerce"
                    )

                    valid_ratio = converted.notna().mean()

                    if valid_ratio >= 0.8:
                        datetime_cols.append(col)
            except Exception:
                pass

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    if datetime_cols and numeric_cols:
        date_col = datetime_cols[0]
        value_col = numeric_cols[0]
        results["trends"] = TrendAnalyzer(df).analyze_trends(date_col, value_col)
        results["forecasting"] = Forecaster(df).forecast_linear(date_col, value_col)
    else:
        results["trends"] = {"message": "No suitable date and numeric columns found."}
        results["forecasting"] = {"message": "No suitable date and numeric columns found."}

    # ------------------------------------------------------------------ #
    # 7. Anomaly Detection — run for every numeric column                 #
    # ------------------------------------------------------------------ #
    if numeric_cols:
        anomalies_per_col = {}
        for col in numeric_cols:
            anomalies_per_col[col] = AnomalyDetector(df).detect_anomalies(col)
        results["anomalies"] = anomalies_per_col
    else:
        results["anomalies"] = {"message": "No numeric columns found."}

    # ------------------------------------------------------------------ #
    # 8. Insights
    # ------------------------------------------------------------------ #
    # Adapter: InsightSynthesizer expects:
    #   profile      → dataset structure + missing value information
    #   stats        → numerical statistics
    #   anomalies    → one representative anomaly result
    #   correlations → correlation analyzer results
    #   trends       → trend analyzer results

    insight_profile = _build_insight_profile(
        df,
        data_quality
    )

    first_anomaly = _pick_representative_anomaly(
        results["anomalies"]
    )

    insights = InsightSynthesizer(
        df
    ).generate_insights(
        profile=insight_profile,
        stats=statistics,
        anomalies=first_anomaly,
        correlations=results["correlations"],
        trends=results["trends"],
    )

    results["insights"] = insights

    # ------------------------------------------------------------------ #
    # 9. Recommendations
    # ------------------------------------------------------------------ #
    # Adapter: RecommendationGenerator expects:
    #   quality → { duplicate_pct, column_issues: { col: reason } }
    rec_quality = _build_rec_quality(data_quality)
    insight_messages = [
        insight["message"]
        for insight in insights
        if isinstance(insight, dict)
        and insight.get("message")
    ]
    recommendations = RecommendationGenerator(df).generate_recommendations(
        insights=insight_messages,
        quality=rec_quality,
    )
    results["recommendations"] = recommendations

    # ------------------------------------------------------------------ #
    # 10. AI-ready context                                                 #
    # ------------------------------------------------------------------ #
    ai_context = AIContextBuilder().build(results)

    results["ai_context"] = ai_context

    # ------------------------------------------------------------------ #
    # 11. Gemini AI Analysis Summary                                       #
    # ------------------------------------------------------------------ #
    try:
        summary_text = LLMService().generate_analysis_summary(ai_context)
        results["ai_analysis"] = {"summary": summary_text}
    except Exception as e:
        print(f"[AI Analysis] Gemini summary skipped: {e}")
        results["ai_analysis"] = {"summary": None}

    return results


# --------------------------------------------------------------------------- #
# Private adapter helpers                                                      #
# --------------------------------------------------------------------------- #

def _build_insight_profile(df: pd.DataFrame, data_quality: dict) -> dict:
    """
    Convert DataQualityAnalyzer output into the shape expected by
    InsightSynthesizer.generate_insights(profile=...).

    Expected shape:
        {
            "num_rows": int,
            "num_cols": int,
            "columns": [{"name": str, "missing_pct": float}, ...]
        }
    """
    num_rows, num_cols = df.shape

    # Build per-column missing_pct lookup from data_quality["missing_values"]
    missing_lookup: dict = {}
    for entry in data_quality.get("missing_values", []):
        col_name = entry.get("column", "")
        # DataQualityAnalyzer stores missing_percentage as a plain % (0-100)
        missing_pct = entry.get("missing_percentage", 0.0) / 100.0
        missing_lookup[col_name] = missing_pct

    columns = [
        {"name": col, "missing_pct": missing_lookup.get(col, 0.0)}
        for col in df.columns
    ]

    return {
        "num_rows": num_rows,
        "num_cols": num_cols,
        "columns": columns,
    }


def _build_rec_quality(data_quality: dict) -> dict:
    """
    Convert DataQualityAnalyzer output into the shape expected by
    RecommendationGenerator.generate_recommendations(quality=...).

    Expected shape:
        {
            "duplicate_pct": float,           # fraction (0-1)
            "column_issues": { col: reason }  # columns with quality flags
        }
    """
    duplicates = data_quality.get("duplicates", {})
    # DataQualityAnalyzer stores duplicate_percentage as a plain % (0-100)
    dup_pct_raw = duplicates.get("duplicate_percentage", 0.0)
    duplicate_pct = dup_pct_raw / 100.0

    # Build column_issues from the missing_values list
    column_issues: dict = {}
    for entry in data_quality.get("missing_values", []):
        col = entry.get("column", "")
        pct = entry.get("missing_percentage", 0.0)
        if pct > 0:
            column_issues[col] = f"{pct:.1f}% missing"

    return {
        "duplicate_pct": duplicate_pct,
        "column_issues": column_issues,
    }


def _pick_representative_anomaly(anomalies) -> dict | None:
    """
    From the per-column anomaly dict returned by step 7, select the column
    with the most detected anomalies for InsightSynthesizer to highlight.
    Returns None if anomaly detection was skipped or no anomalies were found.
    """
    if not isinstance(anomalies, dict):
        return None

    # When no numeric cols exist anomalies == {"message": "..."}
    if "message" in anomalies or "error" in anomalies:
        return None

    best = None
    best_count = 0
    for col_result in anomalies.values():
        if isinstance(col_result, dict):
            count = col_result.get("anomaly_count", 0)
            if count > best_count:
                best_count = count
                best = col_result

    return best
from app.analyzers.data_quality import DataQualityAnalyzer
from app.analyzers.statistics import StatisticalAnalyzer
from app.analyzers.trends import TrendAnalyzer
from app.analyzers.anomalies import AnomalyDetector
from app.analyzers.correlations import CorrelationAnalyzer
from app.analyzers.kpis import KPIAnalyzer
from app.analyzers.forecasting import Forecaster
from app.analyzers.insights import InsightSynthesizer
from app.analyzers.recommendations import RecommendationGenerator


def analyze_dataset(df):

    results = {}

    results["data_quality"] = DataQualityAnalyzer(df).analyze()
    results["statistics"] = StatisticalAnalyzer(df).analyze()
    results["correlations"] = CorrelationAnalyzer(df).analyze()
    results["kpis"] = KPIAnalyzer(df).calculate_kpis()

    # Find columns for specific analyzers
    datetime_cols = df.select_dtypes(include=['datetime', 'datetimetz']).columns.tolist()
    if not datetime_cols:
        for col in df.select_dtypes(include=['object']).columns:
            try:
                pd.to_datetime(df[col].dropna().head())
                datetime_cols.append(col)
                break
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

    if numeric_cols:
        results["anomalies"] = AnomalyDetector(df).detect_anomalies(numeric_cols[0])
    else:
        results["anomalies"] = {"message": "No numeric columns found."}

    # Generate insights from all analysis results
    results["insights"] = InsightSynthesizer(df).generate_insights(
        profile=results["data_quality"],
        stats=results["statistics"],
        anomalies=results.get("anomalies")
    )

    # Generate recommendations
    results["recommendations"] = RecommendationGenerator(df).generate_recommendations(
        insights=results["insights"],
        quality=results["data_quality"]
    )

    return results
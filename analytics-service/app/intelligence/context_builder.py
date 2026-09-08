from typing import Any, Dict, List


class AIContextBuilder:
    """
    Builds a compact, structured context from analytics results.

    This context will later be sent to an LLM for:
    - executive summaries
    - explanations
    - recommendations
    - natural-language Q&A
    """

    def build(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "dataset_summary": self._dataset_summary(analysis_results),
            "key_insights": self._key_insights(analysis_results),
            "kpis": self._safe_get(analysis_results, "kpis"),
            "trends": self._safe_get(analysis_results, "trends"),
            "correlations": self._safe_get(analysis_results, "correlations"),
            "anomalies": self._safe_get(analysis_results, "anomalies"),
            "data_quality": self._safe_get(analysis_results, "data_quality"),
            "recommendations": self._safe_get(
                analysis_results,
                "recommendations"
            ),
        }

    def _dataset_summary(
        self,
        analysis_results: Dict[str, Any]
    ) -> Dict[str, Any]:

        insights = analysis_results.get("insights", [])

        overview = next(
            (
                insight
                for insight in insights
                if isinstance(insight, dict)
                and insight.get("type") == "dataset_overview"
            ),
            None
        )

        if not overview:
            return {}

        details = overview.get("details", {})

        return {
            "row_count": details.get("row_count"),
            "column_count": details.get("column_count"),
        }

    def _key_insights(
        self,
        analysis_results: Dict[str, Any]
    ) -> List[Dict[str, Any]]:

        insights = analysis_results.get("insights", [])

        structured = [
            insight
            for insight in insights
            if isinstance(insight, dict)
        ]

        priority = {
            "high": 3,
            "medium": 2,
            "low": 1,
        }

        structured.sort(
            key=lambda x: priority.get(
                x.get("severity", "low"),
                1
            ),
            reverse=True,
        )

        return structured[:10]

    def _safe_get(
        self,
        analysis_results: Dict[str, Any],
        key: str
    ) -> Any:

        value = analysis_results.get(key)

        if value is None:
            return {}

        return value
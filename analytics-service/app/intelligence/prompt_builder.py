import json
from typing import Any, Dict, List


class PromptBuilder:
    """
    Converts verified analytics context into a controlled
    prompt that can later be sent to an LLM.
    """

    SYSTEM_INSTRUCTIONS = """
You are an AI data analyst.

Your job is to explain the supplied analytical results clearly
and accurately.

Rules:
1. Use only the supplied analytics context.
2. Never invent numbers, columns, trends, causes, or relationships.
3. Do not claim causation from correlation.
4. Clearly distinguish facts from possible interpretations.
5. If the context is insufficient, say so.
6. Prioritize important anomalies, trends, correlations, KPIs,
   and data-quality issues.
7. Keep explanations understandable to a non-technical user.
8. Recommendations must be supported by the supplied findings.
""".strip()

    CHAT_INSTRUCTIONS = """
You are an AI data analyst assistant answering questions about a specific dataset.

Rules:
1. Answer ONLY based on the supplied analytics context below.
2. Never invent numbers, column names, trends, or relationships not present in the context.
3. If the context does not contain enough information to answer, say so clearly.
4. Be concise and direct. Use bullet points for lists.
5. Do not claim causation from correlation.
6. Address the user's question specifically — do not give a generic summary.
""".strip()

    def _format_history(self, history: List[Dict[str, str]]) -> str:
        """Format prior chat turns for inclusion in the prompt.

        Expects each turn to be a dict with ``sender`` ('user' or 'ai')
        and ``message`` keys, matching the chat_messages DB schema.
        """
        lines = []
        for turn in history:
            sender = turn.get("sender", "user").upper()
            message = turn.get("message", "").strip()
            if message:
                lines.append(f"{sender}: {message}")
        return "\n".join(lines)

    def build_chat_prompt(
        self,
        question: str,
        ai_context: dict,
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """Build a grounded chat prompt, optionally with prior conversation history.

        Parameters
        ----------
        question:              The user's current question.
        ai_context:            The ai_context block from the dataset's analysis results.
        conversation_history:  Optional list of prior turns (oldest first), each a dict
                               with keys ``sender`` ('user' | 'ai') and ``message`` (str).
        """
        context_json = json.dumps(ai_context, indent=2, default=str)

        history_block = ""
        if conversation_history:
            history_str = self._format_history(conversation_history)
            if history_str:
                history_block = f"\nCONVERSATION HISTORY (oldest first):\n{history_str}\n"

        return (
            f"{self.CHAT_INSTRUCTIONS}\n\n"
            f"ANALYTICS CONTEXT:\n{context_json}\n"
            f"{history_block}\n"
            f"USER QUESTION:\n{question}\n\n"
            f"Answer the question based strictly on the analytics context above."
        )

    def build_insight_prompt(
        self,
        ai_context: Dict[str, Any]
    ) -> str:

        context_json = json.dumps(
            ai_context,
            indent=2,
            default=str
        )

        return f"""
{self.SYSTEM_INSTRUCTIONS}

ANALYTICS CONTEXT:
{context_json}

Generate the following:

1. Executive Summary
   Give a short overview of the dataset and its most important findings.

2. Key Findings
   Identify the most important patterns supported by the analytics.

3. Anomalies
   Explain significant anomalies that were detected.

4. Trends
   Explain important upward, downward, or stable trends.

5. Relationships
   Explain meaningful correlations without claiming causation.

6. Data Quality
   Mention important quality problems that may affect interpretation.

7. Recommended Actions
   Provide practical actions supported by the analytical evidence.

Do not introduce facts that are absent from the analytics context.
""".strip()
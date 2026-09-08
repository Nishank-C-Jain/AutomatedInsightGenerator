from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from app.services.llm_service import LLMService

router = APIRouter()

# Lazy-initialise so missing API key only errors at call time, not import time
_llm: LLMService | None = None


def _get_llm() -> LLMService:
    global _llm
    if _llm is None:
        _llm = LLMService()
    return _llm


# ------------------------------------------------------------------ #
# Request / Response schemas                                           #
# ------------------------------------------------------------------ #

class ChatTurn(BaseModel):
    """A single turn in a conversation, keyed to match chat_messages DB schema."""
    sender: str   # 'user' | 'ai'
    message: str


class ChatRequest(BaseModel):
    """
    Body for POST /api/chat

    - question              : the user's natural-language question
    - ai_context            : the ai_context block produced by AIContextBuilder
                              (stored in analysis_results.ai_context in the DB)
    - conversation_history  : optional list of prior turns (oldest first) for
                              multi-turn contextual responses
    """
    question: str
    ai_context: Dict[str, Any]
    conversation_history: Optional[List[ChatTurn]] = None


class ChatResponse(BaseModel):
    success: bool
    answer: str


# ------------------------------------------------------------------ #
# POST /api/chat                                                       #
# ------------------------------------------------------------------ #

@router.post("/chat", response_model=ChatResponse)
def chat_with_dataset(body: ChatRequest):
    """
    Answer a natural-language question grounded in the dataset's analytics context.

    **Flow**
    1. Node.js backend fetches `analysis_results.ai_context` from PostgreSQL.
    2. Node fetches recent chat_messages for the session and passes them as
       ``conversation_history`` so the LLM can give contextually aware answers.
    3. Python builds a grounded multi-turn prompt and calls Gemini.
    4. Returns `{ success: true, answer: "..." }`.
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    if not body.ai_context:
        raise HTTPException(
            status_code=400,
            detail="ai_context is required. Run analysis on this dataset first."
        )

    # Convert Pydantic models to plain dicts for the LLM service
    history = (
        [turn.model_dump() for turn in body.conversation_history]
        if body.conversation_history
        else None
    )

    try:
        answer = _get_llm().answer_question(
            question=body.question,
            ai_context=body.ai_context,
            conversation_history=history,
        )
        return ChatResponse(success=True, answer=answer)

    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat failed: {exc}")


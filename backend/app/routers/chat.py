from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import structlog

from app.database import get_db
from app.config import get_settings
from app.schemas import ChatRequest, ChatResponse
from app.services.ai_chat import generate_chat_response

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/info", summary="Chatbot Status and Model Info")
def get_chat_info():
    settings = get_settings()
    has_key = bool(settings.GEMINI_API_KEY)
    return {
        "status": "online",
        "ai_enabled": has_key,
        "model": settings.GEMINI_MODEL if has_key else "fallback-rules-engine",
        "supported_languages": ["en", "am"],
    }


@router.post("/message", response_model=ChatResponse, summary="Send message to AI Contact Center Chatbot")
async def send_chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Processes incoming caller or user message, executes intent analysis,
    and returns concise answers with dynamic Visual IVR decision actions.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message text cannot be empty.",
        )

    log.info(
        "chat_message_received",
        lang=payload.language,
        msg_len=len(payload.message),
        node_id=payload.current_node_id,
        session_id=payload.session_id,
    )

    response = await generate_chat_response(
        message=payload.message,
        language=payload.language,
        history=payload.history,
        current_node_id=payload.current_node_id,
        session_id=payload.session_id,
        db=db,
    )

    return response

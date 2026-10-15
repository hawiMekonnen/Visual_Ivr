from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.config import get_settings
from app.services.gemini_translation import (
    translate_with_gemini,
    translate_node_fields_with_gemini,
)

router = APIRouter(prefix="/api/translate", tags=["translation"])


class SingleTranslateRequest(BaseModel):
    text: str = Field(..., description="Text to translate")
    target_lang: str = Field("am", description="Target language code (e.g. 'am', 'es')")
    source_lang: str = Field("en", description="Source language code (e.g. 'en')")


class NodeFieldsTranslateRequest(BaseModel):
    label_en: str = Field(..., description="English label")
    prompt_en: str = Field("", description="English prompt text")
    target_lang: str = Field("am", description="Target language code")


@router.post("", summary="Translate text with Gemini Flash Lite")
async def translate_text(payload: SingleTranslateRequest):
    """
    Translates input text using the Google Gemini Flash Lite model.
    """
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    result = await translate_with_gemini(
        text=payload.text,
        target_lang=payload.target_lang,
        source_lang=payload.source_lang,
    )
    return result


@router.post("/node-fields", summary="Auto-translate IVR node fields with Gemini")
async def translate_node_fields(payload: NodeFieldsTranslateRequest):
    """
    Auto-translates English label and prompt text for a menu node into Amharic.
    """
    result = await translate_node_fields_with_gemini(
        label_en=payload.label_en,
        prompt_en=payload.prompt_en,
        target_lang=payload.target_lang,
    )
    return result


@router.get("/status", summary="Gemini translation model status")
def translation_status():
    """
    Returns the configured Gemini translation model and API key status.
    """
    settings = get_settings()
    return {
        "provider": "Google Gemini",
        "model": settings.GEMINI_MODEL,
        "configured": bool(settings.GEMINI_API_KEY),
        "supported_languages": ["am", "en", "es", "fr", "om", "ti"],
    }

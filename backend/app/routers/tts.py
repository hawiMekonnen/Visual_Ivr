import base64
import hashlib
import json
import os
from pathlib import Path

import httpx
import structlog
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from app.config import get_settings

router = APIRouter(prefix="/api/tts", tags=["tts"])
log = structlog.get_logger(__name__)

CACHE_DIR = Path("./media/tts_cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)


async def _google_cloud_tts(text: str, lang: str, voice_name: str, api_key: str) -> bytes:
    """
    Fetch high-quality Wavenet audio from Google Cloud Text-to-Speech API.
    Returns raw MP3 bytes.
    """
    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}"

    # Language code mapping
    language_codes = {
        "am": "am-ET",
        "en": "en-US",
        "om": "om-ET",
    }
    language_code = language_codes.get(lang, f"{lang}-{lang.upper()}")

    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": language_code,
            "name": voice_name,
        },
        "audioConfig": {
            "audioEncoding": "MP3",
            "speakingRate": 0.95,
            "pitch": 0.0,
        },
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(url, json=payload)
        if res.status_code != 200:
            raise ValueError(f"Google Cloud TTS error {res.status_code}: {res.text[:300]}")
        data = res.json()
        audio_b64 = data.get("audioContent", "")
        if not audio_b64:
            raise ValueError("Google Cloud TTS returned empty audioContent")
        return base64.b64decode(audio_b64)


async def _google_translate_tts(text: str, lang: str) -> bytes:
    """
    Fallback: fetch audio from the unofficial Google Translate TTS endpoint.
    Free, no API key required, but lower quality.
    """
    google_tts_url = "https://translate.google.com/translate_tts"
    params = {
        "ie": "UTF-8",
        "q": text,
        "tl": lang,
        "client": "tw-ob",
    }
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(google_tts_url, params=params, headers=headers)
        if res.status_code == 200 and len(res.content) > 100:
            return res.content
        raise ValueError(f"Google Translate TTS failed: HTTP {res.status_code}")


@router.get("", summary="Stream Text-To-Speech audio for Amharic and other languages")
async def get_tts(
    text: str = Query(..., min_length=1, max_length=500, description="Text to speak"),
    lang: str = Query("am", description="Language code (e.g. am, en, om)"),
):
    """
    Returns an MP3 audio stream for the given text.
    Uses Google Cloud TTS Wavenet (high quality) when GOOGLE_TTS_API_KEY is configured,
    otherwise falls back to Google Translate TTS (free, lower quality).
    Caches audio files locally for fast repeated playback.
    """
    settings = get_settings()
    cleaned_text = text.strip()
    if not cleaned_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Determine voice name (only relevant for Google Cloud TTS)
    voice_name = settings.GOOGLE_TTS_VOICE if lang == "am" else f"{lang}-ET-Standard-A"

    # Cache key includes voice name so different voices don't conflict
    cache_key_raw = f"{lang}_{voice_name}_{cleaned_text}"
    cache_key = hashlib.md5(cache_key_raw.encode("utf-8")).hexdigest()
    cache_file = CACHE_DIR / f"{cache_key}.mp3"

    if cache_file.exists():
        audio_bytes = cache_file.read_bytes()
        log.debug("tts_cache_hit", lang=lang, voice=voice_name)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=604800"},
        )

    # Generate audio
    audio_bytes: bytes | None = None
    provider = "unknown"

    try:
        if settings.GOOGLE_TTS_API_KEY and lang == "am":
            # Use high-quality Google Cloud Wavenet voice for Amharic
            audio_bytes = await _google_cloud_tts(
                cleaned_text, lang, voice_name, settings.GOOGLE_TTS_API_KEY
            )
            provider = f"google_cloud_tts/{voice_name}"
        else:
            # Fallback to Google Translate TTS
            audio_bytes = await _google_translate_tts(cleaned_text, lang)
            provider = "google_translate_tts"

        log.info("tts_generated", provider=provider, lang=lang, chars=len(cleaned_text))

        # Save to cache
        try:
            cache_file.write_bytes(audio_bytes)
        except Exception as ce:
            log.warning("tts_cache_write_failed", error=str(ce))

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Cache-Control": "public, max-age=604800"},
        )

    except Exception as e:
        log.error("tts_exception", provider=provider, error=str(e))
        raise HTTPException(status_code=500, detail=f"TTS generation error: {str(e)}")


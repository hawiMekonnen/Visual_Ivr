import json
import httpx
import structlog
from app.config import get_settings

log = structlog.get_logger(__name__)

# Fallback dictionary for common IVR phrases when API key is not configured or offline
FALLBACK_TRANSLATIONS = {
    "welcome": "እንኳን ደህና መጡ",
    "english menu": "የእንግሊዘኛ ምናሌ",
    "amharic menu": "የአማርኛ ምናሌ",
    "billing & payments": "ክፍያ እና ሂሳብ",
    "technical support": "የቴክኒክ ድጋፍ",
    "business hours & location": "የስራ ሰዓታት እና አድራሻ",
    "pay my bill": "ሂሳቤን ለመክፈል",
    "speak to billing agent": "ከሂሳብ ባለሙያ ጋር ለመነጋገር",
    "request a callback": "መልሶ መደወል ለመጠየቅ",
    "connect to support agent": "ከድጋፍ ሰጪ ጋር ለመገናኘት",
    "chat with a support agent": "ከአገልግሎት ወኪል ጋር ይወያዩ",
    "speak with an agent": "ከወኪል ጋር ይነጋገሩ",
}


async def translate_with_gemini(
    text: str,
    target_lang: str = "am",
    source_lang: str = "en"
) -> dict:
    """
    Translate text using Google Gemini Flash Lite model.
    """
    settings = get_settings()
    api_key = settings.GEMINI_API_KEY
    model = settings.GEMINI_MODEL or "gemini-3.5-flash-lite"

    lang_names = {
        "am": "Amharic (አማርኛ)",
        "en": "English",
        "es": "Spanish",
        "fr": "French",
        "om": "Oromo (Afaan Oromoo)",
        "ti": "Tigrinya (ትግርኛ)",
    }
    target_name = lang_names.get(target_lang, target_lang)
    source_name = lang_names.get(source_lang, source_lang)

    if not api_key:
        # Graceful fallback when Gemini API key is not set
        lowered = text.strip().lower()
        if lowered in FALLBACK_TRANSLATIONS and target_lang == "am":
            return {
                "original": text,
                "translated": FALLBACK_TRANSLATIONS[lowered],
                "model": "fallback-dictionary",
                "source_lang": source_lang,
                "target_lang": target_lang,
            }
        
        return {
            "original": text,
            "translated": f"{text} (Translated to {target_name})",
            "model": "simulated-gemini-flash-lite",
            "note": "Set GEMINI_API_KEY in backend/.env to enable live Google Gemini translation.",
            "source_lang": source_lang,
            "target_lang": target_lang,
        }

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    prompt = (
        f"You are a professional translator for an enterprise Visual IVR (Interactive Voice Response) customer support phone system. "
        f"Translate the following text accurately from {source_name} to {target_name}.\n"
        f"Keep the tone polite, natural, and clear for phone callers and mobile app users.\n"
        f"Return ONLY the direct translated text, without any explanations, quotes, or markdown.\n\n"
        f"Text to translate:\n{text}"
    )

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(endpoint, json=payload)
            if resp.status_code != 200:
                log.error("gemini_translation_error", status=resp.status_code, body=resp.text)
                return {
                    "original": text,
                    "translated": text,
                    "error": f"Gemini API returned status {resp.status_code}",
                    "model": model,
                }

            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts:
                    translated_text = parts[0].get("text", "").strip()
                    return {
                        "original": text,
                        "translated": translated_text,
                        "model": model,
                        "source_lang": source_lang,
                        "target_lang": target_lang,
                    }

            return {
                "original": text,
                "translated": text,
                "error": "No translation generated from Gemini model.",
                "model": model,
            }

    except Exception as e:
        log.error("gemini_translation_exception", error=str(e))
        return {
            "original": text,
            "translated": text,
            "error": str(e),
            "model": model,
        }


async def translate_node_fields_with_gemini(
    label_en: str,
    prompt_en: str,
    target_lang: str = "am"
) -> dict:
    """
    Translates both the English label and prompt text in a structured batch request.
    """
    settings = get_settings()
    api_key = settings.GEMINI_API_KEY
    model = settings.GEMINI_MODEL or "gemini-3.5-flash-lite"

    if not api_key:
        # Fallback dictionary matching
        res_label = await translate_with_gemini(label_en, target_lang=target_lang)
        res_prompt = await translate_with_gemini(prompt_en, target_lang=target_lang)
        return {
            "label": res_label.get("translated", label_en),
            "prompt_text": res_prompt.get("translated", prompt_en),
            "model": "fallback-dictionary",
        }

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    prompt = (
        f"You are an enterprise IVR translation assistant. Translate the following JSON fields from English to Amharic (አማርኛ).\n"
        f"Return ONLY a valid JSON object with the exact keys 'label' and 'prompt_text'.\n\n"
        f"Input JSON:\n"
        f"{json.dumps({'label': label_en, 'prompt_text': prompt_en}, ensure_ascii=False)}"
    )

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
            "maxOutputTokens": 1024,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(endpoint, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                parsed = json.loads(raw_text)
                return {
                    "label": parsed.get("label", label_en),
                    "prompt_text": parsed.get("prompt_text", prompt_en),
                    "model": model,
                }
    except Exception as e:
        log.error("gemini_batch_translation_exception", error=str(e))

    # Fallback to individual translations if JSON parsing fails
    res_label = await translate_with_gemini(label_en, target_lang=target_lang)
    res_prompt = await translate_with_gemini(prompt_en, target_lang=target_lang)
    return {
        "label": res_label.get("translated", label_en),
        "prompt_text": res_prompt.get("translated", prompt_en),
        "model": model,
    }

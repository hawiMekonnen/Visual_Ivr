import json
import os
import re
from pathlib import Path
from typing import Any, Optional, Tuple
import httpx
import joblib
import structlog
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import MenuNode, ActionType
from app.schemas import ChatMessage, ChatResponse, ChatAction

log = structlog.get_logger(__name__)

# Paths to ML artifacts
ML_DIR = Path(__file__).resolve().parent.parent / "ml"
MODEL_PATH = ML_DIR / "telecom_intent_model.joblib"
INTENTS_CONFIG_PATH = ML_DIR / "telecom_intents.json"

_ml_pipeline = None
_intents_config = {}


def _get_ml_pipeline():
    global _ml_pipeline
    if _ml_pipeline is None and MODEL_PATH.exists():
        try:
            _ml_pipeline = joblib.load(MODEL_PATH)
            log.info("telecom_ml_pipeline_loaded", path=str(MODEL_PATH))
        except Exception as e:
            log.error("failed_loading_ml_pipeline", error=str(e))
    return _ml_pipeline


def _get_intents_config() -> dict:
    global _intents_config
    if not _intents_config and INTENTS_CONFIG_PATH.exists():
        try:
            with open(INTENTS_CONFIG_PATH, "r", encoding="utf-8") as f:
                _intents_config = json.load(f)
        except Exception as e:
            log.error("failed_loading_intents_config", error=str(e))
    return _intents_config


def classify_telecom_intent(text: str) -> Tuple[Optional[str], float]:
    """
    Classifies customer message using the local trained Telecom ML classifier.
    Returns (predicted_intent_name, confidence_score).
    """
    pipeline = _get_ml_pipeline()
    if pipeline is None or not text.strip():
        return None, 0.0

    try:
        probabilities = pipeline.predict_proba([text])[0]
        max_idx = probabilities.argmax()
        intent = pipeline.classes_[max_idx]
        confidence = float(probabilities[max_idx])
        return intent, confidence
    except Exception as e:
        log.warning("telecom_intent_prediction_error", error=str(e))
        return None, 0.0


def _build_system_prompt(nodes_summary: str, lang: str) -> str:
    lang_instruction = (
        "Respond in natural, polite Amharic (አማርኛ). Keep words simple and clear for mobile phone callers."
        if lang == "am"
        else "Respond in clear, professional, and friendly English."
    )
    return (
        "You are an AI Contact Center Assistant & Decision Engine for a Telecom Visual IVR phone system.\n"
        "Your role is to assist callers with concise, accurate telecom guidance (1 to 2 sentences maximum) "
        "covering Airtime & Balance, Internet Packages, Telebirr & Mobile Money, SIM & PUK support, "
        "Broadband/Fiber, and transferring to Live Agents (994/1002).\n\n"
        f"Available IVR Menu Services:\n{nodes_summary}\n\n"
        f"Language requirement: {lang_instruction}\n\n"
        "Rules:\n"
        "1. Keep responses short and conversational (1-2 sentences max).\n"
        "2. Recommend a Decision Box (suggested_action) matching the user's intent:\n"
        "   - 'connect_agent' (target '1002' or '994') if the caller wants human help or transfer.\n"
        "   - 'navigate' (with node_id if matched) if user needs an IVR menu section.\n"
        "   - 'info' if providing specific codes (*804#, *127#, etc.) or hours.\n"
        "   - null if no direct action is needed.\n"
        "3. Provide 2 to 3 short quick reply buttons in the chosen language.\n"
        "4. Output STRICT JSON adhering to this schema:\n"
        "{\n"
        '  "reply": "Simple 1-2 sentence response",\n'
        '  "suggested_action": {\n'
        '    "action_type": "navigate" | "connect_agent" | "callback" | "info",\n'
        '    "node_id": 123 or null,\n'
        '    "target": "target string or null",\n'
        '    "label": "Button label for user"\n'
        '  },\n'
        '  "quick_replies": ["Quick Option 1", "Quick Option 2"]\n'
        "}"
    )


def _build_intent_response(
    intent_name: str,
    lang: str,
    nodes: list[MenuNode],
    confidence: float = 1.0,
) -> ChatResponse:
    """Builds a structured ChatResponse from matched telecom intent configuration."""
    intents = _get_intents_config()
    item = intents.get(intent_name)

    if not item:
        # Default telecom fallback
        if lang == "am":
            return ChatResponse(
                reply="እንደምን ሊረዳዎት እችላለሁ? ስለ ካርድ መሙላት፣ ቴሌብር፣ የኢንተርኔት ፓኬጆች፣ ሲም ካርድ መጠየቅ ወይም ከደንበኞች አገልግሎት ወኪል ጋር መገናኘት ይችላሉ።",
                suggested_action=ChatAction(
                    action_type="connect_agent",
                    target="1002",
                    label="ከወኪል ጋር ይነጋገሩ",
                ),
                quick_replies=["ካርድ እና ቀሪ ሂሳብ", "የኢንተርኔት ፓኬጅ", "ቴሌብር"],
                model="telecom-rules-engine",
            )
        else:
            return ChatResponse(
                reply="How can I assist you today? You can ask about airtime recharge, Telebirr, internet packages, SIM/PUK, or speak with an agent.",
                suggested_action=ChatAction(
                    action_type="connect_agent",
                    target="1002",
                    label="Speak with Live Agent",
                ),
                quick_replies=["Airtime & Balance", "Internet Packages", "Telebirr"],
                model="telecom-rules-engine",
            )

    reply_text = item.get("reply_am" if lang == "am" else "reply_en", "")
    quick_replies = item.get("quick_replies_am" if lang == "am" else "quick_replies_en", [])
    action_data = item.get("action")

    suggested_action = None
    if action_data:
        matched_node_id = None
        target_name = (action_data.get("target") or "").lower()

        # Find matching IVR tree node if possible
        for node in nodes:
            en_lbl = (node.labels.get("en") or "").lower()
            am_lbl = (node.labels.get("am") or "").lower()
            if target_name and (target_name in en_lbl or target_name in am_lbl):
                matched_node_id = node.id
                break

        suggested_action = ChatAction(
            action_type=action_data.get("action_type", "navigate"),
            target=action_data.get("target"),
            node_id=matched_node_id,
            label=action_data.get("label", "Learn More"),
        )

    return ChatResponse(
        reply=reply_text,
        suggested_action=suggested_action,
        quick_replies=quick_replies,
        model=f"telecom-ml-classifier ({intent_name} {int(confidence*100)}%)",
    )


from app.services.flow_engine import flow_state_machine, get_flows_config


async def generate_chat_response(
    message: str,
    language: str = "en",
    history: Optional[list[ChatMessage]] = None,
    current_node_id: Optional[int] = None,
    session_id: Optional[str] = None,
    db: Optional[Session] = None,
) -> ChatResponse:
    """
    Generate conversational reply + decision box routing using:
    1. Avaya-style Dialog State Machine (multi-turn Decision Tree navigation)
    2. Local ML Telecom Intent Classifier
    3. Fallback / Gemini Flash Lite for open-ended queries when API key is configured.
    """
    settings = get_settings()
    api_key = settings.GEMINI_API_KEY
    model = settings.GEMINI_MODEL or "gemini-2.5-flash"

    # Fetch active IVR menu nodes for dynamic grounding
    nodes: list[MenuNode] = []
    nodes_summary_lines = []
    if db:
        try:
            nodes = db.query(MenuNode).order_by(MenuNode.sort_order).all()
            for n in nodes:
                en_lbl = n.labels.get("en", "")
                am_lbl = n.labels.get("am", "")
                en_prompt = n.prompt_texts.get("en", "")
                nodes_summary_lines.append(
                    f"- Node ID {n.id}: '{en_lbl}' / '{am_lbl}' (Action: {n.action_type.value}, Target: {n.action_target}). Prompt: {en_prompt}"
                )
        except Exception as e:
            log.warning("failed_fetching_menu_nodes", error=str(e))

    if not nodes_summary_lines:
        nodes_summary_lines = [
            "- Billing & Payments (Airtime recharge, Telebirr, invoice payments)",
            "- Technical Support (Fiber broadband, router connection, speed issues)",
            "- Business Hours & Service Centers (8:00 AM - 6:00 PM)",
            "- Speak with Live Agent (Customer care line 1002 / 994)",
        ]

    # Step 1: Run Local ML Telecom Classifier
    intent, confidence = classify_telecom_intent(message)
    log.info("telecom_intent_classified", intent=intent, confidence=confidence, text=message, session_id=session_id)

    # Step 2: Route through Avaya Dialog State Machine
    flow_resp = flow_state_machine.process_turn(
        session_id=session_id,
        user_message=message,
        predicted_intent=intent,
        confidence=confidence,
        lang=language,
        nodes_db=nodes,
    )

    # If the flow engine resolved a node transition or NOMATCH escalation, return immediately
    if flow_resp and "retry" not in flow_resp.model:
        return flow_resp

    # Step 3: If in NOMATCH state and no Gemini key, return the state machine reprompt
    if not api_key:
        return flow_resp

    # Step 3: Invoke Gemini Flash Lite for open reasoning / language assistance
    nodes_summary = "\n".join(nodes_summary_lines)
    system_instruction = _build_system_prompt(nodes_summary, language)
    contents = []

    if history:
        for turn in history[-6:]:
            role = "user" if turn.role == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": turn.text}],
            })

    current_context = f"[Caller Location: Node {current_node_id}]\n" if current_node_id else ""
    user_prompt = f"{current_context}{message}"
    contents.append({
        "role": "user",
        "parts": [{"text": user_prompt}],
    })

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.25,
            "maxOutputTokens": 800,
            "responseMimeType": "application/json",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(endpoint, json=payload)
            if resp.status_code != 200:
                log.error("gemini_telecom_chat_error", status=resp.status_code, body=resp.text)
                return _build_intent_response(intent or "unknown", language, nodes, confidence)

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return _build_intent_response(intent or "unknown", language, nodes, confidence)

            raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
            cleaned_text = re.sub(r"^```json\s*", "", raw_text)
            cleaned_text = re.sub(r"\s*```$", "", cleaned_text).strip()

            parsed = json.loads(cleaned_text)

            reply = parsed.get("reply", "")
            action_raw = parsed.get("suggested_action")
            quick_replies = parsed.get("quick_replies", [])

            suggested_action = None
            if action_raw and isinstance(action_raw, dict) and action_raw.get("label"):
                suggested_action = ChatAction(
                    action_type=action_raw.get("action_type", "navigate"),
                    target=action_raw.get("target"),
                    node_id=action_raw.get("node_id"),
                    label=action_raw.get("label", "Learn More"),
                )

            return ChatResponse(
                reply=reply,
                suggested_action=suggested_action,
                quick_replies=quick_replies,
                model=model,
            )

    except Exception as exc:
        log.exception("gemini_telecom_chat_exception", error=str(exc))
        return _build_intent_response(intent or "unknown", language, nodes, confidence)

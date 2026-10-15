import json
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import structlog
from sqlalchemy.orm import Session

from app.models import MenuNode
from app.schemas import ChatAction, ChatResponse

log = structlog.get_logger(__name__)

FLOWS_FILE = Path(__file__).resolve().parent.parent / "ml" / "telecom_flows.json"

_cached_flows = None


def get_flows_config() -> dict:
    global _cached_flows
    if FLOWS_FILE.exists():
        try:
            with open(FLOWS_FILE, "r", encoding="utf-8") as f:
                _cached_flows = json.load(f)
        except Exception as e:
            log.error("error_loading_flows_json", error=str(e))
            if _cached_flows is None:
                _cached_flows = {"root_node": "main_menu", "nodes": {}}
    else:
        _cached_flows = {"root_node": "main_menu", "nodes": {}}
    return _cached_flows


def save_flows_config(flows_data: dict):
    global _cached_flows
    try:
        with open(FLOWS_FILE, "w", encoding="utf-8") as f:
            json.dump(flows_data, f, indent=2, ensure_ascii=False)
        _cached_flows = flows_data
        log.info("flows_config_saved_successfully")
        return True
    except Exception as e:
        log.error("error_saving_flows_json", error=str(e))
        return False


class DialogStateMachine:
    """
    Telecom Decision Tree Dialog State Machine.
    Maintains session state, evaluates intent and rule transitions,
    and manages error escalation.
    """

    def __init__(self):
        # In-memory session tracking: session_id -> state dict
        self._sessions: Dict[str, dict] = {}

    def get_session_state(self, session_id: Optional[str]) -> dict:
        sid = session_id or "default_session"
        now = time.time()

        # Clean old sessions (older than 2 hours)
        expired = [k for k, v in self._sessions.items() if now - v.get("last_updated", now) > 7200]
        for k in expired:
            self._sessions.pop(k, None)

        if sid not in self._sessions:
            flows = get_flows_config()
            root_node_id = flows.get("root_node", "main_menu")
            self._sessions[sid] = {
                "current_node": root_node_id,
                "nomatch_count": 0,
                "history": [],
                "slots": {},
                "last_updated": now,
            }
        else:
            self._sessions[sid]["last_updated"] = now

        return self._sessions[sid]

    def reset_session(self, session_id: Optional[str]):
        sid = session_id or "default_session"
        flows = get_flows_config()
        root_node_id = flows.get("root_node", "main_menu")
        self._sessions[sid] = {
            "current_node": root_node_id,
            "nomatch_count": 0,
            "history": [],
            "slots": {},
            "last_updated": time.time(),
        }

    def process_turn(
        self,
        session_id: Optional[str],
        user_message: str,
        predicted_intent: Optional[str],
        confidence: float,
        lang: str = "en",
        nodes_db: Optional[list[MenuNode]] = None,
    ) -> ChatResponse:
        flows = get_flows_config()
        nodes_dict = flows.get("nodes", {})
        global_handlers = flows.get("global_handlers", {})

        state = self.get_session_state(session_id)
        current_node_id = state.get("current_node", "main_menu")
        current_node = nodes_dict.get(current_node_id, nodes_dict.get("main_menu", {}))

        msg_clean = user_message.strip().lower()

        # 1. Global Handlers Check (e.g. agent_transfer, main_menu)
        target_node_id = None
        if predicted_intent and predicted_intent in global_handlers and confidence >= 0.35:
            target_node_id = global_handlers[predicted_intent]
        elif "main menu" in msg_clean or "ዋና ምናሌ" in msg_clean or "start over" in msg_clean:
            target_node_id = "main_menu"
        elif "agent" in msg_clean or "operator" in msg_clean or "ሰው" in msg_clean or "ወኪል" in msg_clean:
            target_node_id = "flow_agent_transfer"

        # 2. Check Node-Specific Direct Matches (Transitions & Target Nodes)
        if not target_node_id and current_node:
            transitions = current_node.get("transitions", {})

            # 2a. Direct match with transition keys (e.g. "boss_baby" matches "boss baby")
            for intent_key, dest_id in transitions.items():
                clean_key = intent_key.lower().replace("_", " ").strip()
                if clean_key and (clean_key in msg_clean or msg_clean in clean_key):
                    target_node_id = dest_id
                    break

            # 2b. Direct match with target node title / label / prompt
            if not target_node_id:
                for intent_key, dest_id in transitions.items():
                    dest_node = nodes_dict.get(dest_id)
                    if dest_node:
                        title = dest_node.get("title", "").lower().strip()
                        action_lbl = dest_node.get("action", {}).get("label", "").lower().strip()
                        if title and (title in msg_clean or msg_clean in title):
                            target_node_id = dest_id
                            break
                        if action_lbl and (action_lbl in msg_clean or msg_clean in action_lbl):
                            target_node_id = dest_id
                            break

            # 2c. ML Predicted Intent match within transitions
            if not target_node_id and predicted_intent and predicted_intent in transitions and confidence >= 0.25:
                target_node_id = transitions[predicted_intent]

        # 3. Global Canvas Node Search (Jump to any node if caller mentions its title directly)
        if not target_node_id:
            for n_id, n_data in nodes_dict.items():
                title = n_data.get("title", "").lower().strip()
                if title and len(title) > 2 and (title in msg_clean or msg_clean in title):
                    target_node_id = n_id
                    break

        # 4. Check Quick Reply exact match
        if not target_node_id and current_node:
            qr_en = current_node.get("quick_replies_en", [])
            qr_am = current_node.get("quick_replies_am", [])
            for qr in qr_en + qr_am:
                if qr.lower() in msg_clean:
                    # Map common quick replies to intents/nodes
                    if "agent" in qr.lower() or "ወኪል" in qr.lower():
                        target_node_id = "flow_agent_transfer"
                    elif "balance" in qr.lower() or "recharge" in qr.lower() or "ካርድ" in qr.lower() or "ቀሪ" in qr.lower():
                        target_node_id = "flow_airtime"
                    elif "package" in qr.lower() or "data" in qr.lower() or "ፓኬጅ" in qr.lower() or "ዳታ" in qr.lower():
                        target_node_id = "flow_internet"
                    elif "telebirr" in qr.lower() or "ቴሌብር" in qr.lower() or "pin" in qr.lower() or "ፒን" in qr.lower():
                        target_node_id = "flow_telebirr"
                    elif "main menu" in qr.lower() or "ዋና" in qr.lower():
                        target_node_id = "main_menu"
                    break

        # 5. If Transition Found: Advance State Machine
        if target_node_id and target_node_id in nodes_dict:
            state["current_node"] = target_node_id
            state["nomatch_count"] = 0
            next_node = nodes_dict[target_node_id]
            return self._build_node_response(next_node, lang, nodes_db, f"flow-engine [{target_node_id}]")

        # 6. NOMATCH Handling (Error Escalation)
        state["nomatch_count"] = state.get("nomatch_count", 0) + 1
        max_nomatch = current_node.get("max_nomatch", 2)

        if state["nomatch_count"] >= max_nomatch:
            # Automatic Transfer after exceeding NOMATCH retries
            state["current_node"] = "flow_agent_transfer"
            state["nomatch_count"] = 0
            transfer_node = nodes_dict.get("flow_agent_transfer", current_node)

            esc_reply_en = "I'm having trouble understanding your request. Let me connect you directly with a live customer service agent."
            esc_reply_am = "ጥያቄዎን ለመረዳት ችግር ገጥሞኛል። በቀጥታ ከደንበኞች አገልግሎት ወኪል ጋር ላገናኝዎ።"

            return ChatResponse(
                reply=esc_reply_am if lang == "am" else esc_reply_en,
                suggested_action=ChatAction(
                    action_type="connect_agent",
                    target="1002",
                    label="Speak with Live Agent",
                ),
                quick_replies=transfer_node.get("quick_replies_am" if lang == "am" else "quick_replies_en", ["Speak with Agent", "Main Menu"]),
                model="flow-engine [nomatch-escalate]",
            )

        # Reprompt current node
        reprompt_prefix_en = "I didn't quite get that. "
        reprompt_prefix_am = "ይቅርታ አልተረዳሁትም። "
        current_prompt = current_node.get("prompt_am" if lang == "am" else "prompt_en", "")

        return ChatResponse(
            reply=f"{reprompt_prefix_am if lang == 'am' else reprompt_prefix_en}{current_prompt}",
            suggested_action=self._resolve_action(current_node.get("action"), nodes_db),
            quick_replies=current_node.get("quick_replies_am" if lang == "am" else "quick_replies_en", []),
            model=f"flow-engine [{current_node_id} retry {state['nomatch_count']}]",
        )

    def _build_node_response(
        self,
        node: dict,
        lang: str,
        nodes_db: Optional[list[MenuNode]],
        model_tag: str,
    ) -> ChatResponse:
        reply_text = node.get("prompt_am" if lang == "am" else "prompt_en", "")
        quick_replies = node.get("quick_replies_am" if lang == "am" else "quick_replies_en", [])
        suggested_action = self._resolve_action(node.get("action"), nodes_db)

        return ChatResponse(
            reply=reply_text,
            suggested_action=suggested_action,
            quick_replies=quick_replies,
            model=model_tag,
        )

    def _resolve_action(self, action_raw: Optional[dict], nodes_db: Optional[list[MenuNode]]) -> Optional[ChatAction]:
        if not action_raw or not isinstance(action_raw, dict):
            return None

        matched_node_id = None
        target_name = (action_raw.get("target") or "").lower()

        if nodes_db and target_name:
            for n in nodes_db:
                en_lbl = (n.labels.get("en") or "").lower()
                am_lbl = (n.labels.get("am") or "").lower()
                if target_name in en_lbl or target_name in am_lbl:
                    matched_node_id = n.id
                    break

        return ChatAction(
            action_type=action_raw.get("action_type", "navigate"),
            target=action_raw.get("target"),
            node_id=matched_node_id,
            label=action_raw.get("label", "Learn More"),
        )


# Global singleton instance
flow_state_machine = DialogStateMachine()

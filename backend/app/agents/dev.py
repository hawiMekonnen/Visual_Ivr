"""
Development agent connector.

Returns a ``tel:`` link pointing to a configurable extension.
The frontend can then do ``window.location.href = result.href`` to initiate a call.
This mirrors the prototype's behaviour exactly.

When you're ready for real telephony, implement TwilioAgentConnector and set
AGENT_CONNECTOR=twilio in your .env — no frontend changes required.
"""
import structlog

from app.agents.base import AgentConnector
from app.config import get_settings

log = structlog.get_logger(__name__)
settings = get_settings()


class DevAgentConnector(AgentConnector):
    """
    Stub connector for local development.
    Returns a tel: link to DEFAULT_AGENT_EXTENSION (default: 8000).
    """

    def connect(self, session_id: str, target: str | None) -> dict:
        extension = target or settings.DEFAULT_AGENT_EXTENSION
        href = f"tel:{extension}"
        log.info(
            "dev_agent_connect",
            session_id=session_id,
            extension=extension,
            href=href,
        )
        return {
            "type": "tel",
            "href": href,
            "extension": extension,
            "message": f"Connecting you to extension {extension}…",
        }

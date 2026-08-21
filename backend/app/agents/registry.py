"""
Agent connector registry.

Add new connectors here and reference them via the AGENT_CONNECTOR env var.

Example for Twilio:
    # In .env:
    AGENT_CONNECTOR=twilio

    # In registry.py:
    from app.agents.twilio import TwilioAgentConnector
    _REGISTRY["twilio"] = TwilioAgentConnector
"""
from app.agents.base import AgentConnector
from app.agents.dev import DevAgentConnector
from app.config import get_settings

_REGISTRY: dict[str, type[AgentConnector]] = {
    "dev": DevAgentConnector,
    # "twilio": TwilioAgentConnector,  # uncomment when implemented
}


def get_connector() -> AgentConnector:
    """Return the configured AgentConnector instance."""
    settings = get_settings()
    connector_cls = _REGISTRY.get(settings.AGENT_CONNECTOR)
    if connector_cls is None:
        raise ValueError(
            f"Unknown AGENT_CONNECTOR '{settings.AGENT_CONNECTOR}'. "
            f"Valid options: {list(_REGISTRY.keys())}"
        )
    return connector_cls()

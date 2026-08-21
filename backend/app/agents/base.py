"""
Agent connector base class.

To add a new telephony provider:
1. Create backend/app/agents/my_provider.py implementing AgentConnector
2. Set AGENT_CONNECTOR=my_provider in your .env
3. Register it in registry.py
"""
from abc import ABC, abstractmethod
from typing import Any


class AgentConnector(ABC):
    """
    Abstract interface for connecting a session to a live agent.
    
    The ``connect`` method is called when a user hits a ``connect_agent``
    action node.  It must return a dict with at minimum:
      - ``type`` (str): the connection mechanism, e.g. "tel", "twilio", "chat"
      - ``href`` (str | None): a URI the frontend can navigate to (tel: link, etc.)
    Additional keys are connector-specific and passed through to the frontend.
    """

    @abstractmethod
    def connect(self, session_id: str, target: str | None) -> dict[str, Any]:
        """
        Execute the connection and return a result dict.

        :param session_id: The active session UUID.
        :param target: The action_target from the MenuNode (e.g. phone extension, dept id).
        :returns: Dict with at least {"type": str, "href": str | None}.
        """
        ...

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.agents.registry import get_connector
from app.database import get_db
from app.models import MenuNode, SelectionEvent, Session as SessionModel
from app.routers.menu import _serialize_node
from app.schemas import (
    ActionRequest,
    ActionResult,
    SelectionEventCreate,
    SelectionResponse,
    SessionCreate,
    SessionOut,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])
log = structlog.get_logger(__name__)


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(body: SessionCreate, db: Session = Depends(get_db)):
    """Start a new IVR session. Returns a session id for subsequent calls."""
    session = SessionModel(
        source=body.source,
        caller_phone=body.caller_phone,
        call_session_token=body.call_session_token,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    log.info("session_started", session_id=session.id, source=session.source)
    return session


@router.post(
    "/{session_id}/select",
    response_model=SelectionResponse,
    summary="Log a menu selection and return the selected node",
)
def log_selection(
    session_id: str,
    body: SelectionEventCreate,
    db: Session = Depends(get_db),
):
    """Logs a selection event and returns the selected node with its children."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    node = db.query(MenuNode).filter(MenuNode.id == body.node_id).first()
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")

    event = SelectionEvent(session_id=session_id, node_id=body.node_id)
    db.add(event)
    db.commit()
    db.refresh(event)

    log.info(
        "selection_logged",
        session_id=session_id,
        node_id=body.node_id,
        node_label=node.label(),
    )
    return SelectionResponse(event=event, node=_serialize_node(node))


@router.post(
    "/{session_id}/action",
    response_model=ActionResult,
    summary="Execute a node action (connect, callback, info)",
)
def execute_action(
    session_id: str,
    body: ActionRequest,
    db: Session = Depends(get_db),
):
    """Executes the action associated with a node (e.g. connect_agent → tel link)."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    node = db.query(MenuNode).filter(MenuNode.id == body.node_id).first()
    if not node:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")

    locale = body.locale or "en"

    log.info(
        "action_executed",
        session_id=session_id,
        node_id=node.id,
        action_type=node.action_type,
        target=node.action_target,
    )

    if node.action_type.value == "connect_agent":
        connector = get_connector()
        result = connector.connect(session_id=session_id, target=node.action_target)
        return ActionResult(action_type=node.action_type, result=result)

    if node.action_type.value == "callback":
        return ActionResult(
            action_type=node.action_type,
            result={
                "type": "callback",
                "message": node.prompt_text(locale),
                "session_id": session_id,
            },
        )

    if node.action_type.value == "info":
        return ActionResult(
            action_type=node.action_type,
            result={
                "type": "info",
                "message": node.prompt_text(locale),
                "action_target": node.action_target,
            },
        )

    # navigate — just return the node's children info
    return ActionResult(
        action_type=node.action_type,
        result={"type": "navigate", "node_id": node.id},
    )

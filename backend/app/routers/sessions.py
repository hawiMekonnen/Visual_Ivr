import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.agents.registry import get_connector
from app.config import get_settings
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


class TelephonyTriggerRequest(BaseModel):
    caller_phone: str
    destination_number: str | None = None
    call_uuid: str | None = None
    base_url: str | None = None


from app.services.sms_service import send_sms_notification


@router.post("/trigger-call-ivr", summary="Webhook for FusionPBX to trigger Visual IVR session")
@router.post("/trigger", summary="Alias for triggering Visual IVR session from PBX call")
async def trigger_call_ivr(body: TelephonyTriggerRequest, request: Request, db: Session = Depends(get_db)):
    """
    Webhook called by FusionPBX / FreeSWITCH when an incoming caller hits the triggering point.
    Creates a call-linked session, triggers SMS dispatch, and returns the generated SMS link.
    """
    session = SessionModel(
        source="call_linked",
        caller_phone=body.caller_phone,
        call_session_token=body.call_uuid or f"call_{body.caller_phone}",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Determine base URL for frontend
    settings = get_settings()
    frontend_base = body.base_url or (request.headers.get("origin") if request.headers.get("origin") and "localhost" not in request.headers.get("origin") else settings.FRONTEND_BASE_URL)
    ivr_url = f"{frontend_base}/?session_id={session.id}"
    sms_text = f"Visual IVR: Thank you for calling. Access our Visual IVR menu on your phone here: {ivr_url}"

    log.info(
        "telephony_ivr_triggered",
        caller_phone=body.caller_phone,
        session_id=session.id,
        ivr_url=ivr_url,
    )

    # Dispatch SMS to the caller's phone number
    sms_result = await send_sms_notification(to_phone=body.caller_phone, message_text=sms_text)

    return {
        "success": True,
        "session_id": session.id,
        "caller_phone": body.caller_phone,
        "ivr_url": ivr_url,
        "sms_text": sms_text,
        "sms_dispatch": sms_result,
    }


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

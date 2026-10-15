import os
import uuid
from typing import List

import structlog
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_admin,
    hash_password,
    verify_password,
)
from app.config import get_settings
from app.database import get_db
from app.models import AdminUser, MenuNode, SelectionEvent, Session as SessionModel
from app.routers.menu import _serialize_node
from app.schemas import (
    AdminUserCreate,
    AdminUserOut,
    AnalyticsSummary,
    AudioUploadResponse,
    LoginRequest,
    MenuNodeCreate,
    MenuNodeOut,
    MenuNodeReorder,
    MenuNodeUpdate,
    NodeAnalytics,
    Token,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])
log = structlog.get_logger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


@router.post("/login", response_model=Token, summary="Admin login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUser).filter(AdminUser.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token({"sub": user.email})
    log.info("admin_login", email=user.email)
    return Token(access_token=token)


# OAuth2 form-based login (for Swagger UI "Authorize" button)
@router.post("/token", response_model=Token, include_in_schema=False)
def login_form(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.query(AdminUser).filter(AdminUser.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    return Token(access_token=create_access_token({"sub": user.email}))


# ---------------------------------------------------------------------------
# Admin user management
# ---------------------------------------------------------------------------


@router.post("/users", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
def create_admin_user(
    body: AdminUserCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    if db.query(AdminUser).filter(AdminUser.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = AdminUser(
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Menu node CRUD
# ---------------------------------------------------------------------------


@router.get("/nodes", response_model=List[MenuNodeOut])
def list_nodes(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    roots = (
        db.query(MenuNode)
        .filter(MenuNode.parent_id.is_(None))
        .order_by(MenuNode.sort_order)
        .all()
    )
    return [_serialize_node(r) for r in roots]


@router.post("/nodes", response_model=MenuNodeOut, status_code=status.HTTP_201_CREATED)
def create_node(
    body: MenuNodeCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    if body.parent_id is not None:
        parent = db.query(MenuNode).filter(MenuNode.id == body.parent_id).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent node not found")
    node = MenuNode(**body.model_dump())
    db.add(node)
    db.commit()
    db.refresh(node)
    log.info("node_created", node_id=node.id, labels=node.labels)
    return _serialize_node(node)


@router.get("/nodes/{node_id}", response_model=MenuNodeOut)
def get_node(
    node_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    node = db.query(MenuNode).filter(MenuNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return _serialize_node(node)


@router.patch("/nodes/{node_id}", response_model=MenuNodeOut)
def update_node(
    node_id: int,
    body: MenuNodeUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    node = db.query(MenuNode).filter(MenuNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(node, field, value)
    db.commit()
    db.refresh(node)
    log.info("node_updated", node_id=node_id)
    return _serialize_node(node)


@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(
    node_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    node = db.query(MenuNode).filter(MenuNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    db.delete(node)
    db.commit()
    log.info("node_deleted", node_id=node_id)


@router.post("/nodes/reorder", status_code=status.HTTP_200_OK)
def reorder_nodes(
    body: MenuNodeReorder,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    """Batch-update sort_order for drag-to-reorder operations."""
    for item in body.nodes:
        node = db.query(MenuNode).filter(MenuNode.id == item["id"]).first()
        if node:
            node.sort_order = item["sort_order"]
    db.commit()
    return {"updated": len(body.nodes)}


# ---------------------------------------------------------------------------
# Audio upload
# ---------------------------------------------------------------------------


@router.post("/audio", response_model=AudioUploadResponse)
async def upload_audio(
    node_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    """Upload an audio file for a node. Stores it in MEDIA_DIR."""
    node = db.query(MenuNode).filter(MenuNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Validate file type
    allowed = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm"}
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio type: {file.content_type}. Allowed: {allowed}",
        )

    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "audio.mp3")[1] or ".mp3"
    filename = f"node_{node_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(settings.MEDIA_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    audio_url = f"{settings.MEDIA_URL_PREFIX}/{filename}"
    node.audio_url = audio_url
    db.commit()

    log.info("audio_uploaded", node_id=node_id, audio_url=audio_url, bytes=len(content))
    return AudioUploadResponse(
        node_id=node_id,
        audio_url=audio_url,
        message="Audio uploaded successfully",
    )


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------


@router.get("/analytics", response_model=AnalyticsSummary)
def get_analytics(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    """Returns per-node selection counts, drop-off rates, and avg session depth."""
    total_sessions = db.query(func.count(SessionModel.id)).scalar() or 0

    total_selections = db.query(func.count(SelectionEvent.id)).scalar() or 0

    # Average session depth = avg number of selections per session
    depth_sq = (
        db.query(
            SelectionEvent.session_id,
            func.count(SelectionEvent.id).label("depth"),
        )
        .group_by(SelectionEvent.session_id)
        .subquery()
    )
    avg_depth_row = db.query(func.avg(depth_sq.c.depth)).scalar()
    avg_session_depth = float(avg_depth_row or 0)

    # Per-node selection counts
    node_counts = (
        db.query(SelectionEvent.node_id, func.count(SelectionEvent.id).label("cnt"))
        .group_by(SelectionEvent.node_id)
        .all()
    )
    count_map = {row.node_id: row.cnt for row in node_counts}

    # Drop-off: sessions that ended on this node (last selection in session)
    last_sel_sq = (
        db.query(
            SelectionEvent.session_id,
            func.max(SelectionEvent.id).label("last_id"),
        )
        .group_by(SelectionEvent.session_id)
        .subquery()
    )
    last_events = (
        db.query(SelectionEvent)
        .join(last_sel_sq, SelectionEvent.id == last_sel_sq.c.last_id)
        .all()
    )
    drop_off_map: dict[int, int] = {}
    for ev in last_events:
        drop_off_map[ev.node_id] = drop_off_map.get(ev.node_id, 0) + 1

    all_nodes = db.query(MenuNode).all()
    node_analytics = []
    for node in all_nodes:
        sel_count = count_map.get(node.id, 0)
        drop_count = drop_off_map.get(node.id, 0)
        rate = (drop_count / sel_count) if sel_count else 0.0
    node_analytics.sort(key=lambda x: x.selection_count, reverse=True)

    return AnalyticsSummary(
        total_sessions=total_sessions,
        total_selections=total_selections,
        avg_session_depth=round(avg_session_depth, 2),
        nodes=node_analytics,
    )


# ---------------------------------------------------------------------------
# Decision Flow Canvas (Avaya-Style Flow Graph)
# ---------------------------------------------------------------------------
from app.services.flow_engine import get_flows_config, save_flows_config


@router.get("/flows", summary="Get Telecom Decision Tree Flows Graph")
def get_flows(
    _: AdminUser = Depends(get_current_admin),
):
    """Returns the decision tree flow graph specification for visual editor."""
    return get_flows_config()


@router.post("/flows", summary="Update Telecom Decision Tree Flows Graph")
def update_flows(
    payload: dict,
    _: AdminUser = Depends(get_current_admin),
):
    """Updates and persists the decision tree flows configuration."""
    success = save_flows_config(payload)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save flows configuration.")
    return {"status": "success", "message": "Decision flows updated successfully"}

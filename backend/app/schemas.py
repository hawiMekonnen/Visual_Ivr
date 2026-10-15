from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import ActionType, AdminRole, SessionSource


# ---------------------------------------------------------------------------
# MenuNode schemas
# ---------------------------------------------------------------------------


class MenuNodeBase(BaseModel):
    labels: dict[str, str] = Field(..., description="Locale-keyed labels e.g. {'en': 'Billing'}")
    prompt_texts: dict[str, str] = Field(..., description="Locale-keyed prompt texts")
    audio_url: Optional[str] = None
    sort_order: int = 0
    action_type: ActionType = ActionType.navigate
    action_target: Optional[str] = None
    parent_id: Optional[int] = None

    @field_validator("labels", "prompt_texts")
    @classmethod
    def must_have_english(cls, v: dict) -> dict:
        if "en" not in v:
            raise ValueError("Must include at least an 'en' locale key.")
        return v


class MenuNodeCreate(MenuNodeBase):
    pass


class MenuNodeUpdate(BaseModel):
    labels: Optional[dict[str, str]] = None
    prompt_texts: Optional[dict[str, str]] = None
    audio_url: Optional[str] = None
    sort_order: Optional[int] = None
    action_type: Optional[ActionType] = None
    action_target: Optional[str] = None
    parent_id: Optional[int] = None


class MenuNodeReorder(BaseModel):
    """Reorder payload: list of {id, sort_order} pairs."""
    nodes: list[dict[str, int]]


class MenuNodeOut(MenuNodeBase):
    id: int
    children: list["MenuNodeOut"] = []

    model_config = {"from_attributes": True}


MenuNodeOut.model_rebuild()


# ---------------------------------------------------------------------------
# Session schemas
# ---------------------------------------------------------------------------


class SessionCreate(BaseModel):
    source: SessionSource = SessionSource.web
    caller_phone: Optional[str] = None
    call_session_token: Optional[str] = None


class SessionOut(BaseModel):
    id: str
    started_at: datetime
    source: SessionSource

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Selection event schemas
# ---------------------------------------------------------------------------


class SelectionEventCreate(BaseModel):
    node_id: int


class SelectionEventOut(BaseModel):
    id: int
    session_id: str
    node_id: int
    selected_at: datetime

    model_config = {"from_attributes": True}


class SelectionResponse(BaseModel):
    event: SelectionEventOut
    node: MenuNodeOut


# ---------------------------------------------------------------------------
# Action schemas
# ---------------------------------------------------------------------------


class ActionRequest(BaseModel):
    node_id: int
    locale: str = "en"


class ActionResult(BaseModel):
    action_type: ActionType
    result: dict[str, Any]


# ---------------------------------------------------------------------------
# Admin / Auth schemas
# ---------------------------------------------------------------------------


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: AdminRole = AdminRole.editor


class AdminUserOut(BaseModel):
    id: int
    email: str
    role: AdminRole

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------------------------
# Analytics schemas
# ---------------------------------------------------------------------------


class NodeAnalytics(BaseModel):
    node_id: int
    label: str
    selection_count: int
    drop_off_count: int
    drop_off_rate: float


class AnalyticsSummary(BaseModel):
    total_sessions: int
    total_selections: int
    avg_session_depth: float
    nodes: list[NodeAnalytics]


# ---------------------------------------------------------------------------
# Audio upload
# ---------------------------------------------------------------------------


class AudioUploadResponse(BaseModel):
    node_id: int
    audio_url: str
    message: str


# ---------------------------------------------------------------------------
# AI Chat & Decision Box schemas
# ---------------------------------------------------------------------------


class ChatMessage(BaseModel):
    role: str = "user"  # "user" | "model" | "assistant"
    text: str


class ChatAction(BaseModel):
    action_type: str = "navigate"  # "navigate" | "connect_agent" | "callback" | "info"
    target: Optional[str] = None
    node_id: Optional[int] = None
    label: str


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    session_id: Optional[str] = None
    current_node_id: Optional[int] = None
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    suggested_action: Optional[ChatAction] = None
    quick_replies: list[str] = []
    model: str = "gemini-3.5-flash-lite"


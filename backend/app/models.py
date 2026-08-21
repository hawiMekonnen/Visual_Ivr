from __future__ import annotations
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class ActionType(str, enum.Enum):
    navigate = "navigate"
    connect_agent = "connect_agent"
    callback = "callback"
    info = "info"


class SessionSource(str, enum.Enum):
    web = "web"
    call_linked = "call_linked"


class AdminRole(str, enum.Enum):
    super_admin = "super_admin"
    editor = "editor"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class MenuNode(Base):
    __tablename__ = "menu_nodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    parent_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("menu_nodes.id", ondelete="CASCADE"), nullable=True, index=True
    )
    # Multi-language: {"en": "Billing", "es": "Facturación"}
    labels: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # Multi-language prompt texts: {"en": "Press 1 for billing.", "es": "..."}
    prompt_texts: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    audio_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    action_type: Mapped[ActionType] = mapped_column(
        Enum(ActionType, name="action_type_enum"), nullable=False, default=ActionType.navigate
    )
    # For connect_agent: phone extension or dept id; for info: display text
    action_target: Mapped[str | None] = mapped_column(String(256), nullable=True)

    # Self-referential relationship
    parent: Mapped[MenuNode | None] = relationship(
        "MenuNode",
        remote_side=[id],
        back_populates="children",
    )
    children: Mapped[list[MenuNode]] = relationship(
        "MenuNode",
        back_populates="parent",
        order_by="MenuNode.sort_order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    selection_events: Mapped[list["SelectionEvent"]] = relationship(
        "SelectionEvent", back_populates="node", cascade="all, delete-orphan"
    )

    def label(self, locale: str = "en") -> str:
        return self.labels.get(locale) or self.labels.get("en") or ""

    def prompt_text(self, locale: str = "en") -> str:
        return self.prompt_texts.get(locale) or self.prompt_texts.get("en") or ""


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    source: Mapped[SessionSource] = mapped_column(
        Enum(SessionSource, name="session_source_enum"),
        nullable=False,
        default=SessionSource.web,
    )
    caller_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    call_session_token: Mapped[str | None] = mapped_column(String(128), nullable=True)

    selection_events: Mapped[list["SelectionEvent"]] = relationship(
        "SelectionEvent", back_populates="session", cascade="all, delete-orphan"
    )


class SelectionEvent(Base):
    __tablename__ = "selection_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    node_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("menu_nodes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    selected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    session: Mapped["Session"] = relationship("Session", back_populates="selection_events")
    node: Mapped["MenuNode"] = relationship("MenuNode", back_populates="selection_events")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[AdminRole] = mapped_column(
        Enum(AdminRole, name="admin_role_enum"),
        nullable=False,
        default=AdminRole.editor,
    )

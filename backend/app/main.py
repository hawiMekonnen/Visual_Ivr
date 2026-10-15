import os
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings
from app.database import Base, engine
from app.routers import admin, content, menu, sessions, sidebar, translate, tts, sip_relay, chat

# ---------------------------------------------------------------------------
# Structured logging setup
# ---------------------------------------------------------------------------

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.dev.ConsoleRenderer() if os.getenv("DEBUG") else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(20),  # INFO
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

log = structlog.get_logger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address)


# ---------------------------------------------------------------------------
# Lifespan: create tables on startup
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup (Alembic handles migrations in production)."""
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    log.info("startup", database_url=settings.DATABASE_URL.split("@")[-1])  # hide credentials
    yield
    log.info("shutdown")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


def create_app() -> FastAPI:
    app = FastAPI(
        title="Visual IVR API",
        description="Backend API for the Visual IVR system",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # Rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(menu.router)
    app.include_router(sessions.router)
    app.include_router(admin.router)
    app.include_router(sidebar.router)
    app.include_router(content.router)
    app.include_router(translate.router)
    app.include_router(tts.router)
    app.include_router(sip_relay.router)
    app.include_router(chat.router)

    # Static media files (audio uploads)
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    app.mount(settings.MEDIA_URL_PREFIX, StaticFiles(directory=settings.MEDIA_DIR), name="media")

    # ---------------------------------------------------------------------------
    # Graceful no-JS fallback: server-rendered HTML menu
    # ---------------------------------------------------------------------------

    @app.get("/menu-fallback", response_class=HTMLResponse, include_in_schema=False)
    async def menu_fallback(request: Request):
        """
        Server-rendered HTML fallback for users with JavaScript disabled.
        Reads the menu tree from DB and renders a simple accessible HTML page.
        """
        from sqlalchemy.orm import Session as DbSession
        from app.database import SessionLocal
        from app.models import MenuNode as MN

        db: DbSession = SessionLocal()
        try:
            roots = (
                db.query(MN)
                .filter(MN.parent_id.is_(None))
                .order_by(MN.sort_order)
                .all()
            )

            def render_node(node: MN, depth: int = 0) -> str:
                indent = "  " * depth
                label = node.label("en")
                prompt = node.prompt_text("en")
                children_html = "".join(render_node(c, depth + 1) for c in node.children)
                return f"""
{indent}<li>
{indent}  <details {'open' if depth == 0 else ''}>
{indent}    <summary><strong>{label}</strong></summary>
{indent}    <p>{prompt}</p>
{indent}    {'<ul>' + children_html + '</ul>' if children_html else ''}
{indent}  </details>
{indent}</li>"""

            items = "".join(render_node(r) for r in roots)
        finally:
            db.close()

        return HTMLResponse(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual IVR – Text Menu</title>
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }}
    ul {{ list-style: none; padding-left: 1rem; }}
    details {{ margin: 0.5rem 0; }}
    summary {{ cursor: pointer; padding: 0.5rem; background: #f0f0f0; border-radius: 4px; }}
    p {{ margin: 0.25rem 0 0.5rem 1rem; color: #555; }}
    .notice {{ background: #fffbe6; border-left: 4px solid #f0a; padding: 1rem; margin-bottom: 1rem; }}
  </style>
</head>
<body>
  <h1>📞 Visual IVR – Text Menu</h1>
  <p class="notice">⚠️ JavaScript is disabled. Using simplified text menu.
    <a href="/">Enable JavaScript for the full experience</a>.</p>
  <nav aria-label="IVR Menu">
    <ul>{items}</ul>
  </nav>
</body>
</html>""")

    @app.post("/api/logs", include_in_schema=False)
    async def log_client_message(request: Request):
        body = await request.json()
        level = body.get("level", "info")
        msg = body.get("message", "")
        log.warning("frontend_client_log", client_level=level, msg=msg)
        # Append to log file
        try:
            with open("client_debug.log", "a", encoding="utf-8") as f:
                f.write(f"[{level.upper()}] {msg}\n")
        except Exception:
            pass
        return {"status": "ok"}

    return app


app = create_app()

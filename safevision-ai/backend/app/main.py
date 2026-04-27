import logging

from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, get_db
from app.core.deps import get_current_user
from app.core.security import decode_access_token
from app.models.base import Base
from app.websocket.manager import manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────────────────────

from app.api.routes import analytics, auth, billing, cameras, incidents, locations, organizations, users  # noqa: E402

api_v1 = "/api/v1"
app.include_router(auth.router, prefix=api_v1)
app.include_router(organizations.router, prefix=api_v1)
app.include_router(locations.router, prefix=api_v1)
app.include_router(cameras.router, prefix=api_v1)
app.include_router(incidents.router, prefix=api_v1)
app.include_router(analytics.router, prefix=api_v1)
app.include_router(users.router, prefix=api_v1)
app.include_router(billing.router, prefix=api_v1)


# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket, token: str | None = None):
    if not token:
        await websocket.close(code=4001)
        return
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    from sqlalchemy import select
    from app.core.database import async_session
    from app.models.user import User

    async with async_session() as db:
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.organization_id:
            await websocket.close(code=4001)
            return
        org_id = user.organization_id

    await manager.connect(websocket, org_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Heartbeat / client messages handled here
    except WebSocketDisconnect:
        manager.disconnect(websocket, org_id)


# ─── Health & Startup ─────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": settings.APP_VERSION}


@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("SafeVision AI API started")


@app.on_event("shutdown")
async def on_shutdown():
    await engine.dispose()
    logger.info("SafeVision AI API stopped")

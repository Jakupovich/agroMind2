import json
import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, organization_id: int) -> None:
        await websocket.accept()
        self._connections[organization_id].append(websocket)
        logger.info("WebSocket connected for org %s", organization_id)

    def disconnect(self, websocket: WebSocket, organization_id: int) -> None:
        self._connections[organization_id] = [
            ws for ws in self._connections[organization_id] if ws != websocket
        ]
        logger.info("WebSocket disconnected for org %s", organization_id)

    async def broadcast_to_org(self, organization_id: int, message: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self._connections.get(organization_id, []):
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, organization_id)

    async def broadcast_alert(
        self,
        organization_id: int,
        incident_id: int,
        incident_type: str,
        severity: str,
        camera_name: str,
        description: str,
        screenshot_url: str | None = None,
    ) -> None:
        await self.broadcast_to_org(
            organization_id,
            {
                "type": "alert",
                "data": {
                    "incident_id": incident_id,
                    "incident_type": incident_type,
                    "severity": severity,
                    "camera_name": camera_name,
                    "description": description,
                    "screenshot_url": screenshot_url,
                },
            },
        )


manager = ConnectionManager()

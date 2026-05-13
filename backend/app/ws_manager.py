"""WebSocket connection manager for real-time community SOS notifications."""
from fastapi import WebSocket
from typing import Dict


class ConnectionManager:
    """Manages WebSocket connections per user for real-time alerts."""

    def __init__(self):
        # user_id -> WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        self.active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, data: dict) -> bool:
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
                return True
            except Exception:
                self.disconnect(user_id)
                return False
        return False

    async def broadcast_to_users(self, user_ids: list[int], data: dict) -> int:
        """Send data to multiple users. Returns count of successful sends."""
        count = 0
        for uid in user_ids:
            if await self.send_to_user(uid, data):
                count += 1
        return count


manager = ConnectionManager()

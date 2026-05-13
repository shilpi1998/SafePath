from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models import User
from app.auth import get_current_user
from app.ws_manager import manager

router = APIRouter(prefix="/api/community", tags=["community"])


@router.post("/toggle-support")
def toggle_community_support(
    enabled: bool = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enable or disable community support for the current user."""
    user.community_support_enabled = enabled
    db.commit()
    return {
        "community_support_enabled": user.community_support_enabled,
        "message": "Community support enabled. You'll receive alerts when someone nearby needs help."
        if enabled
        else "Community support disabled.",
    }


@router.post("/update-location")
def update_location(
    latitude: float = Query(...),
    longitude: float = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user's current location for community proximity alerts."""
    user.last_latitude = latitude
    user.last_longitude = longitude
    user.last_location_update = datetime.now(timezone.utc)
    db.commit()
    return {"status": "location_updated"}


@router.get("/status")
def get_community_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's community support status."""
    nearby_helpers = (
        db.query(User)
        .filter(
            User.community_support_enabled == True,
            User.is_active == True,
            User.id != user.id,
            User.last_latitude.isnot(None),
        )
        .count()
    )
    return {
        "community_support_enabled": user.community_support_enabled,
        "nearby_helpers_total": nearby_helpers,
        "last_location": {
            "latitude": user.last_latitude,
            "longitude": user.last_longitude,
        }
        if user.last_latitude
        else None,
    }


@router.post("/sos")
async def trigger_community_sos(
    latitude: float = Query(...),
    longitude: float = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Trigger community SOS - notifies all community helpers within 5km radius.
    Sends real-time WebSocket notification to nearby users.
    """
    radius_km = 5.0

    # Find all community helpers with known location
    helpers = (
        db.query(User)
        .filter(
            User.community_support_enabled == True,
            User.is_active == True,
            User.id != user.id,
            User.last_latitude.isnot(None),
            User.last_longitude.isnot(None),
        )
        .all()
    )

    # Filter by distance (within 5km)
    nearby_helpers = []
    for helper in helpers:
        dist = (
            (helper.last_latitude - latitude) ** 2
            + (helper.last_longitude - longitude) ** 2
        ) ** 0.5 * 111  # Approximate km
        if dist <= radius_km:
            nearby_helpers.append(helper)

    # Send WebSocket notifications to nearby helpers
    google_maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"
    alert_data = {
        "type": "community_sos",
        "victim_name": user.full_name,
        "latitude": latitude,
        "longitude": longitude,
        "google_maps_link": google_maps_link,
        "message": f"{user.full_name} is in danger and needs immediate help!",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    notified_count = await manager.broadcast_to_users(
        [h.id for h in nearby_helpers], alert_data
    )

    return {
        "status": "community_sos_triggered",
        "helpers_in_radius": len(nearby_helpers),
        "helpers_notified_realtime": notified_count,
        "radius_km": radius_km,
        "location": {"latitude": latitude, "longitude": longitude},
        "google_maps_link": google_maps_link,
        "message": f"SOS sent to {len(nearby_helpers)} community helpers within {radius_km}km. "
        f"{notified_count} received real-time notification.",
    }


@router.get("/nearby-helpers")
def get_nearby_helpers(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(default=5.0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get count of community helpers within radius."""
    helpers = (
        db.query(User)
        .filter(
            User.community_support_enabled == True,
            User.is_active == True,
            User.id != user.id,
            User.last_latitude.isnot(None),
        )
        .all()
    )

    nearby = []
    for h in helpers:
        dist = ((h.last_latitude - latitude) ** 2 + (h.last_longitude - longitude) ** 2) ** 0.5 * 111
        if dist <= radius_km:
            nearby.append({"id": h.id, "name": h.full_name, "distance_km": round(dist, 2)})

    return {"helpers_count": len(nearby), "radius_km": radius_km, "helpers": nearby}


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket endpoint for receiving real-time community SOS alerts."""
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive, receive heartbeats
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(user_id)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Incident, DangerZone, SafeZone
from app.schemas import ChatMessage, ChatResponse
from app.config import ANTHROPIC_API_KEY
import anthropic
import math

router = APIRouter(prefix="/api/chat", tags=["chat"])


def get_nearby_context(lat: float, lng: float, db: Session, radius_km: float = 2.0) -> str:
    """Get safety context for the AI about the user's current location."""
    context_parts = []

    incidents = db.query(Incident).filter(Incident.is_active == True).all()
    nearby_incidents = []
    for inc in incidents:
        dist = math.sqrt((inc.latitude - lat) ** 2 + (inc.longitude - lng) ** 2) * 111
        if dist <= radius_km:
            nearby_incidents.append(f"- {inc.incident_type.value} ({inc.severity.value}): {inc.title} ({dist:.1f}km away)")
    if nearby_incidents:
        context_parts.append("Nearby incidents:\n" + "\n".join(nearby_incidents))

    danger_zones = db.query(DangerZone).filter(DangerZone.is_active == True).all()
    nearby_dangers = []
    for dz in danger_zones:
        dist = math.sqrt((dz.latitude - lat) ** 2 + (dz.longitude - lng) ** 2) * 111
        if dist <= radius_km:
            nearby_dangers.append(f"- {dz.name} ({dz.severity.value}): {dz.reason} ({dist:.1f}km away)")
    if nearby_dangers:
        context_parts.append("Nearby danger zones:\n" + "\n".join(nearby_dangers))

    safe_zones = db.query(SafeZone).all()
    nearby_safe = []
    for sz in safe_zones:
        dist = math.sqrt((sz.latitude - lat) ** 2 + (sz.longitude - lng) ** 2) * 111
        if dist <= radius_km:
            nearby_safe.append(f"- {sz.name} ({sz.zone_type}): {sz.address} ({dist:.1f}km away)")
    if nearby_safe:
        context_parts.append("Nearby safe zones:\n" + "\n".join(nearby_safe))

    return "\n\n".join(context_parts) if context_parts else "No specific safety data available for this area."


@router.post("/message", response_model=ChatResponse)
def chat(msg: ChatMessage, db: Session = Depends(get_db)):
    safety_context = ""
    if msg.latitude is not None and msg.longitude is not None:
        safety_context = get_nearby_context(msg.latitude, msg.longitude, db)

    system_prompt = f"""You are SafePath AI, a friendly and vigilant travel safety companion for smart cities.
Your role is to:
1. Help users navigate safely through the city
2. Provide real-time safety advice based on their location
3. Suggest safer alternatives when they're heading toward dangerous areas
4. Help plan safe daily itineraries
5. Offer emergency guidance when needed

Current safety context for the user's area:
{safety_context}

Be concise, helpful, and prioritize safety. If the user seems to be in danger, provide immediate actionable advice.
Always maintain a calm, reassuring tone while being direct about safety concerns."""

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": msg.message}],
    )

    reply = response.content[0].text

    # Extract safety alerts from context
    safety_alerts = []
    if msg.latitude and msg.longitude:
        incidents = db.query(Incident).filter(Incident.is_active == True).all()
        for inc in incidents:
            dist = math.sqrt((inc.latitude - msg.latitude) ** 2 + (inc.longitude - msg.longitude) ** 2) * 111
            if dist <= 0.5 and inc.severity.value in ("high", "critical"):
                safety_alerts.append(f"WARNING: {inc.title} - {dist:.0f}m from your location")

    return ChatResponse(reply=reply, safety_alerts=safety_alerts)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, EmergencyContact
from app.schemas import EmergencyContactCreate, EmergencyContactResponse
from app.auth import get_current_user
from app.notifications import send_sos_alerts, send_sms

router = APIRouter(prefix="/api/emergency", tags=["emergency"])


@router.get("/contacts", response_model=list[EmergencyContactResponse])
def get_contacts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(EmergencyContact).filter(EmergencyContact.user_id == user.id).all()


@router.post("/contacts", response_model=EmergencyContactResponse)
def add_contact(
    data: EmergencyContactCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = EmergencyContact(
        user_id=user.id,
        name=data.name,
        phone=data.phone,
        email=data.email,
        relationship_type=data.relationship_type,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id, EmergencyContact.user_id == user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"status": "deleted"}


@router.post("/test-sms")
def test_sms(to_phone: str):
    """Test endpoint - send a test SMS to verify Twilio is working."""
    result = send_sms(to_phone, "Test message from SafePath - SMS is working!")
    return {"to": to_phone, "result": result}


@router.post("/sos")
def trigger_sos(
    latitude: float = Query(...),
    longitude: float = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger real SOS - sends SMS via Twilio and Email to all emergency contacts."""
    contacts = db.query(EmergencyContact).filter(EmergencyContact.user_id == user.id).all()

    if not contacts:
        raise HTTPException(
            status_code=400,
            detail="No emergency contacts configured. Please add contacts first.",
        )

    results = send_sos_alerts(user.full_name, latitude, longitude, contacts)

    return {
        "status": "sos_triggered",
        "location": {"latitude": latitude, "longitude": longitude},
        "google_maps_link": f"https://www.google.com/maps?q={latitude},{longitude}",
        "contacts_notified": results,
        "message": f"SOS alert sent to {len(results)} emergency contacts with your location.",
    }

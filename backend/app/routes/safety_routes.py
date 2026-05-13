from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models import Incident, SafeZone, DangerZone
from app.schemas import (
    IncidentCreate, IncidentResponse,
    SafeZoneResponse, DangerZoneResponse,
    HeatMapPoint, HeatMapResponse,
)
from app.auth import get_current_user
from app.heatmap_data import get_full_delhi_ncr_heatmap
from app.crime_fetcher import get_live_crime_data

router = APIRouter(prefix="/api/safety", tags=["safety"])


@router.get("/incidents", response_model=list[IncidentResponse])
def get_incidents(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(default=5.0),
    db: Session = Depends(get_db),
):
    incidents = db.query(Incident).filter(Incident.is_active == True).all()
    nearby = []
    for inc in incidents:
        dist = ((inc.latitude - lat) ** 2 + (inc.longitude - lng) ** 2) ** 0.5 * 111
        if dist <= radius_km:
            nearby.append(inc)
    return nearby


@router.post("/incidents", response_model=IncidentResponse)
def report_incident(
    data: IncidentCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    incident = Incident(
        reporter_id=user.id,
        incident_type=data.incident_type,
        severity=data.severity,
        title=data.title,
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.post("/incidents/anonymous", response_model=IncidentResponse)
def report_incident_anonymous(
    data: IncidentCreate,
    db: Session = Depends(get_db),
):
    """Report an incident anonymously without requiring authentication."""
    incident = Incident(
        reporter_id=None,
        incident_type=data.incident_type,
        severity=data.severity,
        title=data.title,
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.post("/incidents/{incident_id}/upvote")
def upvote_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.upvotes += 1
    db.commit()
    return {"upvotes": incident.upvotes}


@router.get("/safe-zones", response_model=list[SafeZoneResponse])
def get_safe_zones(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(default=5.0),
    db: Session = Depends(get_db),
):
    zones = db.query(SafeZone).all()
    nearby = []
    for z in zones:
        dist = ((z.latitude - lat) ** 2 + (z.longitude - lng) ** 2) ** 0.5 * 111
        if dist <= radius_km:
            nearby.append(z)
    return nearby


@router.get("/danger-zones", response_model=list[DangerZoneResponse])
def get_danger_zones(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(default=5.0),
    db: Session = Depends(get_db),
):
    zones = db.query(DangerZone).filter(DangerZone.is_active == True).all()
    nearby = []
    for z in zones:
        dist = ((z.latitude - lat) ** 2 + (z.longitude - lng) ** 2) ** 0.5 * 111
        if dist <= radius_km:
            nearby.append(z)
    return nearby


@router.get("/heatmap", response_model=HeatMapResponse)
def get_heatmap(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(default=50.0),
    live: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    """Get comprehensive Delhi NCR heatmap data with risk categorization + live crime news."""
    points = []
    high_count = 0
    medium_count = 0
    low_count = 0
    live_crime_count = 0

    # 1. Base zone data (historical/known patterns)
    ncr_data = get_full_delhi_ncr_heatmap()
    for zone in ncr_data:
        dist = ((zone["latitude"] - lat) ** 2 + (zone["longitude"] - lng) ** 2) ** 0.5 * 111
        if dist <= radius_km:
            points.append(HeatMapPoint(
                latitude=zone["latitude"],
                longitude=zone["longitude"],
                weight=zone["weight"],
                zone_name=zone["zone_name"],
                risk_level=zone["risk_level"],
            ))
            if zone["risk_level"] == "high":
                high_count += 1
            elif zone["risk_level"] == "medium":
                medium_count += 1
            else:
                low_count += 1

    # 2. Live crime news data (real-time from Google News)
    if live:
        try:
            live_data = get_live_crime_data()
            for crime in live_data["points"]:
                dist = ((crime["latitude"] - lat) ** 2 + (crime["longitude"] - lng) ** 2) ** 0.5 * 111
                if dist <= radius_km:
                    points.append(HeatMapPoint(
                        latitude=crime["latitude"],
                        longitude=crime["longitude"],
                        weight=crime["weight"],
                        zone_name=crime["zone_name"],
                        risk_level=crime["risk_level"],
                    ))
                    live_crime_count += 1
                    if crime["risk_level"] == "high":
                        high_count += 1
                    elif crime["risk_level"] == "medium":
                        medium_count += 1
                    else:
                        low_count += 1
        except Exception as e:
            print(f"Live crime fetch failed (non-blocking): {e}")

    # 3. User-reported incidents from DB
    incidents = db.query(Incident).filter(Incident.is_active == True).all()
    severity_weight = {"low": 0.25, "medium": 0.5, "high": 0.75, "critical": 1.0}
    for inc in incidents:
        dist = ((inc.latitude - lat) ** 2 + (inc.longitude - lng) ** 2) ** 0.5 * 111
        if dist <= radius_km:
            w = severity_weight.get(inc.severity.value, 0.5)
            risk = "high" if w >= 0.67 else "medium" if w >= 0.34 else "low"
            points.append(HeatMapPoint(
                latitude=inc.latitude,
                longitude=inc.longitude,
                weight=w,
                zone_name=inc.title,
                risk_level=risk,
            ))
            if risk == "high":
                high_count += 1
            elif risk == "medium":
                medium_count += 1
            else:
                low_count += 1

    return HeatMapResponse(
        points=points,
        generated_at=datetime.now(timezone.utc),
        total_zones=len(points),
        high_risk_count=high_count,
        medium_risk_count=medium_count,
        low_risk_count=low_count,
        live_crime_count=live_crime_count,
    )

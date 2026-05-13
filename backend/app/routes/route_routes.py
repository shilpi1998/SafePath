import math
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Incident, DangerZone
from app.schemas import (
    RouteRequest, RouteResponse, Destination,
    SafetyScore, RoutePoint,
)

router = APIRouter(prefix="/api/routes", tags=["routes"])


def calculate_safety_score(lat: float, lng: float, incidents, danger_zones, current_hour: int = 12) -> SafetyScore:
    """Calculate safety score for a location based on nearby incidents and danger zones."""
    score = 100.0
    factors = []

    for inc in incidents:
        dist = math.sqrt((inc.latitude - lat) ** 2 + (inc.longitude - lng) ** 2) * 111
        if dist < 0.5:
            penalty = {"low": 5, "medium": 10, "high": 20, "critical": 35}.get(inc.severity.value, 10)
            score -= penalty * max(0, 1 - dist / 0.5)
            factors.append(f"{inc.incident_type.value} reported nearby ({dist:.0f}m)")

    for dz in danger_zones:
        dist = math.sqrt((dz.latitude - lat) ** 2 + (dz.longitude - lng) ** 2) * 111
        radius_km = dz.radius_meters / 1000
        if dist < radius_km:
            if dz.time_based and dz.dangerous_hours_start is not None:
                if not (dz.dangerous_hours_start <= current_hour <= dz.dangerous_hours_end):
                    continue
            penalty = {"low": 10, "medium": 20, "high": 35, "critical": 50}.get(dz.severity.value, 20)
            score -= penalty * max(0, 1 - dist / radius_km)
            factors.append(f"Danger zone: {dz.name}")

    score = max(0, min(100, score))
    if score >= 75:
        level = "safe"
    elif score >= 50:
        level = "moderate"
    elif score >= 25:
        level = "caution"
    else:
        level = "dangerous"

    return SafetyScore(score=round(score, 1), level=level, factors=factors)


def haversine_km(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def nearest_neighbor_order(start_lat, start_lng, destinations, incidents, danger_zones, prefer_safety):
    """Order destinations using nearest-neighbor with safety weighting."""
    remaining = list(enumerate(destinations))
    ordered = []
    current_lat, current_lng = start_lat, start_lng

    while remaining:
        best_idx = None
        best_cost = float("inf")
        for i, (orig_idx, dest) in enumerate(remaining):
            dist = haversine_km(current_lat, current_lng, dest.latitude, dest.longitude)
            if prefer_safety:
                safety = calculate_safety_score(dest.latitude, dest.longitude, incidents, danger_zones)
                # Lower score = more dangerous = higher cost penalty
                safety_penalty = (100 - safety.score) / 100 * dist * 0.5
                cost = dist + safety_penalty
            else:
                cost = dist
            if cost < best_cost:
                best_cost = cost
                best_idx = i
        orig_idx, dest = remaining.pop(best_idx)
        ordered.append(dest)
        current_lat, current_lng = dest.latitude, dest.longitude

    return ordered


@router.post("/plan", response_model=RouteResponse)
def plan_route(req: RouteRequest, db: Session = Depends(get_db)):
    incidents = db.query(Incident).filter(Incident.is_active == True).all()
    danger_zones = db.query(DangerZone).filter(DangerZone.is_active == True).all()

    ordered = nearest_neighbor_order(
        req.start_latitude, req.start_longitude,
        req.destinations, incidents, danger_zones, req.prefer_safety,
    )

    # Build route points with safety scores
    route_points = []
    warnings = []
    total_distance = 0.0
    prev_lat, prev_lng = req.start_latitude, req.start_longitude

    # Start point
    start_safety = calculate_safety_score(prev_lat, prev_lng, incidents, danger_zones)
    route_points.append(RoutePoint(latitude=prev_lat, longitude=prev_lng, safety_score=start_safety))

    for dest in ordered:
        dist = haversine_km(prev_lat, prev_lng, dest.latitude, dest.longitude)
        total_distance += dist

        # Add intermediate points along the route
        steps = max(2, int(dist / 0.5))
        for s in range(1, steps + 1):
            frac = s / steps
            ilat = prev_lat + (dest.latitude - prev_lat) * frac
            ilng = prev_lng + (dest.longitude - prev_lng) * frac
            safety = calculate_safety_score(ilat, ilng, incidents, danger_zones)
            route_points.append(RoutePoint(latitude=ilat, longitude=ilng, safety_score=safety))
            if safety.level in ("caution", "dangerous"):
                for f in safety.factors:
                    if f not in warnings:
                        warnings.append(f)

        prev_lat, prev_lng = dest.latitude, dest.longitude

    # Estimate time: avg walking 5km/h or driving 30km/h
    estimated_time = total_distance / 30 * 60

    overall_scores = [rp.safety_score.score for rp in route_points]
    avg_score = sum(overall_scores) / len(overall_scores) if overall_scores else 100

    overall_safety = SafetyScore(
        score=round(avg_score, 1),
        level="safe" if avg_score >= 75 else "moderate" if avg_score >= 50 else "caution" if avg_score >= 25 else "dangerous",
        factors=warnings[:5],
    )

    return RouteResponse(
        ordered_destinations=[Destination(name=d.name, latitude=d.latitude, longitude=d.longitude) for d in ordered],
        total_distance_km=round(total_distance, 2),
        estimated_time_minutes=round(estimated_time, 1),
        overall_safety_score=overall_safety,
        warnings=warnings,
        route_points=route_points,
    )

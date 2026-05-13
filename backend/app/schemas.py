from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.models import IncidentSeverity, IncidentType


# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    community_support_enabled: bool = False

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Emergency Contacts
class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    relationship_type: Optional[str] = None


class EmergencyContactResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    relationship_type: Optional[str] = None

    class Config:
        from_attributes = True


# Incidents
class IncidentCreate(BaseModel):
    incident_type: IncidentType
    severity: IncidentSeverity
    title: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None


class IncidentResponse(BaseModel):
    id: int
    incident_type: IncidentType
    severity: IncidentSeverity
    title: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    created_at: datetime
    is_active: bool
    upvotes: int

    class Config:
        from_attributes = True


# Route Planning
class Destination(BaseModel):
    name: str
    latitude: float
    longitude: float


class RouteRequest(BaseModel):
    destinations: list[Destination]
    start_latitude: float
    start_longitude: float
    prefer_safety: bool = True


class SafetyScore(BaseModel):
    score: float  # 0-100
    level: str  # safe, moderate, caution, dangerous
    factors: list[str]


class RoutePoint(BaseModel):
    latitude: float
    longitude: float
    safety_score: SafetyScore


class RouteResponse(BaseModel):
    ordered_destinations: list[Destination]
    total_distance_km: float
    estimated_time_minutes: float
    overall_safety_score: SafetyScore
    warnings: list[str]
    route_points: list[RoutePoint]


# Safety Heat Map
class HeatMapPoint(BaseModel):
    latitude: float
    longitude: float
    weight: float  # 0-1, higher = more dangerous
    zone_name: Optional[str] = None
    risk_level: Optional[str] = None  # "low", "medium", "high"


class HeatMapResponse(BaseModel):
    points: list[HeatMapPoint]
    generated_at: datetime
    total_zones: int = 0
    high_risk_count: int = 0
    medium_risk_count: int = 0
    low_risk_count: int = 0
    live_crime_count: int = 0


# Safe Zones
class SafeZoneResponse(BaseModel):
    id: int
    name: str
    zone_type: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    phone: Optional[str] = None
    is_24_hours: bool

    class Config:
        from_attributes = True


# Danger Zones
class DangerZoneResponse(BaseModel):
    id: int
    name: str
    severity: IncidentSeverity
    latitude: float
    longitude: float
    radius_meters: float
    reason: Optional[str] = None
    time_based: bool
    dangerous_hours_start: Optional[int] = None
    dangerous_hours_end: Optional[int] = None

    class Config:
        from_attributes = True


# AI Chat
class ChatMessage(BaseModel):
    message: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ChatResponse(BaseModel):
    reply: str
    safety_alerts: list[str] = []

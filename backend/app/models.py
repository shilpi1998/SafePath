from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.database import Base


class IncidentSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentType(str, enum.Enum):
    ACCIDENT = "accident"
    CRIME = "crime"
    HAZARD = "hazard"
    CONSTRUCTION = "construction"
    POOR_LIGHTING = "poor_lighting"
    FLOOD = "flood"
    OTHER = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

    # Community Support
    community_support_enabled = Column(Boolean, default=False)
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)
    last_location_update = Column(DateTime, nullable=True)

    emergency_contacts = relationship("EmergencyContact", back_populates="user")
    incidents = relationship("Incident", back_populates="reporter")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    relationship_type = Column(String(100))

    user = relationship("User", back_populates="emergency_contacts")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    incident_type = Column(SQLEnum(IncidentType), nullable=False)
    severity = Column(SQLEnum(IncidentSeverity), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    address = Column(String(500))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    upvotes = Column(Integer, default=0)

    reporter = relationship("User", back_populates="incidents")


class SafeZone(Base):
    __tablename__ = "safe_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    zone_type = Column(String(100))  # police_station, hospital, fire_station, etc.
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    address = Column(String(500))
    phone = Column(String(20))
    is_24_hours = Column(Boolean, default=False)


class DangerZone(Base):
    __tablename__ = "danger_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    severity = Column(SQLEnum(IncidentSeverity), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=200)

    reason = Column(Text)
    time_based = Column(Boolean, default=False)
    dangerous_hours_start = Column(Integer, nullable=True)  # 0-23
    dangerous_hours_end = Column(Integer, nullable=True)  # 0-23
    is_active = Column(Boolean, default=True)

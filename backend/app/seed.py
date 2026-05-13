"""Seed the database with sample data for demo purposes."""
from app.database import SessionLocal, engine, Base
from app.models import Incident, SafeZone, DangerZone, IncidentSeverity, IncidentType

# Sample data centered around Delhi NCR, India
SAMPLE_INCIDENTS = [
    {"incident_type": IncidentType.ACCIDENT, "severity": IncidentSeverity.HIGH, "title": "Multi-vehicle pileup on NH-48", "description": "Major collision near Rajokri flyover causing traffic jam", "latitude": 28.5245, "longitude": 77.1055, "address": "NH-48, Rajokri, New Delhi"},
    {"incident_type": IncidentType.CRIME, "severity": IncidentSeverity.CRITICAL, "title": "Chain snatching reported", "description": "Multiple chain snatching incidents in the area", "latitude": 28.6328, "longitude": 77.2197, "address": "Chandni Chowk, Old Delhi"},
    {"incident_type": IncidentType.HAZARD, "severity": IncidentSeverity.MEDIUM, "title": "Broken traffic signal at ITO", "description": "Traffic signal malfunctioning causing chaos", "latitude": 28.6280, "longitude": 77.2410, "address": "ITO Intersection, New Delhi"},
    {"incident_type": IncidentType.POOR_LIGHTING, "severity": IncidentSeverity.LOW, "title": "Street lights out near Sarai Kale Khan", "description": "Multiple street lights not working on the stretch", "latitude": 28.5892, "longitude": 77.2568, "address": "Sarai Kale Khan, New Delhi"},
    {"incident_type": IncidentType.CONSTRUCTION, "severity": IncidentSeverity.LOW, "title": "Metro construction on Janakpuri stretch", "description": "Ongoing metro work, reduced road width", "latitude": 28.6219, "longitude": 77.0878, "address": "Janakpuri West, New Delhi"},
    {"incident_type": IncidentType.CRIME, "severity": IncidentSeverity.HIGH, "title": "Pickpocketing hotspot near New Delhi Railway Station", "description": "Frequent theft and pickpocketing reported", "latitude": 28.6424, "longitude": 77.2195, "address": "New Delhi Railway Station, Paharganj"},
    {"incident_type": IncidentType.FLOOD, "severity": IncidentSeverity.MEDIUM, "title": "Waterlogging at Minto Bridge", "description": "Heavy rain causing severe waterlogging", "latitude": 28.6260, "longitude": 77.2120, "address": "Minto Bridge, Connaught Place"},
    {"incident_type": IncidentType.ACCIDENT, "severity": IncidentSeverity.MEDIUM, "title": "Two-wheeler accident on Ring Road", "description": "Bike collision at AIIMS flyover", "latitude": 28.5672, "longitude": 77.2100, "address": "AIIMS Flyover, Ring Road"},
    {"incident_type": IncidentType.HAZARD, "severity": IncidentSeverity.HIGH, "title": "Open manhole on MG Road", "description": "Uncovered manhole posing danger to pedestrians", "latitude": 28.4810, "longitude": 77.0830, "address": "MG Road, Gurugram"},
    {"incident_type": IncidentType.CRIME, "severity": IncidentSeverity.MEDIUM, "title": "Vehicle theft reported in Dwarka", "description": "Multiple car thefts reported in Sector 12", "latitude": 28.5920, "longitude": 77.0410, "address": "Dwarka Sector 12, New Delhi"},
    {"incident_type": IncidentType.POOR_LIGHTING, "severity": IncidentSeverity.MEDIUM, "title": "Dark stretch near Yamuna bank", "description": "No lighting along the riverbank path", "latitude": 28.6120, "longitude": 77.2780, "address": "Yamuna Bank, East Delhi"},
    {"incident_type": IncidentType.ACCIDENT, "severity": IncidentSeverity.CRITICAL, "title": "Bus accident on GT Karnal Road", "description": "DTC bus collision with auto-rickshaw", "latitude": 28.7200, "longitude": 77.1550, "address": "GT Karnal Road, North Delhi"},
]

SAMPLE_SAFE_ZONES = [
    {"name": "Parliament Street Police Station", "zone_type": "police_station", "latitude": 28.6200, "longitude": 77.2120, "address": "Parliament Street, New Delhi", "phone": "011-23363227", "is_24_hours": True},
    {"name": "AIIMS Hospital", "zone_type": "hospital", "latitude": 28.5672, "longitude": 77.2100, "address": "Ansari Nagar, New Delhi", "phone": "011-26588500", "is_24_hours": True},
    {"name": "Hauz Khas Police Station", "zone_type": "police_station", "latitude": 28.5494, "longitude": 77.2001, "address": "Hauz Khas, New Delhi", "phone": "011-26853700", "is_24_hours": True},
    {"name": "Safdarjung Hospital", "zone_type": "hospital", "latitude": 28.5685, "longitude": 77.2065, "address": "Ansari Nagar West, New Delhi", "phone": "011-26707444", "is_24_hours": True},
    {"name": "Delhi Fire Station - Connaught Place", "zone_type": "fire_station", "latitude": 28.6315, "longitude": 77.2167, "address": "Connaught Place, New Delhi", "phone": "011-23363101", "is_24_hours": True},
    {"name": "Select Citywalk Security", "zone_type": "security_office", "latitude": 28.5289, "longitude": 77.2190, "address": "Saket District Centre, New Delhi", "phone": "011-29563100", "is_24_hours": False},
    {"name": "Max Super Speciality Hospital", "zone_type": "hospital", "latitude": 28.5537, "longitude": 77.2087, "address": "Saket, New Delhi", "phone": "011-26515050", "is_24_hours": True},
    {"name": "Lodhi Colony Police Station", "zone_type": "police_station", "latitude": 28.5900, "longitude": 77.2270, "address": "Lodhi Colony, New Delhi", "phone": "011-24611550", "is_24_hours": True},
]

SAMPLE_DANGER_ZONES = [
    {"name": "Paharganj Area", "severity": IncidentSeverity.HIGH, "latitude": 28.6440, "longitude": 77.2130, "radius_meters": 500, "reason": "High crime area - theft, scams, drug activity at night", "time_based": True, "dangerous_hours_start": 21, "dangerous_hours_end": 5},
    {"name": "GB Road", "severity": IncidentSeverity.CRITICAL, "latitude": 28.6380, "longitude": 77.2290, "radius_meters": 300, "reason": "Unsafe area especially at night - frequent mugging and assault", "time_based": False},
    {"name": "Sarai Kale Khan Bus Terminal", "severity": IncidentSeverity.MEDIUM, "latitude": 28.5892, "longitude": 77.2568, "radius_meters": 400, "reason": "Pickpocketing and petty theft hotspot", "time_based": True, "dangerous_hours_start": 20, "dangerous_hours_end": 6},
    {"name": "Kashmere Gate ISBT Surroundings", "severity": IncidentSeverity.HIGH, "latitude": 28.6670, "longitude": 77.2280, "radius_meters": 350, "reason": "Theft, robbery, and harassment reported frequently", "time_based": True, "dangerous_hours_start": 22, "dangerous_hours_end": 5},
    {"name": "Yamuna Bank Isolated Stretch", "severity": IncidentSeverity.MEDIUM, "latitude": 28.6120, "longitude": 77.2780, "radius_meters": 500, "reason": "Isolated area with no lighting - unsafe after dark", "time_based": True, "dangerous_hours_start": 19, "dangerous_hours_end": 6},
    {"name": "Nand Nagri Area", "severity": IncidentSeverity.HIGH, "latitude": 28.6950, "longitude": 77.3100, "radius_meters": 400, "reason": "High crime rate - chain snatching and robbery", "time_based": True, "dangerous_hours_start": 20, "dangerous_hours_end": 6},
    {"name": "Wazirabad Road Stretch", "severity": IncidentSeverity.MEDIUM, "latitude": 28.6980, "longitude": 77.2350, "radius_meters": 300, "reason": "Accident-prone zone with poor road conditions", "time_based": False},
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Only seed if empty
        if db.query(Incident).count() > 0:
            print("Database already seeded. Skipping.")
            return

        for data in SAMPLE_INCIDENTS:
            db.add(Incident(**data))
        for data in SAMPLE_SAFE_ZONES:
            db.add(SafeZone(**data))
        for data in SAMPLE_DANGER_ZONES:
            db.add(DangerZone(**data))

        db.commit()
        print(f"Seeded: {len(SAMPLE_INCIDENTS)} incidents, {len(SAMPLE_SAFE_ZONES)} safe zones, {len(SAMPLE_DANGER_ZONES)} danger zones")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

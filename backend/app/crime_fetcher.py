"""
Real-time crime data fetcher for Delhi NCR.
Fetches latest crime news from Google News RSS and maps to heatmap points.
"""
import re
import ssl
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.parse import quote

# Disable SSL verification for fetching news (hackathon use)
SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE

# Known Delhi NCR locations with coordinates
LOCATION_COORDS = {
    "paharganj": (28.6440, 77.2130),
    "connaught place": (28.6315, 77.2167),
    "cp": (28.6315, 77.2167),
    "chandni chowk": (28.6328, 77.2197),
    "karol bagh": (28.6510, 77.1900),
    "saket": (28.5289, 77.2190),
    "dwarka": (28.5850, 77.0500),
    "rohini": (28.7350, 77.1200),
    "janakpuri": (28.6219, 77.0878),
    "lajpat nagar": (28.5690, 77.2380),
    "defence colony": (28.5740, 77.2300),
    "noida": (28.5700, 77.3200),
    "greater noida": (28.4700, 77.5000),
    "gurgaon": (28.4700, 77.0700),
    "gurugram": (28.4700, 77.0700),
    "faridabad": (28.4100, 77.3100),
    "ghaziabad": (28.6700, 77.4000),
    "indirapuram": (28.6600, 77.4100),
    "vasant kunj": (28.5450, 77.1550),
    "vasant vihar": (28.5580, 77.1570),
    "hauz khas": (28.5494, 77.2001),
    "south extension": (28.5750, 77.2200),
    "greater kailash": (28.5400, 77.2350),
    "gk": (28.5400, 77.2350),
    "nehru place": (28.5490, 77.2530),
    "okhla": (28.5300, 77.2700),
    "mayur vihar": (28.6080, 77.2830),
    "laxmi nagar": (28.6310, 77.2750),
    "preet vihar": (28.6350, 77.2800),
    "shahdara": (28.6750, 77.2900),
    "pitampura": (28.7000, 77.1400),
    "shalimar bagh": (28.7050, 77.1500),
    "model town": (28.7100, 77.1900),
    "civil lines": (28.6800, 77.2200),
    "old delhi": (28.6350, 77.2230),
    "new delhi": (28.6139, 77.2090),
    "delhi": (28.6139, 77.2090),
    "ito": (28.6280, 77.2410),
    "aiims": (28.5672, 77.2100),
    "safdarjung": (28.5685, 77.2065),
    "tilak nagar": (28.6180, 77.0920),
    "rajouri garden": (28.6410, 77.1210),
    "punjabi bagh": (28.6650, 77.1300),
    "mundka": (28.6850, 77.0300),
    "nangloi": (28.6800, 77.0400),
    "sultanpuri": (28.7150, 77.0680),
    "mangolpuri": (28.7100, 77.0750),
    "jahangirpuri": (28.7250, 77.1700),
    "burari": (28.7400, 77.2000),
    "kashmere gate": (28.6670, 77.2280),
    "red fort": (28.6562, 77.2410),
    "india gate": (28.6129, 77.2295),
    "moti nagar": (28.6500, 77.1500),
    "uttam nagar": (28.6200, 77.0500),
    "vikaspuri": (28.6150, 77.0960),
    "palam": (28.5800, 77.0900),
    "mehrauli": (28.5200, 77.1800),
    "sangam vihar": (28.5100, 77.2400),
    "sarai kale khan": (28.5892, 77.2568),
    "nizamuddin": (28.5870, 77.2600),
    "anand vihar": (28.6390, 77.2850),
    "kalkaji": (28.5450, 77.2560),
    "cr park": (28.5350, 77.2400),
    "malviya nagar": (28.5350, 77.2100),
    "green park": (28.5550, 77.1950),
    "mukherjee nagar": (28.7000, 77.2000),
    "gtb nagar": (28.7050, 77.1950),
    "trilokpuri": (28.6100, 77.3100),
    "seemapuri": (28.6820, 77.3000),
    "seelampur": (28.6870, 77.3050),
    "nand nagri": (28.6950, 77.3100),
    "wazirabad": (28.7100, 77.1650),
    "azadpur": (28.7150, 77.1600),
    "narela": (28.8200, 77.1000),
    "badarpur": (28.5050, 77.3000),
    "sarita vihar": (28.5300, 77.2850),
    "jasola": (28.5400, 77.2800),
    "tughlakabad": (28.5150, 77.2600),
    "govindpuri": (28.5420, 77.2590),
    "aerocity": (28.5530, 77.1200),
    "mahipalpur": (28.5600, 77.1100),
    "mg road": (28.4810, 77.0830),
    "sohna road": (28.4200, 77.0700),
    "manesar": (28.3600, 77.0300),
    "sector 18": (28.5700, 77.3200),
    "sector 62": (28.5600, 77.3400),
    "sector 63": (28.5500, 77.3500),
    "vaishali": (28.6500, 77.4200),
    "ring road": (28.5800, 77.2180),
    "outer ring road": (28.6500, 77.1000),
    "nh-48": (28.5245, 77.1055),
    "gt karnal road": (28.7200, 77.1550),
    "yamuna bank": (28.6120, 77.2780),
    "patparganj": (28.5990, 77.3000),
    "sarojini nagar": (28.5720, 77.2000),
    "munirka": (28.5540, 77.1740),
    "rk puram": (28.5630, 77.1740),
    "dhaula kuan": (28.5920, 77.1600),
    "ina market": (28.5740, 77.2090),
    "moolchand": (28.5680, 77.2350),
    "tughlakabad extension": (28.5090, 77.2700),
    "badarpur border": (28.5000, 77.3050),
    "mehrauli-badarpur road": (28.5100, 77.2500),
    "chattarpur": (28.5050, 77.1800),
    "aya nagar": (28.4700, 77.1400),
    "lado sarai": (28.5280, 77.1900),
    "kishangarh": (28.5380, 77.2000),
    "shahpur jat": (28.5500, 77.2150),
    "andrews ganj": (28.5750, 77.2280),
    "lodi colony": (28.5850, 77.2220),
}

# Crime severity keywords
HIGH_SEVERITY_KEYWORDS = [
    "murder", "killed", "stabbed", "shot", "rape", "gang", "robbery",
    "carjacking", "kidnap", "abduct", "assault", "attack", "bomb",
    "terrorist", "shootout", "homicide", "death", "fatal",
    "molest", "harass", "eve-teasing", "groping", "stalk",
]

MEDIUM_SEVERITY_KEYWORDS = [
    "theft", "snatch", "stolen", "burglary", "fraud", "scam",
    "arrest", "drug", "fight", "brawl", "accident", "crash",
    "hit and run", "fire", "injured", "hurt",
    "chain snatching", "mobile theft", "pickpocket", "road rage", "eve teasing",
]

LOW_SEVERITY_KEYWORDS = [
    "complaint", "fir", "challan", "fine", "violation", "warning",
    "traffic", "parking", "noise", "dispute",
]


def determine_severity(text: str) -> tuple[float, str]:
    """Determine crime severity from text. Returns (weight, risk_level)."""
    text_lower = text.lower()
    for kw in HIGH_SEVERITY_KEYWORDS:
        if kw in text_lower:
            return (0.85, "high")
    for kw in MEDIUM_SEVERITY_KEYWORDS:
        if kw in text_lower:
            return (0.55, "medium")
    for kw in LOW_SEVERITY_KEYWORDS:
        if kw in text_lower:
            return (0.25, "low")
    return (0.5, "medium")


def extract_location(text: str) -> tuple[float, float, str] | None:
    """Extract location from text and return (lat, lng, location_name)."""
    text_lower = text.lower()
    # Try matching longer location names first
    sorted_locations = sorted(LOCATION_COORDS.keys(), key=len, reverse=True)
    for loc in sorted_locations:
        if loc in text_lower:
            lat, lng = LOCATION_COORDS[loc]
            return (lat, lng, loc.title())
    return None


def fetch_delhi_crime_news() -> list[dict]:
    """
    Fetch real-time crime news for Delhi NCR from Google News RSS.
    Returns list of crime data points with coordinates.
    """
    queries = [
        "Delhi+crime+today",
        "Delhi+NCR+robbery+theft",
        "Noida+Gurgaon+crime",
        "Delhi+accident+incident",
        "Delhi+police+arrest",
        "crimes+against+women+Delhi",
        "crimes+against+children+Delhi",
        "eve+teasing+harassment+Delhi",
        "women+safety+Delhi+NCR",
        "kidnapping+Delhi+NCR",
        "chain+snatching+Delhi",
        "road+accidents+Delhi",
    ]

    all_items = []

    for query in queries:
        try:
            url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
            req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            response = urlopen(req, timeout=5, context=SSL_CONTEXT)
            xml_data = response.read().decode("utf-8")
            root = ET.fromstring(xml_data)

            for item in root.findall(".//item"):
                title = item.find("title")
                pub_date = item.find("pubDate")
                if title is not None and title.text:
                    all_items.append({
                        "title": title.text,
                        "date": pub_date.text if pub_date is not None else None,
                    })
        except Exception as e:
            print(f"Failed to fetch news for query '{query}': {e}")
            continue

    # Parse news items into heatmap points
    crime_points = []
    seen_locations = set()

    for item in all_items:
        title = item["title"]
        location = extract_location(title)
        if location is None:
            continue

        lat, lng, loc_name = location

        # Avoid duplicate points for same location
        loc_key = f"{lat:.3f},{lng:.3f}"
        if loc_key in seen_locations:
            continue
        seen_locations.add(loc_key)

        weight, risk_level = determine_severity(title)

        # Add slight randomness to coordinates to avoid exact overlaps
        import random
        lat += random.uniform(-0.003, 0.003)
        lng += random.uniform(-0.003, 0.003)

        crime_points.append({
            "latitude": round(lat, 4),
            "longitude": round(lng, 4),
            "weight": weight,
            "zone_name": f"{loc_name}: {title[:60]}",
            "risk_level": risk_level,
            "source": "live_news",
            "headline": title,
        })

    return crime_points


def get_live_crime_data() -> dict:
    """
    Fetch live crime data and return summary with points.
    """
    points = fetch_delhi_crime_news()
    high = sum(1 for p in points if p["risk_level"] == "high")
    medium = sum(1 for p in points if p["risk_level"] == "medium")
    low = sum(1 for p in points if p["risk_level"] == "low")

    return {
        "points": points,
        "total": len(points),
        "high_count": high,
        "medium_count": medium,
        "low_count": low,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }

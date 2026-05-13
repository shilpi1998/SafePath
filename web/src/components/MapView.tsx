"use client";
import { useCallback, useState, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Circle,
  InfoWindow,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { Incident, SafeZone, DangerZone, HeatMapPoint, RoutePoint, Destination } from "@/lib/types";

const libraries: "places"[] = ["places"];

const containerStyle = { width: "100%", height: "100%" };

const severityColor: Record<string, string> = {
  low: "#FCD34D",
  medium: "#FB923C",
  high: "#EF4444",
  critical: "#991B1B",
};

const heatColor = (weight: number): string => {
  if (weight >= 0.75) return "#DC2626";
  if (weight >= 0.5) return "#F97316";
  if (weight >= 0.25) return "#FBBF24";
  return "#22C55E";
};

const safeZoneIcon: Record<string, string> = {
  police_station: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  hospital: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  fire_station: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  security_office: "https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
};

interface MapViewProps {
  center: { lat: number; lng: number };
  incidents?: Incident[];
  safeZones?: SafeZone[];
  dangerZones?: DangerZone[];
  heatMapPoints?: HeatMapPoint[];
  heatMapFilter?: "all" | "high" | "medium" | "low";
  routePoints?: RoutePoint[];
  routeDestinations?: Destination[];
  showHeatMap?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function MapView({
  center,
  incidents = [],
  safeZones = [],
  dangerZones = [],
  heatMapPoints = [],
  heatMapFilter = "all",
  routePoints = [],
  routeDestinations = [],
  showHeatMap = true,
  onMapClick,
}: MapViewProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedSafeZone, setSelectedSafeZone] = useState<SafeZone | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => setMap(map), []);

  // Fetch real road directions when route destinations change
  useEffect(() => {
    // Use routeDestinations (actual stops) if available, fallback to routePoints
    if (!isLoaded) {
      setDirections(null);
      return;
    }

    if (routeDestinations.length >= 2) {
      // Use actual ordered destinations for accurate multi-stop directions
      const directionsService = new google.maps.DirectionsService();
      const origin = routeDestinations[0];
      const destination = routeDestinations[routeDestinations.length - 1];
      const waypoints: google.maps.DirectionsWaypoint[] = routeDestinations
        .slice(1, -1)
        .map((d) => ({
          location: new google.maps.LatLng(d.latitude, d.longitude),
          stopover: true,
        }));

      directionsService.route(
        {
          origin: new google.maps.LatLng(origin.latitude, origin.longitude),
          destination: new google.maps.LatLng(destination.latitude, destination.longitude),
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          } else {
            console.warn("Directions request failed:", status);
            setDirections(null);
          }
        }
      );
    } else if (routePoints.length >= 2) {
      // Fallback: use first and last route points
      const directionsService = new google.maps.DirectionsService();
      const start = routePoints[0];
      const end = routePoints[routePoints.length - 1];

      directionsService.route(
        {
          origin: new google.maps.LatLng(start.latitude, start.longitude),
          destination: new google.maps.LatLng(end.latitude, end.longitude),
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          } else {
            setDirections(null);
          }
        }
      );
    } else {
      setDirections(null);
    }
  }, [isLoaded, routeDestinations, routePoints]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading map...</div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={showHeatMap ? 11 : 13}
      onLoad={onLoad}
      onClick={(e) => {
        if (onMapClick && e.latLng) {
          onMapClick(e.latLng.lat(), e.latLng.lng());
        }
      }}
      options={{
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
          { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#0e1626" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
          { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
      }}
    >
      {/* Heat Map - using colored circles with risk zone categorization */}
      {showHeatMap && heatMapPoints
        .filter((p) => heatMapFilter === "all" || p.risk_level === heatMapFilter)
        .map((p, i) => (
          <Circle
            key={`heat-${i}`}
            center={{ lat: p.latitude, lng: p.longitude }}
            radius={500 + p.weight * 400}
            options={{
              fillColor: heatColor(p.weight),
              fillOpacity: 0.35 + p.weight * 0.3,
              strokeColor: heatColor(p.weight),
              strokeOpacity: 0.7,
              strokeWeight: 2,
              clickable: false,
            }}
          />
        ))}

      {/* Incident Markers */}
      {incidents.map((inc) => (
        <Marker
          key={`inc-${inc.id}`}
          position={{ lat: inc.latitude, lng: inc.longitude }}
          icon={{
            url: `https://maps.google.com/mapfiles/ms/icons/${inc.severity === "critical" || inc.severity === "high" ? "red" : inc.severity === "medium" ? "orange" : "yellow"}-dot.png`,
          }}
          onClick={() => setSelectedIncident(inc)}
        />
      ))}

      {/* Safe Zone Markers */}
      {safeZones.map((sz) => (
        <Marker
          key={`safe-${sz.id}`}
          position={{ lat: sz.latitude, lng: sz.longitude }}
          icon={{ url: safeZoneIcon[sz.zone_type || ""] || "https://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
          onClick={() => setSelectedSafeZone(sz)}
        />
      ))}

      {/* Danger Zone Circles */}
      {dangerZones.map((dz) => (
        <Circle
          key={`danger-${dz.id}`}
          center={{ lat: dz.latitude, lng: dz.longitude }}
          radius={dz.radius_meters}
          options={{
            fillColor: severityColor[dz.severity] || "#EF4444",
            fillOpacity: 0.2,
            strokeColor: severityColor[dz.severity] || "#EF4444",
            strokeOpacity: 0.6,
            strokeWeight: 2,
          }}
        />
      ))}

      {/* Route - Real road directions */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            polylineOptions: {
              strokeColor: "#10B981",
              strokeOpacity: 0.9,
              strokeWeight: 5,
            },
            suppressMarkers: false,
            markerOptions: {
              zIndex: 100,
            },
          }}
        />
      )}

      {/* Info Windows */}
      {selectedIncident && (
        <InfoWindow
          position={{ lat: selectedIncident.latitude, lng: selectedIncident.longitude }}
          onCloseClick={() => setSelectedIncident(null)}
        >
          <div className="text-black p-1">
            <h3 className="font-bold text-sm">{selectedIncident.title}</h3>
            <p className="text-xs mt-1">
              <span className={`inline-block px-1.5 py-0.5 rounded text-white text-xs ${
                selectedIncident.severity === "critical" ? "bg-red-900" :
                selectedIncident.severity === "high" ? "bg-red-600" :
                selectedIncident.severity === "medium" ? "bg-orange-500" : "bg-yellow-500"
              }`}>
                {selectedIncident.severity.toUpperCase()}
              </span>
              {" "}{selectedIncident.incident_type}
            </p>
            {selectedIncident.description && (
              <p className="text-xs mt-1 text-gray-600">{selectedIncident.description}</p>
            )}
            {selectedIncident.address && (
              <p className="text-xs mt-1 text-gray-500">{selectedIncident.address}</p>
            )}
          </div>
        </InfoWindow>
      )}

      {selectedSafeZone && (
        <InfoWindow
          position={{ lat: selectedSafeZone.latitude, lng: selectedSafeZone.longitude }}
          onCloseClick={() => setSelectedSafeZone(null)}
        >
          <div className="text-black p-1">
            <h3 className="font-bold text-sm">{selectedSafeZone.name}</h3>
            <p className="text-xs mt-1 capitalize">{selectedSafeZone.zone_type?.replace("_", " ")}</p>
            {selectedSafeZone.address && <p className="text-xs text-gray-500">{selectedSafeZone.address}</p>}
            {selectedSafeZone.phone && <p className="text-xs text-blue-600">{selectedSafeZone.phone}</p>}
            {selectedSafeZone.is_24_hours && <p className="text-xs text-green-600 font-semibold">Open 24 Hours</p>}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

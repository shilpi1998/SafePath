import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE, Heatmap } from "react-native-maps";
import * as Location from "expo-location";
import { getIncidents, getSafeZones, getDangerZones, getHeatmap, triggerSOS, triggerCommunitySOS } from "../lib/api";

const severityColor: Record<string, string> = {
  low: "#FCD34D",
  medium: "#FB923C",
  high: "#EF4444",
  critical: "#991B1B",
};

const markerColor: Record<string, string> = {
  low: "yellow",
  medium: "orange",
  high: "red",
  critical: "purple",
};

const safeZoneColor: Record<string, string> = {
  police_station: "blue",
  hospital: "green",
  fire_station: "red",
  security_office: "indigo",
};

export default function MapScreen({ navigation }: any) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const [dangerZones, setDangerZones] = useState<any[]>([]);
  const [heatPoints, setHeatPoints] = useState<any[]>([]);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sosConfirm, setSosConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is needed for SafePath to work.");
        setLocation({ latitude: 28.6139, longitude: 77.2090 });
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLoading(false);
    })();
  }, []);

  const fetchData = useCallback(async () => {
    if (!location) return;
    try {
      const [incRes, safeRes, dangerRes, heatRes] = await Promise.all([
        getIncidents(location.latitude, location.longitude),
        getSafeZones(location.latitude, location.longitude),
        getDangerZones(location.latitude, location.longitude),
        getHeatmap(location.latitude, location.longitude),
      ]);
      setIncidents(incRes.data);
      setSafeZones(safeRes.data);
      setDangerZones(dangerRes.data);
      setHeatPoints(heatRes.data.points);
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  }, [location]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSOS = async () => {
    if (!sosConfirm) {
      setSosConfirm(true);
      setTimeout(() => setSosConfirm(false), 5000);
      return;
    }
    if (!location) return;
    try {
      const [sosRes, communityRes] = await Promise.allSettled([
        triggerSOS(location.latitude, location.longitude),
        triggerCommunitySOS(location.latitude, location.longitude),
      ]);
      const contacts = sosRes.status === "fulfilled" ? sosRes.value.data.contacts_notified?.length || 0 : 0;
      const helpers = communityRes.status === "fulfilled" ? communityRes.value.data.helpers_in_radius || 0 : 0;
      Alert.alert("SOS Sent", `${contacts} contacts notified. ${helpers} community helpers alerted nearby.`);
      setSosConfirm(false);
    } catch {
      Alert.alert("SOS Failed", "Please call 112 directly.");
    }
  };

  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation
        showsMyLocationButton
        customMapStyle={darkMapStyle}
      >
        {/* Incident Markers */}
        {incidents.map((inc) => (
          <Marker
            key={`inc-${inc.id}`}
            coordinate={{ latitude: inc.latitude, longitude: inc.longitude }}
            title={inc.title}
            description={`${inc.incident_type} - ${inc.severity}`}
            pinColor={markerColor[inc.severity] || "red"}
          />
        ))}

        {/* Safe Zone Markers */}
        {safeZones.map((sz) => (
          <Marker
            key={`safe-${sz.id}`}
            coordinate={{ latitude: sz.latitude, longitude: sz.longitude }}
            title={sz.name}
            description={`${sz.zone_type?.replace("_", " ")} ${sz.is_24_hours ? "- 24hrs" : ""}`}
            pinColor={safeZoneColor[sz.zone_type] || "green"}
          />
        ))}

        {/* Danger Zone Circles */}
        {dangerZones.map((dz) => (
          <Circle
            key={`danger-${dz.id}`}
            center={{ latitude: dz.latitude, longitude: dz.longitude }}
            radius={dz.radius_meters}
            fillColor={`${severityColor[dz.severity]}33`}
            strokeColor={severityColor[dz.severity]}
            strokeWidth={2}
          />
        ))}

        {/* Heatmap */}
        {showHeatMap && heatPoints.length > 0 && (
          <Heatmap
            points={heatPoints.map((p: any) => ({
              latitude: p.latitude,
              longitude: p.longitude,
              weight: p.weight,
            }))}
            radius={50}
            opacity={0.6}
            gradient={{
              colors: ["#00FF00", "#FFFF00", "#FFA500", "#FF0000"],
              startPoints: [0.1, 0.3, 0.6, 1.0],
              colorMapSize: 256,
            }}
          />
        )}
      </MapView>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SP</Text>
          </View>
          <View>
            <Text style={styles.appName}>SafePath</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.heatMapBtn, showHeatMap && styles.heatMapBtnActive]}
          onPress={() => setShowHeatMap(!showHeatMap)}
        >
          <Text style={[styles.heatMapBtnText, showHeatMap && styles.heatMapBtnTextActive]}>
            Heat Map {showHeatMap ? "ON" : "OFF"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#EF4444" }]}>{incidents.length}</Text>
          <Text style={styles.statLabel}>Incidents</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#FB923C" }]}>{dangerZones.length}</Text>
          <Text style={styles.statLabel}>Danger</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: "#10B981" }]}>{safeZones.length}</Text>
          <Text style={styles.statLabel}>Safe</Text>
        </View>
      </View>

      {/* SOS Button */}
      <TouchableOpacity
        style={[styles.sosButton, sosConfirm && styles.sosButtonConfirm]}
        onPress={handleSOS}
      >
        <Text style={styles.sosText}>{sosConfirm ? "TAP TO CONFIRM" : "SOS"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#0e1626" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#030712" },
  loadingText: { color: "#9CA3AF", marginTop: 12, fontSize: 14 },
  topBar: {
    position: "absolute", top: 50, left: 16, right: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  logoContainer: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(3,7,18,0.85)", borderRadius: 12, padding: 8 },
  logo: { width: 32, height: 32, backgroundColor: "#059669", borderRadius: 8, justifyContent: "center", alignItems: "center" },
  logoText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  appName: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  liveText: { color: "#10B981", fontSize: 9, fontWeight: "600" },
  heatMapBtn: { backgroundColor: "rgba(3,7,18,0.85)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#374151" },
  heatMapBtnActive: { borderColor: "#991B1B", backgroundColor: "rgba(127,29,29,0.5)" },
  heatMapBtnText: { color: "#9CA3AF", fontSize: 11 },
  heatMapBtnTextActive: { color: "#FCA5A5" },
  statsBar: {
    position: "absolute", bottom: 100, left: 16, right: 16,
    flexDirection: "row", backgroundColor: "rgba(3,7,18,0.9)", borderRadius: 16, padding: 12,
    justifyContent: "space-around",
  },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "bold" },
  statLabel: { fontSize: 10, color: "#9CA3AF", marginTop: 2 },
  sosButton: {
    position: "absolute", bottom: 30, alignSelf: "center",
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#7F1D1D", justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "#EF4444",
    shadowColor: "#EF4444", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10,
  },
  sosButtonConfirm: { backgroundColor: "#DC2626", transform: [{ scale: 1.1 }] },
  sosText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});

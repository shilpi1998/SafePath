import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, AppState,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  toggleCommunitySupport, updateCommunityLocation, getCommunityStatus,
  triggerCommunitySOS,
} from "../lib/api";

interface SOSAlert {
  victim_name: string;
  latitude: number;
  longitude: number;
  google_maps_link: string;
  message: string;
  timestamp: string;
}

export default function CommunityScreen() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nearbyHelpers, setNearbyHelpers] = useState(0);
  const [sosAlert, setSosAlert] = useState<SOSAlert | null>(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosResult, setSosResult] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getLocation();
    fetchStatus();
    return () => {
      disconnectWebSocket();
      stopLocationUpdates();
    };
  }, []);

  useEffect(() => {
    if (enabled && location) {
      connectWebSocket();
      startLocationUpdates();
    } else {
      disconnectWebSocket();
      stopLocationUpdates();
    }
  }, [enabled, location]);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } else {
      setLocation({ latitude: 28.6139, longitude: 77.2090 });
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await getCommunityStatus();
      setEnabled(res.data.community_support_enabled);
      setNearbyHelpers(res.data.nearby_helpers_total);
    } catch {}
  };

  const connectWebSocket = async () => {
    const userId = await AsyncStorage.getItem("safepath_user_id");
    if (!userId) return;

    const wsUrl = "ws://localhost:8000";
    const ws = new WebSocket(`${wsUrl}/api/community/ws/${userId}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "community_sos") {
          setSosAlert(data);
          Alert.alert(
            "SOS ALERT",
            `${data.victim_name} needs help nearby!`,
            [
              { text: "Dismiss", style: "cancel", onPress: () => setSosAlert(null) },
              { text: "View Location", onPress: () => Linking.openURL(data.google_maps_link) },
            ]
          );
        }
      } catch {}
    };

    ws.onclose = () => {
      setTimeout(() => {
        if (enabled) connectWebSocket();
      }, 3000);
    };

    wsRef.current = ws;
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const startLocationUpdates = () => {
    sendLocation();
    locationIntervalRef.current = setInterval(sendLocation, 30000);
  };

  const stopLocationUpdates = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const sendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        await updateCommunityLocation(loc.coords.latitude, loc.coords.longitude);
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch {}
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newState = !enabled;
      await toggleCommunitySupport(newState);
      setEnabled(newState);
      if (newState) {
        await sendLocation();
        fetchStatus();
      }
    } catch {
      Alert.alert("Error", "Please sign in to enable Community Support.");
    }
    setLoading(false);
  };

  const handleTriggerSOS = async () => {
    if (!location) return;
    setSosTriggered(true);
    setSosResult(null);
    try {
      const res = await triggerCommunitySOS(location.latitude, location.longitude);
      setSosResult(res.data.message);
      Alert.alert("SOS Sent", res.data.message);
    } catch {
      setSosResult("Failed to send community SOS.");
      Alert.alert("Error", "Failed to send SOS. Please try again.");
    }
    setTimeout(() => setSosTriggered(false), 5000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Community Support</Text>
      <Text style={styles.subtitle}>Help others & get help from nearby people</Text>

      {/* SOS Alert Banner */}
      {sosAlert && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertTitle}>COMMUNITY SOS ALERT</Text>
          <Text style={styles.alertMessage}>{sosAlert.message}</Text>
          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.alertBtn}
              onPress={() => Linking.openURL(sosAlert.google_maps_link)}
            >
              <Text style={styles.alertBtnText}>View Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.alertDismissBtn}
              onPress={() => setSosAlert(null)}
            >
              <Text style={styles.alertDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Toggle Card */}
      <View style={styles.toggleCard}>
        <View style={styles.toggleHeader}>
          <View style={[styles.iconCircle, enabled && styles.iconCircleActive]}>
            <Text style={styles.iconText}>P</Text>
          </View>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Be a Community Helper</Text>
            <Text style={styles.toggleSubtitle}>
              {enabled
                ? `${nearbyHelpers} helpers active in your area`
                : "Get alerts when someone nearby needs help"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleSwitch, enabled && styles.toggleSwitchActive]}
            onPress={handleToggle}
            disabled={loading}
          >
            <View style={[styles.toggleKnob, enabled && styles.toggleKnobActive]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status */}
      {enabled && (
        <>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Community Support Active</Text>
            </View>
            {location && (
              <Text style={styles.locationText}>
                Sharing location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
            )}
          </View>

          {/* How it works */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <Text style={styles.infoItem}>
              {"\u2022"} Your location is shared with the SafePath network
            </Text>
            <Text style={styles.infoItem}>
              {"\u2022"} When someone within 5km triggers SOS, you get a real-time alert
            </Text>
            <Text style={styles.infoItem}>
              {"\u2022"} You can rush to help or call emergency services for them
            </Text>
          </View>

          {/* Community SOS Button */}
          <TouchableOpacity
            style={[styles.sosButton, sosTriggered && styles.sosButtonTriggered]}
            onPress={handleTriggerSOS}
            disabled={sosTriggered}
          >
            <Text style={styles.sosButtonText}>
              {sosTriggered ? "SOS Sent to Nearby Helpers!" : "Alert Nearby Community Helpers"}
            </Text>
          </TouchableOpacity>

          {sosResult && (
            <Text style={styles.resultText}>{sosResult}</Text>
          )}
        </>
      )}

      {/* Info when disabled */}
      {!enabled && (
        <View style={styles.disabledInfo}>
          <Text style={styles.disabledTitle}>Join the Safety Network</Text>
          <Text style={styles.disabledText}>
            Enable Community Support to help people in distress nearby.
            When someone triggers an SOS within 5km of you, you'll receive
            an instant notification with their location.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: "#10B981" }]} />
              <Text style={styles.featureText}>Real-time SOS alerts from nearby users</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: "#3B82F6" }]} />
              <Text style={styles.featureText}>Location sharing for faster response</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={styles.featureText}>Direct Google Maps navigation to victim</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  subtitle: { color: "#6B7280", fontSize: 13, marginBottom: 20 },

  alertBanner: {
    backgroundColor: "rgba(220,38,38,0.15)", borderWidth: 2, borderColor: "#DC2626",
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  alertTitle: { color: "#FCA5A5", fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  alertMessage: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 12 },
  alertActions: { flexDirection: "row", gap: 10 },
  alertBtn: { flex: 1, backgroundColor: "#DC2626", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  alertBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  alertDismissBtn: { paddingHorizontal: 16, backgroundColor: "#1F2937", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  alertDismissText: { color: "#9CA3AF", fontSize: 13 },

  toggleCard: {
    backgroundColor: "#111827", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#1F2937", marginBottom: 12,
  },
  toggleHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#1F2937",
    justifyContent: "center", alignItems: "center",
  },
  iconCircleActive: { backgroundColor: "#064E3B" },
  iconText: { color: "#10B981", fontWeight: "bold", fontSize: 18 },
  toggleInfo: { flex: 1 },
  toggleTitle: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  toggleSubtitle: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  toggleSwitch: {
    width: 48, height: 26, borderRadius: 13, backgroundColor: "#374151",
    justifyContent: "center", paddingHorizontal: 3,
  },
  toggleSwitchActive: { backgroundColor: "#059669" },
  toggleKnob: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff",
  },
  toggleKnobActive: { alignSelf: "flex-end" },

  statusCard: {
    backgroundColor: "#064E3B", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#10B981", marginBottom: 12,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  statusText: { color: "#A7F3D0", fontSize: 13, fontWeight: "600" },
  locationText: { color: "#6EE7B7", fontSize: 10, marginTop: 6, marginLeft: 16 },

  infoCard: {
    backgroundColor: "#111827", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#1F2937", marginBottom: 16,
  },
  infoTitle: { color: "#9CA3AF", fontSize: 12, fontWeight: "600", marginBottom: 8 },
  infoItem: { color: "#D1D5DB", fontSize: 12, lineHeight: 20, marginBottom: 2 },

  sosButton: {
    backgroundColor: "#DC2626", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginBottom: 8,
  },
  sosButtonTriggered: { backgroundColor: "#991B1B", opacity: 0.7 },
  sosButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  resultText: { color: "#6B7280", fontSize: 11, textAlign: "center", marginTop: 4 },

  disabledInfo: {
    backgroundColor: "#111827", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#1F2937", marginTop: 8,
  },
  disabledTitle: { color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  disabledText: { color: "#9CA3AF", fontSize: 13, lineHeight: 20, marginBottom: 16 },
  featureList: { gap: 10 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureDot: { width: 8, height: 8, borderRadius: 4 },
  featureText: { color: "#D1D5DB", fontSize: 12 },
});

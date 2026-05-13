import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert,
} from "react-native";
import * as Location from "expo-location";
import { planRoute } from "../lib/api";

interface Destination {
  name: string;
  latitude: string;
  longitude: string;
}

const quickDests = [
  { name: "India Gate", latitude: "28.6129", longitude: "77.2295" },
  { name: "Connaught Place", latitude: "28.6315", longitude: "77.2167" },
  { name: "Lotus Temple", latitude: "28.5535", longitude: "77.2588" },
  { name: "Qutub Minar", latitude: "28.5245", longitude: "77.1855" },
  { name: "Red Fort", latitude: "28.6562", longitude: "77.2410" },
  { name: "Humayun's Tomb", latitude: "28.5933", longitude: "77.2507" },
];

const scoreColor = (level: string) => {
  switch (level) {
    case "safe": return "#10B981";
    case "moderate": return "#FBBF24";
    case "caution": return "#F97316";
    case "dangerous": return "#EF4444";
    default: return "#6B7280";
  }
};

export default function RouteScreen() {
  const [destinations, setDestinations] = useState<Destination[]>([{ name: "", latitude: "", longitude: "" }]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [preferSafety, setPreferSafety] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } else {
        setLocation({ latitude: 28.6139, longitude: 77.2090 });
      }
    })();
  }, []);

  const addDest = () => setDestinations([...destinations, { name: "", latitude: "", longitude: "" }]);

  const removeDest = (i: number) => setDestinations(destinations.filter((_, idx) => idx !== i));

  const updateDest = (i: number, field: keyof Destination, val: string) => {
    const updated = [...destinations];
    updated[i] = { ...updated[i], [field]: val };
    setDestinations(updated);
  };

  const addQuick = (d: typeof quickDests[0]) => {
    const emptyIdx = destinations.findIndex((dest) => !dest.name);
    if (emptyIdx >= 0) {
      const updated = [...destinations];
      updated[emptyIdx] = d;
      setDestinations(updated);
    } else {
      setDestinations([...destinations, d]);
    }
  };

  const handlePlan = async () => {
    if (!location) return;
    const valid = destinations.filter((d) => d.name && d.latitude && d.longitude);
    if (valid.length === 0) {
      Alert.alert("Error", "Add at least one destination");
      return;
    }
    setLoading(true);
    try {
      const res = await planRoute({
        destinations: valid.map((d) => ({
          name: d.name,
          latitude: parseFloat(d.latitude),
          longitude: parseFloat(d.longitude),
        })),
        start_latitude: location.latitude,
        start_longitude: location.longitude,
        prefer_safety: preferSafety,
      });
      setRoute(res.data);
    } catch (err) {
      Alert.alert("Error", "Failed to plan route. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Plan Your Safe Route</Text>

      {/* Quick Destinations */}
      <Text style={styles.sectionLabel}>Quick add:</Text>
      <View style={styles.quickContainer}>
        {quickDests.map((d) => (
          <TouchableOpacity key={d.name} style={styles.quickChip} onPress={() => addQuick(d)}>
            <Text style={styles.quickChipText}>{d.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Destinations */}
      {destinations.map((dest, i) => (
        <View key={i} style={styles.destCard}>
          <View style={styles.destHeader}>
            <View style={styles.destNumber}>
              <Text style={styles.destNumberText}>{i + 1}</Text>
            </View>
            {destinations.length > 1 && (
              <TouchableOpacity onPress={() => removeDest(i)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Location name"
            placeholderTextColor="#6B7280"
            value={dest.name}
            onChangeText={(v) => updateDest(i, "name", v)}
          />
          <View style={styles.coordRow}>
            <TextInput
              style={[styles.input, styles.coordInput]}
              placeholder="Latitude"
              placeholderTextColor="#6B7280"
              value={dest.latitude}
              onChangeText={(v) => updateDest(i, "latitude", v)}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.coordInput]}
              placeholder="Longitude"
              placeholderTextColor="#6B7280"
              value={dest.longitude}
              onChangeText={(v) => updateDest(i, "longitude", v)}
              keyboardType="numeric"
            />
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addDest}>
        <Text style={styles.addBtnText}>+ Add destination</Text>
      </TouchableOpacity>

      {/* Safety Toggle */}
      <TouchableOpacity style={styles.toggle} onPress={() => setPreferSafety(!preferSafety)}>
        <View style={[styles.toggleBox, preferSafety && styles.toggleBoxActive]} />
        <Text style={styles.toggleText}>Prioritize safety over shortest route</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.planBtn} onPress={handlePlan} disabled={loading}>
        <Text style={styles.planBtnText}>{loading ? "Planning..." : "Plan Safe Route"}</Text>
      </TouchableOpacity>

      {/* Route Result */}
      {route && (
        <View style={[styles.resultCard, { borderColor: scoreColor(route.overall_safety_score.level) }]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Route Safety</Text>
            <Text style={[styles.resultScore, { color: scoreColor(route.overall_safety_score.level) }]}>
              {route.overall_safety_score.score}
            </Text>
          </View>

          <View style={styles.resultBar}>
            <View
              style={[
                styles.resultBarFill,
                {
                  width: `${route.overall_safety_score.score}%`,
                  backgroundColor: scoreColor(route.overall_safety_score.level),
                },
              ]}
            />
          </View>

          <View style={styles.resultStats}>
            <Text style={styles.resultStat}>Distance: {route.total_distance_km} km</Text>
            <Text style={styles.resultStat}>Time: {route.estimated_time_minutes} min</Text>
          </View>

          <Text style={styles.itineraryTitle}>Optimized Itinerary:</Text>
          {route.ordered_destinations.map((dest: any, i: number) => (
            <View key={i} style={styles.itineraryItem}>
              <View style={styles.itineraryNumber}>
                <Text style={styles.itineraryNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.itineraryName}>{dest.name}</Text>
            </View>
          ))}

          {route.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              <Text style={styles.warningsTitle}>Warnings:</Text>
              {route.warnings.map((w: string, i: number) => (
                <Text key={i} style={styles.warningText}>{w}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  sectionLabel: { color: "#9CA3AF", fontSize: 12, marginBottom: 8 },
  quickContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  quickChip: { backgroundColor: "#1F2937", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#374151" },
  quickChipText: { color: "#D1D5DB", fontSize: 11 },
  destCard: { backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#1F2937" },
  destHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  destNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center" },
  destNumberText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  removeText: { color: "#EF4444", fontSize: 12 },
  input: { backgroundColor: "#1F2937", color: "#fff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, borderWidth: 1, borderColor: "#374151", marginBottom: 6 },
  coordRow: { flexDirection: "row", gap: 8 },
  coordInput: { flex: 1 },
  addBtn: { borderWidth: 1, borderColor: "#374151", borderStyle: "dashed", borderRadius: 12, padding: 12, alignItems: "center", marginBottom: 12 },
  addBtnText: { color: "#60A5FA", fontSize: 13 },
  toggle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  toggleBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#374151" },
  toggleBoxActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  toggleText: { color: "#D1D5DB", fontSize: 13 },
  planBtn: { backgroundColor: "#059669", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 16 },
  planBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  resultCard: { backgroundColor: "#111827", borderRadius: 16, padding: 16, borderWidth: 2 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resultTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  resultScore: { fontSize: 28, fontWeight: "bold" },
  resultBar: { height: 6, backgroundColor: "#374151", borderRadius: 3, marginBottom: 12 },
  resultBarFill: { height: 6, borderRadius: 3 },
  resultStats: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  resultStat: { color: "#9CA3AF", fontSize: 12 },
  itineraryTitle: { color: "#9CA3AF", fontSize: 12, fontWeight: "600", marginBottom: 8 },
  itineraryItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  itineraryNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center" },
  itineraryNumberText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  itineraryName: { color: "#fff", fontSize: 13 },
  warningsContainer: { marginTop: 12, padding: 10, backgroundColor: "rgba(127,29,29,0.3)", borderRadius: 8 },
  warningsTitle: { color: "#FCA5A5", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  warningText: { color: "#FECACA", fontSize: 11, marginBottom: 2 },
});

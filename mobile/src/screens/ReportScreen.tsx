import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert,
} from "react-native";
import * as Location from "expo-location";
import { reportIncident, reportIncidentAnonymous } from "../lib/api";

const incidentTypes = [
  { value: "accident", label: "Accident" },
  { value: "crime", label: "Crime" },
  { value: "hazard", label: "Hazard" },
  { value: "construction", label: "Construction" },
  { value: "poor_lighting", label: "Poor Lighting" },
  { value: "flood", label: "Flood" },
  { value: "other", label: "Other" },
];

const severities = [
  { value: "low", label: "Low", color: "#FBBF24" },
  { value: "medium", label: "Medium", color: "#F97316" },
  { value: "high", label: "High", color: "#EF4444" },
  { value: "critical", label: "Critical", color: "#991B1B" },
];

export default function ReportScreen() {
  const [type, setType] = useState("accident");
  const [severity, setSeverity] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } else {
        setLocation({ latitude: 37.7849, longitude: -122.4094 });
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !location) return;
    setLoading(true);
    try {
      const data = {
        incident_type: type,
        severity,
        title: title.trim(),
        description: description.trim() || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
      };
      if (anonymous) {
        await reportIncidentAnonymous(data);
      } else {
        await reportIncident(data);
      }
      Alert.alert("Success", "Incident reported! Thank you for keeping the community safe.");
      setTitle("");
      setDescription("");
    } catch {
      Alert.alert("Error", "Failed to report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Report an Incident</Text>
      <Text style={styles.subtitle}>Help keep your community safe</Text>

      <Text style={styles.label}>Incident Type</Text>
      <View style={styles.chipContainer}>
        {incidentTypes.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[styles.chip, type === t.value && styles.chipActive]}
            onPress={() => setType(t.value)}
          >
            <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Severity</Text>
      <View style={styles.severityRow}>
        {severities.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[
              styles.severityBtn,
              severity === s.value && { backgroundColor: s.color, borderColor: s.color },
            ]}
            onPress={() => setSeverity(s.value)}
          >
            <Text style={[styles.severityText, severity === s.value && styles.severityTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Brief description"
        placeholderTextColor="#6B7280"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Details (optional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Additional details..."
        placeholderTextColor="#6B7280"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      {location && (
        <Text style={styles.locationText}>
          Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      )}

      {/* Anonymous Toggle */}
      <TouchableOpacity style={styles.anonToggle} onPress={() => setAnonymous(!anonymous)}>
        <View style={[styles.anonBox, anonymous && styles.anonBoxActive]} />
        <Text style={styles.anonText}>Report anonymously (no sign-in required)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={loading || !title.trim()}
      >
        <Text style={styles.submitBtnText}>{loading ? "Submitting..." : "Submit Report"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  subtitle: { color: "#6B7280", fontSize: 13, marginBottom: 20 },
  label: { color: "#9CA3AF", fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { backgroundColor: "#1F2937", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#374151" },
  chipActive: { backgroundColor: "#1E3A5F", borderColor: "#2563EB" },
  chipText: { color: "#9CA3AF", fontSize: 12 },
  chipTextActive: { color: "#60A5FA" },
  severityRow: { flexDirection: "row", gap: 8 },
  severityBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#374151", alignItems: "center", backgroundColor: "#1F2937" },
  severityText: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  severityTextActive: { color: "#fff" },
  input: { backgroundColor: "#1F2937", color: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: "#374151" },
  textarea: { height: 100, textAlignVertical: "top" },
  locationText: { color: "#6B7280", fontSize: 11, marginTop: 12 },
  anonToggle: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  anonBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#374151" },
  anonBoxActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  anonText: { color: "#D1D5DB", fontSize: 13 },
  submitBtn: { backgroundColor: "#DC2626", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 20 },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});

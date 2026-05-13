import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert,
} from "react-native";
import * as Location from "expo-location";
import { getEmergencyContacts, addEmergencyContact, deleteEmergencyContact, triggerSOS, triggerCommunitySOS } from "../lib/api";

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  relationship_type?: string;
}

export default function EmergencyScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sosConfirm, setSosConfirm] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);

  useEffect(() => {
    fetchContacts();
    getLocation();
  }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } else {
      setLocation({ latitude: 28.6139, longitude: 77.2090 });
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await getEmergencyContacts();
      setContacts(res.data);
    } catch {}
  };

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Error", "Name and phone are required");
      return;
    }
    setLoading(true);
    try {
      await addEmergencyContact({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        relationship_type: relationship.trim() || undefined,
      });
      setName(""); setPhone(""); setEmail(""); setRelationship("");
      setShowForm(false);
      fetchContacts();
    } catch {
      Alert.alert("Error", "Failed to add contact. Please sign in first.");
    }
    setLoading(false);
  };

  const handleDelete = (id: number, contactName: string) => {
    Alert.alert("Delete Contact", `Remove ${contactName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try { await deleteEmergencyContact(id); fetchContacts(); } catch {}
        },
      },
    ]);
  };

  const handleSOS = async () => {
    if (!sosConfirm) {
      setSosConfirm(true);
      setTimeout(() => setSosConfirm(false), 5000);
      return;
    }
    if (!location) return;
    setLoading(true);
    try {
      const [sosRes, communityRes] = await Promise.allSettled([
        triggerSOS(location.latitude, location.longitude),
        triggerCommunitySOS(location.latitude, location.longitude),
      ]);
      setSosTriggered(true);
      const contactCount = sosRes.status === "fulfilled" ? sosRes.value.data.contacts_notified?.length || 0 : 0;
      const helpersCount = communityRes.status === "fulfilled" ? communityRes.value.data.helpers_in_radius || 0 : 0;
      Alert.alert(
        "SOS ACTIVATED",
        `${contactCount} contacts notified.\n${helpersCount} community helpers alerted nearby.\n\nIf in immediate danger, call 112.`
      );
      setSosConfirm(false);
      setTimeout(() => setSosTriggered(false), 15000);
    } catch {
      Alert.alert("SOS Failed", "Please call 112 directly.");
      setSosConfirm(false);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* SOS Button */}
      <TouchableOpacity
        style={[
          styles.sosButton,
          sosConfirm && styles.sosButtonConfirm,
          sosTriggered && styles.sosButtonTriggered,
        ]}
        onPress={handleSOS}
        disabled={loading || sosTriggered}
      >
        {sosTriggered ? (
          <>
            <Text style={styles.sosText}>SOS ACTIVATED</Text>
            <Text style={styles.sosSubtext}>Help is on the way</Text>
          </>
        ) : (
          <>
            <Text style={styles.sosText}>{sosConfirm ? "TAP AGAIN TO CONFIRM" : "SOS EMERGENCY"}</Text>
            <Text style={styles.sosSubtext}>
              {sosConfirm ? "This will alert contacts & nearby helpers" : "Alerts contacts + community helpers within 5km"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Contacts Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addButtonText}>{showForm ? "Cancel" : "+ Add"}</Text>
        </TouchableOpacity>
      </View>

      {/* Add Contact Form */}
      {showForm && (
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Name *"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone * (e.g. +91...)"
            placeholderTextColor="#6B7280"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Email (optional)"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Relationship (e.g. Mother, Friend)"
            placeholderTextColor="#6B7280"
            value={relationship}
            onChangeText={setRelationship}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? "Saving..." : "Save Contact"}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contact List */}
      {contacts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No emergency contacts yet</Text>
          <Text style={styles.emptySubtext}>Add contacts to receive SOS alerts</Text>
        </View>
      ) : (
        contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactAvatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.contactInfo}>
              <View style={styles.contactNameRow}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.relationship_type && (
                  <View style={styles.relationBadge}>
                    <Text style={styles.relationText}>{contact.relationship_type}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
              {contact.email && <Text style={styles.contactEmail}>{contact.email}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleDelete(contact.id, contact.name)}>
              <Text style={styles.deleteText}>X</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <Text style={styles.footerText}>
        Emergency number: 112 (India) | Women helpline: 1091
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  content: { padding: 16, paddingBottom: 40 },

  sosButton: {
    backgroundColor: "#7F1D1D", borderRadius: 20, paddingVertical: 24,
    alignItems: "center", marginBottom: 24, borderWidth: 2, borderColor: "#EF4444",
  },
  sosButtonConfirm: { backgroundColor: "#DC2626", transform: [{ scale: 1.02 }] },
  sosButtonTriggered: { backgroundColor: "#064E3B", borderColor: "#10B981" },
  sosText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  sosSubtext: { color: "#FCA5A5", fontSize: 11, marginTop: 4 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  addButton: { backgroundColor: "#064E3B", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#10B981" },
  addButtonText: { color: "#10B981", fontSize: 12, fontWeight: "bold" },

  formCard: {
    backgroundColor: "#111827", borderRadius: 14, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: "#1F2937", gap: 8,
  },
  input: {
    backgroundColor: "#1F2937", color: "#fff", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13,
    borderWidth: 1, borderColor: "#374151",
  },
  saveBtn: { backgroundColor: "#059669", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  emptyCard: {
    backgroundColor: "#111827", borderRadius: 14, padding: 30,
    alignItems: "center", borderWidth: 1, borderColor: "#1F2937",
  },
  emptyText: { color: "#9CA3AF", fontSize: 14 },
  emptySubtext: { color: "#4B5563", fontSize: 11, marginTop: 4 },

  contactCard: {
    backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 8,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "#1F2937",
  },
  contactAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center",
  },
  contactAvatarText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  contactInfo: { flex: 1 },
  contactNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  relationBadge: { backgroundColor: "#1F2937", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  relationText: { color: "#9CA3AF", fontSize: 9 },
  contactPhone: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  contactEmail: { color: "#4B5563", fontSize: 10, marginTop: 1 },
  deleteText: { color: "#EF4444", fontSize: 16, fontWeight: "bold", padding: 4 },

  footerText: { color: "#4B5563", fontSize: 10, textAlign: "center", marginTop: 20 },
});

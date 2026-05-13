import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("safepath_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = (data: { email: string; password: string; full_name: string; phone?: string }) =>
  api.post("/api/auth/register", data);

export const login = (data: { email: string; password: string }) =>
  api.post("/api/auth/login", data);

export const getIncidents = (lat: number, lng: number, radius_km = 5) =>
  api.get("/api/safety/incidents", { params: { lat, lng, radius_km } });

export const reportIncident = (data: {
  incident_type: string; severity: string; title: string;
  description?: string; latitude: number; longitude: number;
}) => api.post("/api/safety/incidents", data);

export const getSafeZones = (lat: number, lng: number, radius_km = 5) =>
  api.get("/api/safety/safe-zones", { params: { lat, lng, radius_km } });

export const getDangerZones = (lat: number, lng: number, radius_km = 5) =>
  api.get("/api/safety/danger-zones", { params: { lat, lng, radius_km } });

export const getHeatmap = (lat: number, lng: number, radius_km = 5) =>
  api.get("/api/safety/heatmap", { params: { lat, lng, radius_km } });

export const planRoute = (data: {
  destinations: { name: string; latitude: number; longitude: number }[];
  start_latitude: number; start_longitude: number; prefer_safety?: boolean;
}) => api.post("/api/routes/plan", data);

export const sendChatMessage = (data: { message: string; latitude?: number; longitude?: number }) =>
  api.post("/api/chat/message", data);

export const triggerSOS = (latitude: number, longitude: number) =>
  api.post("/api/emergency/sos", null, { params: { latitude, longitude } });

// Anonymous incidents
export const reportIncidentAnonymous = (data: {
  incident_type: string; severity: string; title: string;
  description?: string; latitude: number; longitude: number; address?: string;
}) => api.post("/api/safety/incidents/anonymous", data);

// Emergency Contacts
export const getEmergencyContacts = () => api.get("/api/emergency/contacts");

export const addEmergencyContact = (data: {
  name: string; phone: string; email?: string; relationship_type?: string;
}) => api.post("/api/emergency/contacts", data);

export const deleteEmergencyContact = (id: number) =>
  api.delete(`/api/emergency/contacts/${id}`);

// Community Support
export const toggleCommunitySupport = (enabled: boolean) =>
  api.post("/api/community/toggle-support", null, { params: { enabled } });

export const updateCommunityLocation = (latitude: number, longitude: number) =>
  api.post("/api/community/update-location", null, { params: { latitude, longitude } });

export const getCommunityStatus = () => api.get("/api/community/status");

export const triggerCommunitySOS = (latitude: number, longitude: number) =>
  api.post("/api/community/sos", null, { params: { latitude, longitude } });

export const getNearbyHelpers = (latitude: number, longitude: number) =>
  api.get("/api/community/nearby-helpers", { params: { latitude, longitude } });

export default api;

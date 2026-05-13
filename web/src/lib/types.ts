export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  community_support_enabled?: boolean;
}

export interface Incident {
  id: number;
  incident_type: string;
  severity: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  created_at: string;
  is_active: boolean;
  upvotes: number;
}

export interface SafeZone {
  id: number;
  name: string;
  zone_type?: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  is_24_hours: boolean;
}

export interface DangerZone {
  id: number;
  name: string;
  severity: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  reason?: string;
  time_based: boolean;
  dangerous_hours_start?: number;
  dangerous_hours_end?: number;
}

export interface HeatMapPoint {
  latitude: number;
  longitude: number;
  weight: number;
  zone_name?: string;
  risk_level?: string; // "low" | "medium" | "high"
}

export interface HeatMapResponse {
  points: HeatMapPoint[];
  generated_at: string;
  total_zones: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  live_crime_count: number;
}

export interface SafetyScore {
  score: number;
  level: string;
  factors: string[];
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  safety_score: SafetyScore;
}

export interface Destination {
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteResponse {
  ordered_destinations: Destination[];
  total_distance_km: number;
  estimated_time_minutes: number;
  overall_safety_score: SafetyScore;
  warnings: string[];
  route_points: RoutePoint[];
}

export interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  relationship_type?: string;
}

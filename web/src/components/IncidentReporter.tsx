"use client";
import { useState, useCallback } from "react";
import { reportIncident, reportIncidentAnonymous } from "@/lib/api";
import PlaceAutocomplete from "./PlaceAutocomplete";

interface IncidentReporterProps {
  latitude: number;
  longitude: number;
  onReported: () => void;
  onClose: () => void;
  dark?: boolean;
}

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
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function IncidentReporter({ latitude, longitude, onReported, onClose, dark }: IncidentReporterProps) {
  const [type, setType] = useState("accident");
  const [severity, setSeverity] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [incLat, setIncLat] = useState(latitude);
  const [incLng, setIncLng] = useState(longitude);
  const [locationName, setLocationName] = useState("");

  const handleLocationSelect = useCallback((name: string, lat: number, lng: number) => {
    setLocationName(name);
    setIncLat(lat);
    setIncLng(lng);
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIncLat(pos.coords.latitude);
        setIncLng(pos.coords.longitude);
        setLocationName("My Current Location");
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const payload = {
        incident_type: type,
        severity,
        title: title.trim(),
        description: description.trim() || undefined,
        latitude: incLat,
        longitude: incLng,
      };
      if (anonymous) {
        await reportIncidentAnonymous(payload);
      } else {
        await reportIncident(payload);
      }
      onReported();
    } catch (err) {
      console.error("Failed to report:", err);
    } finally {
      setLoading(false);
    }
  };

  const sevColors: Record<string, { light: string; lightActive: string; dark: string; darkActive: string }> = {
    low: { light: "bg-yellow-50 border-yellow-200 text-yellow-700", lightActive: "bg-yellow-100 border-yellow-400 text-yellow-800 font-bold", dark: "bg-white/5 border-white/10 text-gray-500", darkActive: "border-yellow-500/50 bg-yellow-500/20 text-white" },
    medium: { light: "bg-orange-50 border-orange-200 text-orange-700", lightActive: "bg-orange-100 border-orange-400 text-orange-800 font-bold", dark: "bg-white/5 border-white/10 text-gray-500", darkActive: "border-orange-500/50 bg-orange-500/20 text-white" },
    high: { light: "bg-red-50 border-red-200 text-red-700", lightActive: "bg-red-100 border-red-400 text-red-800 font-bold", dark: "bg-white/5 border-white/10 text-gray-500", darkActive: "border-red-500/50 bg-red-500/20 text-white" },
    critical: { light: "bg-red-50 border-red-300 text-red-800", lightActive: "bg-red-200 border-red-500 text-red-900 font-bold", dark: "bg-white/5 border-white/10 text-gray-500", darkActive: "border-red-800/50 bg-red-800/20 text-white" },
  };

  if (dark) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Incident Type</p>
          <div className="flex flex-wrap gap-1.5">
            {incidentTypes.map((t) => (
              <button key={t.value} onClick={() => setType(t.value)} className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${type === t.value ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}>{t.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Severity</p>
          <div className="grid grid-cols-4 gap-2">
            {severities.map((s) => (
              <button key={s.value} onClick={() => setSeverity(s.value)} className={`py-2 rounded-lg text-[11px] font-medium border transition-all ${severity === s.value ? sevColors[s.value].darkActive : sevColors[s.value].dark}`}>{s.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Title</p>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the incident" className="w-full bg-white/5 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:border-blue-500/50 focus:outline-none placeholder:text-gray-600" />
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Details (optional)</p>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details..." rows={3} className="w-full bg-white/5 text-white rounded-xl px-4 py-2.5 text-sm border border-white/10 focus:border-blue-500/50 focus:outline-none resize-none placeholder:text-gray-600" />
        </div>
        <div>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Location</p>
          <div className="flex gap-2">
            <PlaceAutocomplete
              value={locationName}
              onPlaceSelect={handleLocationSelect}
              placeholder="Search incident location..."
              dark
            />
            <button onClick={useCurrentLocation} type="button" className="shrink-0 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold hover:bg-blue-500/30 transition-all" title="Use my current location">
              GPS
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">{incLat.toFixed(4)}, {incLng.toFixed(4)}</p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer bg-white/5 rounded-xl border border-white/10 px-4 py-3" onClick={() => setAnonymous(!anonymous)}>
          <div className={`w-9 h-5 rounded-full transition-colors relative ${anonymous ? "bg-purple-600" : "bg-gray-600"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${anonymous ? "left-4.5" : "left-0.5"}`} /></div>
          <div>
            <span className="text-xs text-gray-300">Report anonymously</span>
            <p className="text-[10px] text-gray-600">Your identity will not be linked to this report</p>
          </div>
        </label>
        <button onClick={handleSubmit} disabled={loading || !title.trim()} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-30 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-red-500/20 disabled:shadow-none">{loading ? "Submitting..." : "Submit Report"}</button>
      </div>
    );
  }

  // Light mode
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-gray-700 font-bold uppercase tracking-wider mb-2">Incident Type</p>
        <div className="flex flex-wrap gap-2">
          {incidentTypes.map((t) => (
            <button key={t.value} onClick={() => setType(t.value)} className={`text-xs px-3 py-2 rounded-lg border font-medium transition-all ${type === t.value ? "bg-blue-100 border-blue-400 text-blue-800 font-bold" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"}`}>{t.label}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-700 font-bold uppercase tracking-wider mb-2">Severity</p>
        <div className="grid grid-cols-4 gap-2">
          {severities.map((s) => (
            <button key={s.value} onClick={() => setSeverity(s.value)} className={`py-2.5 rounded-lg text-xs border transition-all ${severity === s.value ? sevColors[s.value].lightActive : sevColors[s.value].light}`}>{s.label}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-700 font-bold uppercase tracking-wider mb-2">Title</p>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief description of the incident" className="w-full bg-gray-50 text-gray-800 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-700 font-bold uppercase tracking-wider mb-2">Details (optional)</p>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details..." rows={3} className="w-full bg-gray-50 text-gray-800 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:border-blue-400 focus:outline-none resize-none placeholder:text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-700 font-bold uppercase tracking-wider mb-2">Location</p>
        <div className="flex gap-2">
          <PlaceAutocomplete
            value={locationName}
            onPlaceSelect={handleLocationSelect}
            placeholder="Search incident location..."
          />
          <button onClick={useCurrentLocation} type="button" className="shrink-0 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-all" title="Use my current location">
            GPS
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-1">{incLat.toFixed(4)}, {incLng.toFixed(4)}</p>
      </div>
      <label className="flex items-center gap-3 cursor-pointer bg-purple-50 rounded-xl border border-purple-200 px-4 py-3" onClick={() => setAnonymous(!anonymous)}>
        <div className={`w-9 h-5 rounded-full transition-colors relative ${anonymous ? "bg-purple-500" : "bg-gray-300"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${anonymous ? "left-4.5" : "left-0.5"}`} /></div>
        <div>
          <span className="text-xs text-gray-900 font-semibold">Report anonymously</span>
          <p className="text-[10px] text-gray-600">Your identity will not be linked to this report</p>
        </div>
      </label>
      <button onClick={handleSubmit} disabled={loading || !title.trim()} className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 disabled:opacity-30 text-white rounded-xl py-3 text-sm font-bold transition-all shadow-md shadow-red-500/15 disabled:shadow-none">{loading ? "Submitting..." : "Submit Report"}</button>
    </div>
  );
}

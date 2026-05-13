"use client";
import { useState, useCallback } from "react";
import { planRoute } from "@/lib/api";
import { Destination, RouteResponse } from "@/lib/types";
import { PlusIcon, RouteIcon } from "./Icons";
import PlaceAutocomplete from "./PlaceAutocomplete";

interface RoutePlannerProps {
  userLocation: { lat: number; lng: number };
  onRouteCalculated: (route: RouteResponse) => void;
  dark?: boolean;
}

const quickDestinations = [
  { name: "India Gate", latitude: 28.6129, longitude: 77.2295 },
  { name: "Connaught Place", latitude: 28.6315, longitude: 77.2167 },
  { name: "Lotus Temple", latitude: 28.5535, longitude: 77.2588 },
  { name: "Qutub Minar", latitude: 28.5245, longitude: 77.1855 },
  { name: "Red Fort", latitude: 28.6562, longitude: 77.2410 },
  { name: "Humayun's Tomb", latitude: 28.5933, longitude: 77.2507 },
];

const scoreColor = (level: string) => {
  switch (level) {
    case "safe": return { text: "text-emerald-400", bar: "from-emerald-500 to-emerald-400" };
    case "moderate": return { text: "text-yellow-400", bar: "from-yellow-500 to-yellow-400" };
    case "caution": return { text: "text-orange-400", bar: "from-orange-500 to-orange-400" };
    case "dangerous": return { text: "text-red-400", bar: "from-red-500 to-red-400" };
    default: return { text: "text-gray-400", bar: "from-gray-500 to-gray-400" };
  }
};

const scoreColorLight = (level: string) => {
  switch (level) {
    case "safe": return { text: "text-emerald-600", bar: "from-emerald-500 to-emerald-400", bg: "bg-emerald-50 border-emerald-200" };
    case "moderate": return { text: "text-yellow-600", bar: "from-yellow-500 to-yellow-400", bg: "bg-yellow-50 border-yellow-200" };
    case "caution": return { text: "text-orange-600", bar: "from-orange-500 to-orange-400", bg: "bg-orange-50 border-orange-200" };
    case "dangerous": return { text: "text-red-600", bar: "from-red-500 to-red-400", bg: "bg-red-50 border-red-200" };
    default: return { text: "text-gray-600", bar: "from-gray-500 to-gray-400", bg: "bg-gray-50 border-gray-200" };
  }
};

export default function RoutePlanner({ userLocation, onRouteCalculated, dark }: RoutePlannerProps) {
  const [destinations, setDestinations] = useState<Destination[]>([
    { name: "", latitude: 0, longitude: 0 },
    { name: "", latitude: 0, longitude: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [preferSafety, setPreferSafety] = useState(true);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);

  const addDestination = () => {
    setDestinations([...destinations, { name: "", latitude: 0, longitude: 0 }]);
  };

  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  const handlePlaceSelect = useCallback((index: number, name: string, lat: number, lng: number) => {
    setDestinations((prev) => {
      const updated = [...prev];
      updated[index] = { name, latitude: lat, longitude: lng };
      return updated;
    });
  }, []);

  const addQuickDestination = (dest: Destination) => {
    const emptyIdx = destinations.findIndex((d) => !d.name);
    if (emptyIdx >= 0) {
      const updated = [...destinations];
      updated[emptyIdx] = dest;
      setDestinations(updated);
    } else {
      setDestinations([...destinations, dest]);
    }
  };

  const handlePlanRoute = async () => {
    const valid = destinations.filter((d) => d.name && d.latitude && d.longitude);
    if (valid.length === 0) return;
    setLoading(true);
    setRouteResult(null);
    try {
      // Use first destination as start, remaining as route destinations
      const [start, ...rest] = valid;
      const routeDestinations = rest.length > 0 ? rest : valid;
      const startLat = rest.length > 0 ? start.latitude : userLocation.lat;
      const startLng = rest.length > 0 ? start.longitude : userLocation.lng;

      const res = await planRoute({
        destinations: routeDestinations,
        start_latitude: startLat,
        start_longitude: startLng,
        prefer_safety: preferSafety,
      });
      setRouteResult(res.data);
      onRouteCalculated(res.data);
    } catch (err) {
      console.error("Route planning failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Dark mode (map overlay)
  if (dark) {
    return (
      <div className="space-y-4">
        {/* Route Result - show at top if available */}
        {routeResult && (
          <div className="bg-white/5 rounded-xl border border-emerald-500/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Safety Score</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Based on incidents & danger zones along route</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-extrabold ${scoreColor(routeResult.overall_safety_score.level).text}`}>
                  {routeResult.overall_safety_score.score}
                </span>
                <span className="text-[10px] text-gray-500">/100</span>
                <p className={`text-[10px] font-bold uppercase ${scoreColor(routeResult.overall_safety_score.level).text}`}>
                  {routeResult.overall_safety_score.level}
                </p>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className={`h-2 rounded-full bg-gradient-to-r ${scoreColor(routeResult.overall_safety_score.level).bar} transition-all duration-500`} style={{ width: `${routeResult.overall_safety_score.score}%` }} />
            </div>
            {/* Score Legend */}
            <div className="flex justify-between text-[9px] px-1">
              <span className="text-red-400">0 - Dangerous</span>
              <span className="text-orange-400">25 - Caution</span>
              <span className="text-yellow-400">50 - Moderate</span>
              <span className="text-emerald-400">75 - Safe</span>
            </div>
            {/* Factors affecting score */}
            {routeResult.overall_safety_score.factors.length > 0 && (
              <div className="bg-white/5 rounded-lg p-2.5 space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Factors Affecting Score</p>
                {routeResult.overall_safety_score.factors.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                    <p className="text-[11px] text-gray-300">{f}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500">Distance</p>
                <p className="text-sm text-white font-bold">{routeResult.total_distance_km} km</p>
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500">Est. Time</p>
                <p className="text-sm text-white font-bold">{routeResult.estimated_time_minutes} min</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Route Order</p>
              {routeResult.ordered_destinations.map((dest, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-[9px] text-white font-bold shrink-0">{i + 1}</span>
                  <span className="text-xs text-white">{dest.name}</span>
                </div>
              ))}
            </div>
            {routeResult.warnings.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 space-y-1">
                <p className="text-[10px] text-red-300 font-bold uppercase">Warnings</p>
                {routeResult.warnings.slice(0, 3).map((w, i) => (<p key={i} className="text-[11px] text-red-200/80">{w}</p>))}
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">Quick Add Destinations</p>
          <div className="flex flex-wrap gap-1.5">
            {quickDestinations.map((d) => (
              <button key={d.name} onClick={() => addQuickDestination(d)} className="text-[11px] bg-white/5 hover:bg-white/10 text-gray-300 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-emerald-500/30 transition-all">{d.name}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          {destinations.map((dest, i) => (
            <div key={i} className="bg-white/5 rounded-xl border border-white/10 p-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0">{i + 1}</span>
                <PlaceAutocomplete
                  value={dest.name}
                  onPlaceSelect={(name, lat, lng) => handlePlaceSelect(i, name, lat, lng)}
                  placeholder={i === 0 ? "Start location..." : "Destination..."}
                  dark
                />
                {destinations.length > 2 && (<button onClick={() => removeDestination(i)} className="text-red-400/60 hover:text-red-400 text-xs transition-colors">Remove</button>)}
              </div>
              {dest.latitude !== 0 && (
                <p className="text-[10px] text-gray-500 pl-8 mt-1">{dest.latitude.toFixed(4)}, {dest.longitude.toFixed(4)}</p>
              )}
            </div>
          ))}
        </div>
        <button onClick={addDestination} className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 py-2.5 border border-dashed border-white/10 hover:border-blue-500/30 rounded-xl transition-all"><PlusIcon size={14} />Add stop</button>
        <label className="flex items-center gap-3 cursor-pointer bg-white/5 rounded-xl border border-white/10 px-4 py-3">
          <div className={`w-9 h-5 rounded-full transition-colors relative ${preferSafety ? "bg-emerald-600" : "bg-gray-600"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${preferSafety ? "left-4.5" : "left-0.5"}`} /></div>
          <span className="text-xs text-gray-300">Prioritize safety over shortest route</span>
        </label>
        <button onClick={handlePlanRoute} disabled={loading || destinations.filter((d) => d.name && d.latitude).length < 2} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-30 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none flex items-center justify-center gap-2">
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Planning safest route...</>
          ) : (
            <><RouteIcon size={16} />Plan Safe Route</>
          )}
        </button>
      </div>
    );
  }

  // Light mode
  return (
    <div className="space-y-5">
      {/* Route Result */}
      {routeResult && (
        <div className={`rounded-xl border p-5 space-y-3 ${scoreColorLight(routeResult.overall_safety_score.level).bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Safety Score</h3>
              <p className="text-[10px] text-gray-600 mt-0.5">Based on incidents & danger zones along route</p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-extrabold ${scoreColorLight(routeResult.overall_safety_score.level).text}`}>
                {routeResult.overall_safety_score.score}
              </span>
              <span className="text-[10px] text-gray-600">/100</span>
              <p className={`text-[10px] font-bold uppercase ${scoreColorLight(routeResult.overall_safety_score.level).text}`}>
                {routeResult.overall_safety_score.level}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full bg-gradient-to-r ${scoreColorLight(routeResult.overall_safety_score.level).bar} transition-all duration-500`} style={{ width: `${routeResult.overall_safety_score.score}%` }} />
          </div>
          {/* Score Legend */}
          <div className="flex justify-between text-[9px] px-1">
            <span className="text-red-500">0 - Dangerous</span>
            <span className="text-orange-500">25 - Caution</span>
            <span className="text-yellow-600">50 - Moderate</span>
            <span className="text-emerald-600">75 - Safe</span>
          </div>
          {/* Factors affecting score */}
          {routeResult.overall_safety_score.factors.length > 0 && (
            <div className="bg-white/70 rounded-lg p-2.5 border border-gray-100 space-y-1">
              <p className="text-[10px] text-gray-700 font-bold uppercase tracking-wider">Factors Affecting Score</p>
              {routeResult.overall_safety_score.factors.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-orange-500 mt-0.5 shrink-0">•</span>
                  <p className="text-[11px] text-gray-700">{f}</p>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/70 rounded-lg px-3 py-2 border border-gray-100">
              <p className="text-[10px] text-gray-600 font-medium">Distance</p>
              <p className="text-sm text-gray-800 font-bold">{routeResult.total_distance_km} km</p>
            </div>
            <div className="bg-white/70 rounded-lg px-3 py-2 border border-gray-100">
              <p className="text-[10px] text-gray-600 font-medium">Est. Time</p>
              <p className="text-sm text-gray-800 font-bold">{routeResult.estimated_time_minutes} min</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-700 font-bold uppercase tracking-wider">Route Order</p>
            {routeResult.ordered_destinations.map((dest, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-[9px] text-white font-bold shrink-0">{i + 1}</span>
                <span className="text-xs text-gray-900 font-medium">{dest.name}</span>
              </div>
            ))}
          </div>
          {routeResult.warnings.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 space-y-1">
              <p className="text-[10px] text-red-500 font-bold uppercase">Warnings</p>
              {routeResult.warnings.slice(0, 3).map((w, i) => (<p key={i} className="text-[11px] text-red-600">{w}</p>))}
            </div>
          )}
        </div>
      )}

      <div>
        <p className="text-xs text-gray-700 font-bold uppercase tracking-wider mb-2">Quick Add Destinations</p>
        <div className="flex flex-wrap gap-2">
          {quickDestinations.map((d) => (
            <button key={d.name} onClick={() => addQuickDestination(d)} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-all">{d.name}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {destinations.map((dest, i) => (
          <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-[11px] text-white font-bold shrink-0 shadow-md">{i + 1}</span>
              <PlaceAutocomplete
                value={dest.name}
                onPlaceSelect={(name, lat, lng) => handlePlaceSelect(i, name, lat, lng)}
                placeholder={i === 0 ? "Start location..." : "Destination..."}
              />
              {destinations.length > 2 && (<button onClick={() => removeDestination(i)} className="text-red-400 hover:text-red-500 text-xs font-medium transition-colors">Remove</button>)}
            </div>
            {dest.latitude !== 0 && (
              <p className="text-[10px] text-gray-600 pl-9 mt-1">{dest.latitude.toFixed(4)}, {dest.longitude.toFixed(4)}</p>
            )}
          </div>
        ))}
      </div>
      <button onClick={addDestination} className="w-full flex items-center justify-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-bold py-3 border border-dashed border-gray-300 hover:border-blue-400 rounded-xl transition-all"><PlusIcon size={14} />Add stop</button>
      <label className="flex items-center gap-3 cursor-pointer bg-emerald-50 rounded-xl border border-emerald-200 px-4 py-3">
        <div className={`w-9 h-5 rounded-full transition-colors relative ${preferSafety ? "bg-emerald-500" : "bg-gray-300"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${preferSafety ? "left-4.5" : "left-0.5"}`} /></div>
        <span className="text-xs text-gray-900 font-medium">Prioritize safety over shortest route</span>
      </label>
      <button onClick={handlePlanRoute} disabled={loading || destinations.filter((d) => d.name && d.latitude).length < 2} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-30 text-white rounded-xl py-3 text-sm font-bold transition-all shadow-md shadow-emerald-500/20 disabled:shadow-none flex items-center justify-center gap-2">
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Planning safest route...</>
        ) : (
          <><RouteIcon size={16} />Plan Safe Route</>
        )}
      </button>
    </div>
  );
}

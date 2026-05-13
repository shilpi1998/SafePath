"use client";
import { RouteResponse } from "@/lib/types";

interface SafetyDashboardProps {
  route?: RouteResponse | null;
  incidentCount: number;
  dangerZoneCount: number;
  safeZoneCount: number;
  dark?: boolean;
}

const scoreColor = (level: string) => {
  switch (level) {
    case "safe": return { text: "text-emerald-600", bar: "from-emerald-500 to-emerald-400", bg: "bg-emerald-50", border: "border-emerald-200" };
    case "moderate": return { text: "text-yellow-600", bar: "from-yellow-500 to-yellow-400", bg: "bg-yellow-50", border: "border-yellow-200" };
    case "caution": return { text: "text-orange-600", bar: "from-orange-500 to-orange-400", bg: "bg-orange-50", border: "border-orange-200" };
    case "dangerous": return { text: "text-red-600", bar: "from-red-500 to-red-400", bg: "bg-red-50", border: "border-red-200" };
    default: return { text: "text-gray-600", bar: "from-gray-500 to-gray-400", bg: "bg-gray-50", border: "border-gray-200" };
  }
};

const scoreColorDark = (level: string) => {
  switch (level) {
    case "safe": return { text: "text-emerald-400", bar: "from-emerald-500 to-emerald-400", bg: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/30" };
    case "moderate": return { text: "text-yellow-400", bar: "from-yellow-500 to-yellow-400", bg: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/30" };
    case "caution": return { text: "text-orange-400", bar: "from-orange-500 to-orange-400", bg: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/30" };
    case "dangerous": return { text: "text-red-400", bar: "from-red-500 to-red-400", bg: "from-red-500/20 to-red-600/10", border: "border-red-500/30" };
    default: return { text: "text-gray-400", bar: "from-gray-500 to-gray-400", bg: "from-gray-500/20 to-gray-600/10", border: "border-gray-500/30" };
  }
};

export default function SafetyDashboard({ route, incidentCount, dangerZoneCount, safeZoneCount, dark }: SafetyDashboardProps) {
  if (dark) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 text-center">
            <p className="text-xl font-bold text-red-400">{incidentCount}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Incidents</p>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 text-center">
            <p className="text-xl font-bold text-orange-400">{dangerZoneCount}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Danger Zones</p>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{safeZoneCount}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Safe Zones</p>
          </div>
        </div>
        {route && (
          <div className={`rounded-2xl border bg-gradient-to-br ${scoreColorDark(route.overall_safety_score.level).bg} ${scoreColorDark(route.overall_safety_score.level).border} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Route Safety Score</h3>
              <span className={`text-3xl font-bold ${scoreColorDark(route.overall_safety_score.level).text}`}>{route.overall_safety_score.score}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-4">
              <div className={`h-2 rounded-full bg-gradient-to-r ${scoreColorDark(route.overall_safety_score.level).bar} transition-all duration-500`} style={{ width: `${route.overall_safety_score.score}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 rounded-lg px-3 py-2"><p className="text-[10px] text-gray-500">Distance</p><p className="text-sm text-white font-semibold">{route.total_distance_km} km</p></div>
              <div className="bg-white/5 rounded-lg px-3 py-2"><p className="text-[10px] text-gray-500">Est. Time</p><p className="text-sm text-white font-semibold">{route.estimated_time_minutes} min</p></div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Optimized Itinerary</p>
              {route.ordered_destinations.map((dest, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0">{i + 1}</span>
                  <span className="text-sm text-white">{dest.name}</span>
                </div>
              ))}
            </div>
            {route.warnings.length > 0 && (
              <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-1">
                <p className="text-[10px] text-red-300 font-semibold uppercase tracking-wider">Warnings</p>
                {route.warnings.map((w, i) => (<p key={i} className="text-xs text-red-200/80">{w}</p>))}
              </div>
            )}
          </div>
        )}
        {!route && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-center">
            <p className="text-gray-400 text-sm">No route planned yet</p>
            <p className="text-gray-600 text-xs mt-1">Use the Safe Route tab to plan your journey</p>
          </div>
        )}
      </div>
    );
  }

  // Light mode
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-red-500">{incidentCount}</p>
          <p className="text-xs text-gray-700 mt-1 font-semibold">Incidents</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-orange-500">{dangerZoneCount}</p>
          <p className="text-xs text-gray-700 mt-1 font-semibold">Danger Zones</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-500">{safeZoneCount}</p>
          <p className="text-xs text-gray-700 mt-1 font-semibold">Safe Zones</p>
        </div>
      </div>

      {route && (
        <div className={`rounded-2xl border ${scoreColor(route.overall_safety_score.level).border} ${scoreColor(route.overall_safety_score.level).bg} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Route Safety Score</h3>
            <span className={`text-3xl font-extrabold ${scoreColor(route.overall_safety_score.level).text}`}>{route.overall_safety_score.score}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className={`h-2.5 rounded-full bg-gradient-to-r ${scoreColor(route.overall_safety_score.level).bar} transition-all duration-500`} style={{ width: `${route.overall_safety_score.score}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/70 rounded-lg px-3 py-2 border border-gray-100"><p className="text-[10px] text-gray-600 font-medium">Distance</p><p className="text-sm text-gray-800 font-bold">{route.total_distance_km} km</p></div>
            <div className="bg-white/70 rounded-lg px-3 py-2 border border-gray-100"><p className="text-[10px] text-gray-600 font-medium">Est. Time</p><p className="text-sm text-gray-800 font-bold">{route.estimated_time_minutes} min</p></div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-gray-700 font-bold uppercase tracking-wider">Optimized Itinerary</p>
            {route.ordered_destinations.map((dest, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0 shadow-md">{i + 1}</span>
                <span className="text-sm text-gray-800 font-medium">{dest.name}</span>
              </div>
            ))}
          </div>
          {route.warnings.length > 0 && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Warnings</p>
              {route.warnings.map((w, i) => (<p key={i} className="text-xs text-red-600">{w}</p>))}
            </div>
          )}
        </div>
      )}

      {!route && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-700 text-sm font-medium">No route planned yet</p>
          <p className="text-gray-600 text-xs mt-1">Use the Safe Route tab to plan your journey</p>
        </div>
      )}
    </div>
  );
}

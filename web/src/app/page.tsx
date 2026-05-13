"use client";
import { useEffect, useState, useCallback } from "react";
import MapView from "@/components/MapView";
import ChatPanel from "@/components/ChatPanel";
import RoutePlanner from "@/components/RoutePlanner";
import IncidentReporter from "@/components/IncidentReporter";
import SafetyDashboard from "@/components/SafetyDashboard";
import SOSButton from "@/components/SOSButton";
import EmergencyContacts from "@/components/EmergencyContacts";
import AuthModal from "@/components/AuthModal";
import CommunitySupport from "@/components/CommunitySupport";
import { MapIcon, RouteIcon, ChatIcon, ShieldIcon, AlertIcon, HeatIcon, UserIcon, LogoutIcon, XIcon, UsersIcon } from "@/components/Icons";
import { getIncidents, getSafeZones, getDangerZones, getHeatmap } from "@/lib/api";
import { Incident, SafeZone, DangerZone, HeatMapPoint, RouteResponse, User } from "@/lib/types";
import { RefreshIcon } from "@/components/Icons";

type Panel = "none" | "dashboard" | "route" | "chat" | "emergency" | "report" | "community";

export default function Home() {
  const [center] = useState({ lat: 28.6139, lng: 77.2090 });
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [dangerZones, setDangerZones] = useState<DangerZone[]>([]);
  const [heatMapPoints, setHeatMapPoints] = useState<HeatMapPoint[]>([]);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [activePanel, setActivePanel] = useState<Panel>("none");
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [heatMapStats, setHeatMapStats] = useState({ total: 0, high: 0, medium: 0, low: 0, liveCount: 0 });
  const [heatMapLoading, setHeatMapLoading] = useState(false);
  const [heatMapFilter, setHeatMapFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("safepath_user");
    const savedToken = localStorage.getItem("safepath_token");
    if (savedUser && savedToken) setUser(JSON.parse(savedUser));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [incRes, safeRes, dangerRes, heatRes] = await Promise.all([
        getIncidents(center.lat, center.lng),
        getSafeZones(center.lat, center.lng),
        getDangerZones(center.lat, center.lng),
        getHeatmap(center.lat, center.lng),
      ]);
      setIncidents(incRes.data);
      setSafeZones(safeRes.data);
      setDangerZones(dangerRes.data);
      setHeatMapPoints(heatRes.data.points);
      setHeatMapStats({
        total: heatRes.data.total_zones || heatRes.data.points.length,
        high: heatRes.data.high_risk_count || 0,
        medium: heatRes.data.medium_risk_count || 0,
        low: heatRes.data.low_risk_count || 0,
        liveCount: heatRes.data.live_crime_count || 0,
      });
    } catch (err) {
      console.error("Failed to fetch safety data:", err);
    }
  }, [center]);

  const refreshHeatMap = async () => {
    setHeatMapLoading(true);
    try {
      const [heatRes] = await Promise.all([
        getHeatmap(center.lat, center.lng),
        new Promise((r) => setTimeout(r, 1500)), // minimum visible progress
      ]);
      setHeatMapPoints(heatRes.data.points);
      setHeatMapStats({
        total: heatRes.data.total_zones || heatRes.data.points.length,
        high: heatRes.data.high_risk_count || 0,
        medium: heatRes.data.medium_risk_count || 0,
        low: heatRes.data.low_risk_count || 0,
        liveCount: heatRes.data.live_crime_count || 0,
      });
    } catch (err) {
      console.error("Failed to refresh heatmap:", err);
    } finally {
      setHeatMapLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const togglePanel = (panel: Panel) => {
    if ((panel === "emergency" || panel === "community") && !user) {
      setShowAuth(true);
      return;
    }
    // Route planner always opens with map
    if (panel === "route") {
      setShowMap(true);
      setShowHeatMap(false);
      setActivePanel(activePanel === "route" ? "none" : "route");
      if (activePanel === "route") setRoute(null); // clear route when closing
      return;
    }
    // All other panels close the map
    setShowMap(false);
    setShowHeatMap(false);
    setRoute(null); // clear route when switching away
    setActivePanel(activePanel === panel ? "none" : panel);
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Don't open report if a panel is already active (e.g. Safe Route)
    if (activePanel !== "none") return;
    setReportLocation({ lat, lng });
    setActivePanel("report");
  };

  const handleLogout = () => {
    localStorage.removeItem("safepath_token");
    localStorage.removeItem("safepath_user");
    localStorage.removeItem("safepath_user_id");
    setUser(null);
  };

  const toggleHeatMap = () => {
    if (!showHeatMap) {
      setActivePanel("none");
      setShowHeatMap(true);
      setShowMap(true);
    } else {
      setShowHeatMap(false);
      setShowMap(false);
    }
  };

  const navItems = [
    { id: "dashboard" as Panel, label: "Dashboard", icon: <ShieldIcon size={20} /> },
    { id: "route" as Panel, label: "Safe Route", icon: <RouteIcon size={20} /> },
    { id: "community" as Panel, label: "Community", icon: <UsersIcon size={20} /> },
    { id: "chat" as Panel, label: "AI Assistant", icon: <ChatIcon size={20} /> },
    { id: "emergency" as Panel, label: "SOS & Contacts", icon: <AlertIcon size={20} /> },
  ];

  const mapVisible = showMap || showHeatMap;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 z-30 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <ShieldIcon size={22} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 leading-tight tracking-tight">SafePath</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] text-emerald-600 font-semibold tracking-wider">LIVE</span>
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => togglePanel(item.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activePanel === item.id
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-transparent"
              }`}
            >
              <span className={activePanel === item.id ? "text-emerald-600" : "text-gray-400"}>{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Heat Map Toggle */}
          <button
            onClick={toggleHeatMap}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              showHeatMap
                ? "bg-red-50 text-red-600 border border-red-200"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-transparent"
            }`}
          >
            <HeatIcon size={16} />
            <span className="hidden sm:inline">Heat Map</span>
          </button>

          {/* Report */}
          <button
            onClick={() => {
              setReportLocation(center);
              setShowMap(false);
              setShowHeatMap(false);
              setActivePanel("report");
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-all"
          >
            <AlertIcon size={16} />
            <span className="hidden sm:inline">Report</span>
          </button>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 font-medium hidden lg:inline">{user.full_name}</span>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-1.5 transition-colors">
                <LogoutIcon size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all"
            >
              <UserIcon size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {mapVisible ? (
          <>
            {/* Full Map View (dark) */}
            <MapView
              center={center}
              incidents={heatMapFilter === "all" ? incidents : []}
              safeZones={heatMapFilter === "all" || heatMapFilter === "low" ? safeZones : []}
              dangerZones={heatMapFilter === "all" ? dangerZones : []}
              heatMapPoints={heatMapPoints}
              heatMapFilter={heatMapFilter}
              routePoints={activePanel === "route" ? route?.route_points : undefined}
              routeDestinations={activePanel === "route" ? route?.ordered_destinations : undefined}
              showHeatMap={showHeatMap}
              onMapClick={handleMapClick}
            />

            {/* Stats Bar on map */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-white/10 px-6 py-3 flex items-center gap-6 shadow-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                  <span className="text-white font-bold text-sm">{incidents.length}</span>
                  <span className="text-gray-400 text-xs">Incidents</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50" />
                  <span className="text-white font-bold text-sm">{dangerZones.length}</span>
                  <span className="text-gray-400 text-xs">Danger Zones</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                  <span className="text-white font-bold text-sm">{safeZones.length}</span>
                  <span className="text-gray-400 text-xs">Safe Zones</span>
                </div>
              </div>
            </div>

            {/* Heat Map Controls - top left on map */}
            {showHeatMap && (
              <div className="absolute top-4 left-4 z-10 bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/15 p-5 shadow-2xl panel-enter w-[280px]">
                <p className="text-sm font-extrabold text-white uppercase tracking-wider mb-4">Heat Map - Delhi NCR</p>

                {/* Filter Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => setHeatMapFilter("all")}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${heatMapFilter === "all" ? "bg-white/15 border-white/30 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}
                  >
                    All Zones ({heatMapStats.total})
                  </button>
                  <button
                    onClick={() => setHeatMapFilter("high")}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${heatMapFilter === "high" ? "bg-red-500/25 border-red-500/50 text-red-300" : "bg-white/5 border-white/10 text-gray-400 hover:border-red-500/30"}`}
                  >
                    High Risk ({heatMapStats.high})
                  </button>
                  <button
                    onClick={() => setHeatMapFilter("medium")}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${heatMapFilter === "medium" ? "bg-orange-500/25 border-orange-500/50 text-orange-300" : "bg-white/5 border-white/10 text-gray-400 hover:border-orange-500/30"}`}
                  >
                    Medium Risk ({heatMapStats.medium})
                  </button>
                  <button
                    onClick={() => setHeatMapFilter("low")}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${heatMapFilter === "low" ? "bg-emerald-500/25 border-emerald-500/50 text-emerald-300" : "bg-white/5 border-white/10 text-gray-400 hover:border-emerald-500/30"}`}
                  >
                    Low Risk ({heatMapStats.low})
                  </button>
                </div>

                {/* Risk Breakdown Bar */}
                <div className="mb-4">
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-white/10">
                    {heatMapStats.total > 0 && (
                      <>
                        <div className="bg-red-500 transition-all duration-500" style={{ width: `${(heatMapStats.high / heatMapStats.total) * 100}%` }} />
                        <div className="bg-orange-500 transition-all duration-500" style={{ width: `${(heatMapStats.medium / heatMapStats.total) * 100}%` }} />
                        <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(heatMapStats.low / heatMapStats.total) * 100}%` }} />
                      </>
                    )}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-red-400 font-medium">{heatMapStats.total > 0 ? Math.round((heatMapStats.high / heatMapStats.total) * 100) : 0}% High</span>
                    <span className="text-[10px] text-orange-400 font-medium">{heatMapStats.total > 0 ? Math.round((heatMapStats.medium / heatMapStats.total) * 100) : 0}% Med</span>
                    <span className="text-[10px] text-emerald-400 font-medium">{heatMapStats.total > 0 ? Math.round((heatMapStats.low / heatMapStats.total) * 100) : 0}% Low</span>
                  </div>
                </div>

                {/* Refresh Button - big and prominent */}
                <button
                  onClick={refreshHeatMap}
                  disabled={heatMapLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
                >
                  <RefreshIcon size={16} className={heatMapLoading ? "animate-spin" : ""} />
                  {heatMapLoading ? "Fetching crime data..." : "Refresh Heat Map"}
                </button>

                {/* Progress bar when loading */}
                {heatMapLoading && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full animate-progress" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 text-center">Scanning Delhi NCR regions...</p>
                  </div>
                )}

                <div className="text-[10px] text-gray-500 mt-3 text-center space-y-0.5">
                  <p>Tracking <span className="text-white font-bold">{heatMapStats.total}</span> zones across Delhi NCR</p>
                  {heatMapStats.liveCount > 0 && (
                    <p><span className="text-emerald-400 font-bold">{heatMapStats.liveCount}</span> live crime reports from news</p>
                  )}
                </div>
              </div>
            )}

            {/* Legend on map */}
            <div className="absolute bottom-6 left-4 z-10 bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-3 shadow-xl">
              <p className="text-[10px] font-semibold text-gray-300 mb-2 uppercase tracking-wider">Legend</p>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-gray-400">High/Critical</span></div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /><span className="text-gray-400">Medium</span></div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><span className="text-gray-400">Low</span></div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-gray-400">Safe Zone</span></div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-gray-400">Police</span></div>
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 border-2 border-red-500/60 rounded-full" /><span className="text-gray-400">Danger Zone</span></div>
              </div>
            </div>

            {/* Overlay Panel on map (dark themed) */}
            {activePanel !== "none" && (
              <div className="absolute top-4 right-4 bottom-20 w-[400px] z-20 panel-enter">
                <div className="map-panel rounded-2xl border border-white/15 shadow-2xl h-full flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
                    <h2 className="text-base font-bold text-white">
                      {activePanel === "dashboard" && "Safety Dashboard"}
                      {activePanel === "route" && "Safe Route Planner"}
                      {activePanel === "community" && "Community Support"}
                      {activePanel === "chat" && "SafePath AI Assistant"}
                      {activePanel === "emergency" && "Emergency SOS"}
                      {activePanel === "report" && "Report Incident"}
                    </h2>
                    <button onClick={() => setActivePanel("none")} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
                      <XIcon size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {activePanel === "dashboard" && <SafetyDashboard route={route} incidentCount={incidents.length} dangerZoneCount={dangerZones.length} safeZoneCount={safeZones.length} dark />}
                    {activePanel === "route" && <RoutePlanner userLocation={center} onRouteCalculated={(r) => { setRoute(r); setActivePanel("route"); }} dark />}
                    {activePanel === "community" && <CommunitySupport dark userLocation={center} />}
                    {activePanel === "chat" && <div className="h-full -m-5"><ChatPanel latitude={center.lat} longitude={center.lng} dark /></div>}
                    {activePanel === "emergency" && <><EmergencyContacts dark /><SOSButton latitude={center.lat} longitude={center.lng} /></>}
                    {activePanel === "report" && reportLocation && <IncidentReporter latitude={reportLocation.lat} longitude={reportLocation.lng} onReported={() => { setActivePanel("none"); fetchData(); }} onClose={() => setActivePanel("none")} dark />}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Light Home View */
          <div className="h-full overflow-y-auto">
            {activePanel === "none" ? (
              /* Landing / Home */
              <div className="max-w-5xl mx-auto px-6 py-10 fade-in">
                {/* Hero */}
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
                    Your AI-Powered <span className="gradient-text">Safety Companion</span>
                  </h2>
                  <p className="text-gray-700 text-lg max-w-2xl mx-auto">
                    Navigate Delhi NCR safely with real-time incident data, smart route planning, and instant emergency alerts.
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-5 mb-10">
                  <div className="card p-6 text-center hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                      <AlertIcon size={24} />
                    </div>
                    <p className="text-3xl font-extrabold text-red-500">{incidents.length}</p>
                    <p className="text-sm text-gray-900 mt-1 font-semibold">Active Incidents</p>
                  </div>
                  <div className="card p-6 text-center hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                      <HeatIcon size={24} />
                    </div>
                    <p className="text-3xl font-extrabold text-orange-500">{dangerZones.length}</p>
                    <p className="text-sm text-gray-900 mt-1 font-semibold">Danger Zones</p>
                  </div>
                  <div className="card p-6 text-center hover:scale-[1.02] transition-transform">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                      <ShieldIcon size={24} />
                    </div>
                    <p className="text-3xl font-extrabold text-emerald-500">{safeZones.length}</p>
                    <p className="text-sm text-gray-900 mt-1 font-semibold">Safe Zones</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  <button onClick={() => togglePanel("route")} className="card p-5 text-left hover:scale-[1.01] transition-transform group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                      <RouteIcon size={20} />
                    </div>
                    <p className="font-bold text-gray-900 text-sm">Plan Safe Route</p>
                    <p className="text-xs text-gray-600 mt-1">AI-optimized safe routes</p>
                  </button>
                  <button onClick={() => togglePanel("chat")} className="card p-5 text-left hover:scale-[1.01] transition-transform group">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                      <ChatIcon size={20} />
                    </div>
                    <p className="font-bold text-gray-900 text-sm">AI Assistant</p>
                    <p className="text-xs text-gray-600 mt-1">Ask safety questions</p>
                  </button>
                  <button onClick={toggleHeatMap} className="card p-5 text-left hover:scale-[1.01] transition-transform group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                      <MapIcon size={20} />
                    </div>
                    <p className="font-bold text-gray-900 text-sm">Live Map</p>
                    <p className="text-xs text-gray-600 mt-1">View incidents & zones</p>
                  </button>
                  <button onClick={toggleHeatMap} className="card p-5 text-left hover:scale-[1.01] transition-transform group">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
                      <HeatIcon size={20} />
                    </div>
                    <p className="font-bold text-gray-900 text-sm">Heat Map</p>
                    <p className="text-xs text-gray-600 mt-1">View danger intensity</p>
                  </button>
                </div>

                {/* Bottom info */}
                <div className="card p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                      <ShieldIcon size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Stay Safe in Delhi NCR</h3>
                      <p className="text-sm text-gray-700 mt-1">
                        Real-time safety data from community reports. Plan routes, get alerts, and reach help instantly with SOS.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Light Panel View */
              <div className="max-w-2xl mx-auto px-6 py-8 fade-in">
                <div className="card overflow-hidden">
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">
                      {activePanel === "dashboard" && "Safety Dashboard"}
                      {activePanel === "route" && "Safe Route Planner"}
                      {activePanel === "community" && "Community Support"}
                      {activePanel === "chat" && "SafePath AI Assistant"}
                      {activePanel === "emergency" && "Emergency SOS"}
                      {activePanel === "report" && "Report Incident"}
                    </h2>
                    <button onClick={() => setActivePanel("none")} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                      <XIcon size={18} />
                    </button>
                  </div>

                  {/* Panel Body */}
                  <div className={`${activePanel === "chat" ? "" : "p-6"} ${activePanel === "chat" ? "h-[calc(100vh-220px)]" : ""}`}>
                    {activePanel === "dashboard" && <SafetyDashboard route={route} incidentCount={incidents.length} dangerZoneCount={dangerZones.length} safeZoneCount={safeZones.length} />}
                    {activePanel === "route" && <RoutePlanner userLocation={center} onRouteCalculated={(r) => { setRoute(r); setShowMap(true); }} />}
                    {activePanel === "community" && <CommunitySupport userLocation={center} />}
                    {activePanel === "chat" && <div className="h-full"><ChatPanel latitude={center.lat} longitude={center.lng} /></div>}
                    {activePanel === "emergency" && <div className="space-y-4"><EmergencyContacts /><SOSButton latitude={center.lat} longitude={center.lng} /></div>}
                    {activePanel === "report" && reportLocation && <IncidentReporter latitude={reportLocation.lat} longitude={reportLocation.lng} onReported={() => { setActivePanel("none"); fetchData(); }} onClose={() => setActivePanel("none")} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          onAuth={(u) => { setUser(u); setShowAuth(false); }}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}

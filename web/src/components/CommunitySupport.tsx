"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { toggleCommunitySupport, updateCommunityLocation, getCommunityStatus, triggerCommunitySOS } from "@/lib/api";
import { UsersIcon, BellIcon, ShieldIcon } from "./Icons";

interface CommunitySupportProps {
  dark?: boolean;
  userLocation: { lat: number; lng: number };
}

interface SOSAlert {
  victim_name: string;
  latitude: number;
  longitude: number;
  google_maps_link: string;
  message: string;
  timestamp: string;
}

export default function CommunitySupport({ dark, userLocation }: CommunitySupportProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nearbyHelpers, setNearbyHelpers] = useState(0);
  const [sosAlert, setSosAlert] = useState<SOSAlert | null>(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosResult, setSosResult] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch community status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  // Manage WebSocket and location updates when enabled
  useEffect(() => {
    if (enabled) {
      connectWebSocket();
      startLocationUpdates();
    } else {
      disconnectWebSocket();
      stopLocationUpdates();
    }
    return () => {
      disconnectWebSocket();
      stopLocationUpdates();
    };
  }, [enabled]);

  const fetchStatus = async () => {
    try {
      const res = await getCommunityStatus();
      setEnabled(res.data.community_support_enabled);
      setNearbyHelpers(res.data.nearby_helpers_total);
    } catch {}
  };

  const connectWebSocket = () => {
    const userId = localStorage.getItem("safepath_user_id");
    if (!userId) return;

    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
      .replace("http://", "ws://")
      .replace("https://", "wss://");

    const ws = new WebSocket(`${wsUrl}/api/community/ws/${userId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "community_sos") {
          setSosAlert(data);
          // Play alert sound
          if (typeof window !== "undefined") {
            const audio = new Audio("/alert.mp3");
            audio.play().catch(() => {});
          }
        }
      } catch {}
    };
    ws.onclose = () => {
      // Reconnect after 3 seconds
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
    // Update location immediately
    sendLocation();
    // Then every 30 seconds
    locationIntervalRef.current = setInterval(sendLocation, 30000);
  };

  const stopLocationUpdates = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const sendLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await updateCommunityLocation(pos.coords.latitude, pos.coords.longitude);
          } catch {}
        },
        () => {
          // Fallback to provided userLocation
          updateCommunityLocation(userLocation.lat, userLocation.lng).catch(() => {});
        }
      );
    } else {
      updateCommunityLocation(userLocation.lat, userLocation.lng).catch(() => {});
    }
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
    } catch {}
    setLoading(false);
  };

  const handleTriggerSOS = async () => {
    setSosTriggered(true);
    setSosResult(null);
    try {
      const res = await triggerCommunitySOS(userLocation.lat, userLocation.lng);
      setSosResult(res.data.message);
    } catch {
      setSosResult("Failed to send community SOS. Try again.");
    }
    setTimeout(() => setSosTriggered(false), 5000);
  };

  const dismissAlert = () => setSosAlert(null);

  if (dark) {
    return (
      <div className="space-y-3">
        {/* Incoming SOS Alert */}
        {sosAlert && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <BellIcon size={18} />
              <p className="text-red-300 font-bold text-sm">COMMUNITY SOS ALERT</p>
            </div>
            <p className="text-white text-sm font-medium">{sosAlert.message}</p>
            <div className="mt-3 flex gap-2">
              <a
                href={sosAlert.google_maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-center rounded-lg py-2 text-xs font-bold transition-all"
              >
                View Location
              </a>
              <button
                onClick={dismissAlert}
                className="px-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg py-2 text-xs font-medium transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Community Support</p>
          <div className="flex items-center gap-2">
            {enabled && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Toggle */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-gray-500"}`}>
              <UsersIcon size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white font-medium">Be a Community Helper</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {enabled ? `${nearbyHelpers} helpers in your area` : "Get alerts when someone nearby needs help"}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`w-12 h-6 rounded-full transition-all relative ${enabled ? "bg-emerald-500" : "bg-white/20"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${enabled ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Info when enabled */}
        {enabled && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldIcon size={14} />
              <p className="text-xs text-gray-400">How it works:</p>
            </div>
            <ul className="text-[11px] text-gray-500 space-y-1 pl-5 list-disc">
              <li>Your location is shared with the network (anonymized)</li>
              <li>When someone within 5km triggers SOS, you get an alert</li>
              <li>You can rush to help or call emergency services for them</li>
            </ul>
          </div>
        )}

        {/* Trigger Community SOS button */}
        {enabled && (
          <button
            onClick={handleTriggerSOS}
            disabled={sosTriggered}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <BellIcon size={16} />
            {sosTriggered ? "SOS Sent!" : "Alert Nearby Helpers (SOS)"}
          </button>
        )}
        {sosResult && (
          <p className="text-[11px] text-center text-gray-400">{sosResult}</p>
        )}
      </div>
    );
  }

  // Light mode
  return (
    <div className="space-y-4">
      {/* Incoming SOS Alert */}
      {sosAlert && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-red-600"><BellIcon size={18} /></div>
            <p className="text-red-700 font-bold text-sm">COMMUNITY SOS ALERT</p>
          </div>
          <p className="text-gray-800 text-sm font-medium">{sosAlert.message}</p>
          <div className="mt-3 flex gap-2">
            <a
              href={sosAlert.google_maps_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-center rounded-lg py-2.5 text-xs font-bold transition-all shadow-md"
            >
              View Location & Help
            </a>
            <button
              onClick={dismissAlert}
              className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg py-2.5 text-xs font-medium transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-700 font-bold uppercase tracking-wider">Community Support</p>
        {enabled && (
          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
            Active
          </span>
        )}
      </div>

      {/* Toggle */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm ${enabled ? "bg-emerald-100 text-emerald-600 border border-emerald-200" : "bg-gray-100 text-gray-400 border border-gray-200"}`}>
            <UsersIcon size={22} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-800 font-bold">Be a Community Helper</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {enabled ? `${nearbyHelpers} helpers active in your area` : "Get alerts when someone nearby needs help"}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`w-12 h-6 rounded-full transition-all relative ${enabled ? "bg-emerald-500" : "bg-gray-300"}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all ${enabled ? "left-6" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Info when enabled */}
      {enabled && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-blue-700">
            <ShieldIcon size={14} />
            <p className="text-xs font-bold">How it works:</p>
          </div>
          <ul className="text-xs text-gray-700 space-y-1.5 pl-5 list-disc">
            <li>Your location is shared with the SafePath network</li>
            <li>When someone within <strong>5km</strong> triggers SOS, you receive a real-time alert</li>
            <li>You can rush to help or call emergency services for them</li>
          </ul>
        </div>
      )}

      {/* Trigger Community SOS */}
      {enabled && (
        <button
          onClick={handleTriggerSOS}
          disabled={sosTriggered}
          className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 text-white rounded-xl py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
        >
          <BellIcon size={16} />
          {sosTriggered ? "SOS Sent to Nearby Helpers!" : "Alert Nearby Community Helpers"}
        </button>
      )}
      {sosResult && (
        <p className="text-xs text-center text-gray-600 font-medium">{sosResult}</p>
      )}
    </div>
  );
}

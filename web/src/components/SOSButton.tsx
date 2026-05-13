"use client";
import { useState } from "react";
import { triggerSOS, triggerCommunitySOS } from "@/lib/api";

interface SOSButtonProps {
  latitude: number;
  longitude: number;
}

export default function SOSButton({ latitude, longitude }: SOSButtonProps) {
  const [triggered, setTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmMode, setConfirmMode] = useState(false);
  const [contactCount, setContactCount] = useState(0);
  const [communityCount, setCommunityCount] = useState(0);
  const [error, setError] = useState("");

  const handleSOS = async () => {
    if (!confirmMode) {
      setConfirmMode(true);
      setTimeout(() => setConfirmMode(false), 5000);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [sosRes, communityRes] = await Promise.allSettled([
        triggerSOS(latitude, longitude),
        triggerCommunitySOS(latitude, longitude),
      ]);
      if (sosRes.status === "fulfilled") {
        setContactCount(sosRes.value.data.contacts_notified?.length || 0);
      }
      if (communityRes.status === "fulfilled") {
        setCommunityCount(communityRes.value.data.helpers_in_radius || 0);
      }
      setTriggered(true);
      setTimeout(() => {
        setTriggered(false);
        setConfirmMode(false);
      }, 15000);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "SOS failed. Call emergency services: 112";
      setError(detail);
      setConfirmMode(false);
    } finally {
      setLoading(false);
    }
  };

  if (triggered) {
    return (
      <div className="bg-gradient-to-br from-red-900 to-red-800 border-2 border-red-500/50 rounded-2xl p-5 text-center shadow-2xl shadow-red-500/20">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-500 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
          <span className="text-white text-2xl font-bold">!</span>
        </div>
        <p className="text-white font-bold text-lg">SOS ACTIVATED</p>
        <p className="text-red-200 text-sm mt-1">
          {contactCount} contact{contactCount !== 1 ? "s" : ""} notified with your location
        </p>
        {communityCount > 0 && (
          <p className="text-orange-200 text-sm mt-1">
            {communityCount} community helper{communityCount !== 1 ? "s" : ""} alerted nearby
          </p>
        )}
        <p className="text-red-300/60 text-xs mt-3">If in immediate danger, call 112</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-red-500/15 border border-red-500/25 rounded-xl px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
      <button
        onClick={handleSOS}
        disabled={loading}
        className={`w-full py-5 rounded-2xl font-bold text-lg transition-all ${
          confirmMode
            ? "bg-gradient-to-r from-red-600 to-red-500 text-white sos-ring border-2 border-red-400"
            : "bg-gradient-to-br from-red-900/80 to-red-800/50 hover:from-red-800 hover:to-red-700 text-red-300 border border-red-500/30"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending SOS...
          </span>
        ) : confirmMode ? (
          "TAP AGAIN TO CONFIRM SOS"
        ) : (
          "SOS Emergency"
        )}
      </button>
      <p className="text-[10px] text-gray-600 text-center">
        Sends SMS + Email to emergency contacts & alerts nearby community helpers
      </p>
    </div>
  );
}

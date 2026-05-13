"use client";
import { useState } from "react";
import { login, register } from "@/lib/api";
import { User } from "@/lib/types";
import { ShieldIcon, XIcon } from "./Icons";

interface AuthModalProps {
  onAuth: (user: User) => void;
  onClose: () => void;
}

export default function AuthModal({ onAuth, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = isLogin
        ? await login({ email, password })
        : await register({ email, password, full_name: fullName, phone: phone || undefined });

      localStorage.setItem("safepath_token", res.data.access_token);
      localStorage.setItem("safepath_user", JSON.stringify(res.data.user));
      localStorage.setItem("safepath_user_id", String(res.data.user.id));
      onAuth(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[420px] max-w-[90vw] shadow-2xl border border-gray-200 panel-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <ShieldIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">
                {isLogin ? "Welcome back" : "Join SafePath"}
              </h2>
              <p className="text-xs text-gray-400">
                {isLogin ? "Sign in to your account" : "Create your safety companion account"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all">
            <XIcon size={16} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {!isLogin && (
            <>
              <input
                type="text" placeholder="Full Name *" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-gray-50 text-gray-800 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-gray-400 transition-all"
              />
              <input
                type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50 text-gray-800 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-gray-400 transition-all"
              />
            </>
          )}
          <input
            type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-50 text-gray-800 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-gray-400 transition-all"
          />
          <input
            type="password" placeholder="Password *" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-gray-50 text-gray-800 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 placeholder:text-gray-400 transition-all"
          />

          <button
            onClick={handleSubmit} disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Please wait...
              </span>
            ) : isLogin ? "Sign In" : "Create Account"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="text-emerald-600 hover:text-emerald-500 font-bold transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

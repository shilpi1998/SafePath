import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login, register } from "../lib/api";

export default function ProfileScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const saved = await AsyncStorage.getItem("safepath_user");
    if (saved) setUser(JSON.parse(saved));
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Email and password are required");
      return;
    }
    if (!isLogin && !fullName.trim()) {
      Alert.alert("Error", "Full name is required");
      return;
    }
    setLoading(true);
    try {
      const res = isLogin
        ? await login({ email: email.trim(), password })
        : await register({ email: email.trim(), password, full_name: fullName.trim(), phone: phone.trim() || undefined });

      await AsyncStorage.setItem("safepath_token", res.data.access_token);
      await AsyncStorage.setItem("safepath_user", JSON.stringify(res.data.user));
      await AsyncStorage.setItem("safepath_user_id", String(res.data.user.id));
      setUser(res.data.user);
      Alert.alert("Success", `Welcome${isLogin ? " back" : ""}, ${res.data.user.full_name}!`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Authentication failed";
      Alert.alert("Error", msg);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["safepath_token", "safepath_user", "safepath_user_id"]);
    setUser(null);
    setEmail("");
    setPassword("");
  };

  if (user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.full_name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user.full_name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isLogin ? "Sign In" : "Create Account"}</Text>
      <Text style={styles.subtitle}>
        {isLogin ? "Sign in to access SOS, contacts & community features" : "Join SafePath safety network"}
      </Text>

      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#6B7280"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone (optional)"
            placeholderTextColor="#6B7280"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#6B7280"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#6B7280"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
        <Text style={styles.authBtnText}>{loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
        <Text style={styles.switchText}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 20 },
  subtitle: { color: "#6B7280", fontSize: 13, marginBottom: 24 },
  input: {
    backgroundColor: "#1F2937", color: "#fff", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    borderWidth: 1, borderColor: "#374151", marginBottom: 10,
  },
  authBtn: {
    backgroundColor: "#059669", borderRadius: 12, paddingVertical: 14,
    alignItems: "center", marginTop: 8,
  },
  authBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  switchBtn: { marginTop: 16, alignItems: "center" },
  switchText: { color: "#60A5FA", fontSize: 13 },

  profileCard: {
    backgroundColor: "#111827", borderRadius: 20, padding: 30,
    alignItems: "center", marginTop: 40, borderWidth: 1, borderColor: "#1F2937",
  },
  avatar: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: "#2563EB",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  userName: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  userEmail: { color: "#6B7280", fontSize: 13, marginTop: 4 },
  logoutBtn: {
    marginTop: 20, backgroundColor: "#7F1D1D", borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: "#EF4444",
  },
  logoutBtnText: { color: "#FCA5A5", fontWeight: "bold", fontSize: 13 },
});

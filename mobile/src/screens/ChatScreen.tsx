import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform,
} from "react-native";
import * as Location from "expo-location";
import { sendChatMessage } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  alerts?: string[];
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: "Hello! I'm SafePath AI, your travel safety companion. How can I help you stay safe today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    })();
  }, []);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: userMsg };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await sendChatMessage({
        message: userMsg,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.reply,
        alerts: res.data.safety_alerts,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Sorry, I couldn't connect. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
      <Text style={[styles.messageText, item.role === "user" ? styles.userText : styles.aiText]}>
        {item.content}
      </Text>
      {item.alerts && item.alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          {item.alerts.map((alert, i) => (
            <View key={i} style={styles.alertBadge}>
              <Text style={styles.alertText}>{alert}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.headerDot} />
        <Text style={styles.headerTitle}>SafePath AI</Text>
        <Text style={styles.headerSubtitle}>Always here to help</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {loading && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>SafePath AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about safety, routes..."
          placeholderTextColor="#6B7280"
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.sendButton} onPress={send} disabled={loading || !input.trim()}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  header: {
    paddingTop: 12, paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: "#1F2937", flexDirection: "row", alignItems: "center", gap: 8,
  },
  headerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  headerSubtitle: { color: "#6B7280", fontSize: 11, marginLeft: "auto" },
  messagesList: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#2563EB" },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "#1F2937" },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: "#fff" },
  aiText: { color: "#E5E7EB" },
  alertsContainer: { marginTop: 8, gap: 4 },
  alertBadge: { backgroundColor: "rgba(127,29,29,0.5)", borderWidth: 1, borderColor: "#991B1B", borderRadius: 8, padding: 6 },
  alertText: { color: "#FCA5A5", fontSize: 11 },
  typingIndicator: { paddingHorizontal: 16, paddingVertical: 8 },
  typingText: { color: "#6B7280", fontSize: 12, fontStyle: "italic" },
  inputContainer: {
    flexDirection: "row", padding: 12, gap: 8,
    borderTopWidth: 1, borderTopColor: "#1F2937", backgroundColor: "#030712",
  },
  input: {
    flex: 1, backgroundColor: "#1F2937", color: "#fff", borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    borderWidth: 1, borderColor: "#374151",
  },
  sendButton: {
    backgroundColor: "#2563EB", borderRadius: 24, paddingHorizontal: 20,
    justifyContent: "center", alignItems: "center",
  },
  sendButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});

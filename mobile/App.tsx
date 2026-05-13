import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import MapScreen from "./src/screens/MapScreen";
import ChatScreen from "./src/screens/ChatScreen";
import RouteScreen from "./src/screens/RouteScreen";
import ReportScreen from "./src/screens/ReportScreen";
import CommunityScreen from "./src/screens/CommunityScreen";
import EmergencyScreen from "./src/screens/EmergencyScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Map: "M",
    Route: "R",
    Community: "P",
    Emergency: "!",
    Chat: "A",
    Report: "R",
    Profile: "U",
  };
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabIconText, focused && styles.tabIconTextActive]}>
        {icons[label] || label[0]}
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: "#111827" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          tabBarStyle: {
            backgroundColor: "#111827",
            borderTopColor: "#1F2937",
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 25,
            paddingTop: 8,
          },
          tabBarActiveTintColor: "#10B981",
          tabBarInactiveTintColor: "#6B7280",
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Route"
          component={RouteScreen}
          options={{ headerTitle: "Safe Route Planner" }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityScreen}
          options={{ headerTitle: "Community Support" }}
        />
        <Tab.Screen
          name="Emergency"
          component={EmergencyScreen}
          options={{ headerTitle: "SOS & Contacts" }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerTitle: "SafePath AI" }}
        />
        <Tab.Screen
          name="Report"
          component={ReportScreen}
          options={{ headerTitle: "Report Incident" }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerTitle: "Profile" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1F2937",
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconActive: {
    backgroundColor: "#064E3B",
  },
  tabIconText: {
    color: "#6B7280",
    fontWeight: "bold",
    fontSize: 12,
  },
  tabIconTextActive: {
    color: "#10B981",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/context";

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarButtonTestID: "tab-dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "grid" : "grid-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Stock",
          tabBarButtonTestID: "tab-browse",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "cube" : "cube-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarButtonTestID: "tab-history",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "time" : "time-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarButtonTestID: "tab-settings",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "settings" : "settings-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: any; color: string }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

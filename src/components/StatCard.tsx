import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/theme/context";

interface Props {
  label: string;
  value: string | number;
  icon: any;
  gradient?: [string, string];
  onPress?: () => void;
  testID?: string;
  small?: boolean;
}

export function StatCard({ label, value, icon, gradient, onPress, testID, small }: Props) {
  const { colors } = useTheme();
  const g: [string, string] = gradient || [colors.gradientFrom, colors.gradientTo];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        { minHeight: small ? 96 : 116 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      testID={testID}
      disabled={!onPress}
    >
      <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.iconBubble}>
          <Ionicons name={icon} size={small ? 16 : 20} color="#fff" />
        </View>
        <Text style={[styles.value, { fontSize: small ? 24 : 30 }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  card: {
    padding: 16,
    borderRadius: 22,
    flex: 1,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  value: { color: "#fff", fontWeight: "800", marginTop: 8, letterSpacing: -0.5 },
  label: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});

import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { useTheme } from "@/src/theme/context";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "success" | "danger" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  size?: "sm" | "md" | "lg";
}

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
  testID,
  size = "md",
}: Props) {
  const { colors } = useTheme();
  const heights = { sm: 44, md: 52, lg: 60 };
  const h = heights[size];
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  const gradient =
    variant === "success"
      ? ["#10B981", "#059669"]
      : variant === "danger"
      ? ["#EF4444", "#DC2626"]
      : [colors.gradientFrom, colors.gradientTo];

  const disabledStyle = disabled || loading ? { opacity: 0.5 } : {};

  if (isOutline || isGhost) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        testID={testID}
        style={({ pressed }) => [
          styles.btn,
          {
            height: h,
            borderWidth: isOutline ? 1.5 : 0,
            borderColor: colors.borderStrong,
            backgroundColor: isGhost ? "transparent" : colors.surface,
          },
          pressed && { transform: [{ scale: 0.97 }] },
          disabledStyle,
          style,
        ]}
      >
        {icon}
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={[styles.label, { color: colors.text, fontSize: size === "lg" ? 18 : 16 }]}>
            {label}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        { borderRadius: 18 },
        pressed && { transform: [{ scale: 0.97 }] },
        disabledStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.btn, { height: h }]}
      >
        {icon}
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.label, { color: "#fff", fontSize: size === "lg" ? 18 : 16 }]}>
            {label}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
  },
  label: { fontWeight: "700", letterSpacing: 0.2 },
});

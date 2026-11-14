import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/theme/context";

export function EmptyState({
  icon = "cube-outline",
  title,
  subtitle,
  action,
}: {
  icon?: any;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap} testID="empty-state">
      <View style={[styles.iconWrap, { backgroundColor: colors.chipBg }]}>
        <Ionicons name={icon} size={40} color={colors.textMuted} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sub, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
      {action ? <View style={{ marginTop: 20, width: "80%" }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", padding: 32, paddingTop: 64 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  sub: { fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 22 },
});

import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { isPinSet } from "@/src/store/db";
import { useTheme } from "@/src/theme/context";

export default function IndexRoute() {
  const router = useRouter();
  const { colors, ready } = useTheme();

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const has = await isPinSet();
      // Small delay for splash-like transition
      setTimeout(() => {
        if (has) {
          router.replace({ pathname: "/pin", params: { mode: "verify" } });
        } else {
          router.replace({ pathname: "/pin", params: { mode: "setup" } });
        }
      }, 200);
    })();
  }, [ready, router]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]} testID="splash">
      <Text style={[styles.brand, { color: colors.primary }]}>SVT</Text>
      <Text style={[styles.title, { color: colors.text }]}>SRI VENKATESWARA TRADERS</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>Stock Management</Text>
      <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  brand: { fontSize: 56, fontWeight: "900", letterSpacing: -2 },
  title: { fontSize: 16, fontWeight: "700", marginTop: 8, textAlign: "center" },
  sub: { fontSize: 13, marginTop: 4 },
});

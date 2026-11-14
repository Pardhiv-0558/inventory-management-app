import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/context";

interface Props {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
  bg?: string;
  gradient?: boolean;
  headerRight?: React.ReactNode;
  contentStyle?: ViewStyle;
  testID?: string;
}

export function Screen({
  title,
  subtitle,
  showBack,
  onBack,
  children,
  bg,
  contentStyle,
  headerRight,
  testID,
}: Props) {
  const { colors, mode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: bg || colors.bg }} testID={testID}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <SafeAreaView edges={["top"]} style={{ backgroundColor: bg || colors.bg }}>
        {(title || showBack) && (
          <View
            style={[
              styles.header,
              {
                paddingTop: Platform.OS === "android" ? 8 : 4,
              },
            ]}
          >
            {showBack ? (
              <Pressable
                onPress={onBack || (() => router.back())}
                style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                testID="header-back"
              >
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              {title ? (
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <View>{headerRight}</View>
          </View>
        )}
      </SafeAreaView>
      <View style={[{ flex: 1, paddingBottom: insets.bottom }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    minHeight: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
});

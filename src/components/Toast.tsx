import { Ionicons } from "@expo/vector-icons";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/theme/context";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastCtx {
  show: (msg: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  const [type, setType] = useState<ToastType>("info");
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(-20)).current;
  const timer = useRef<any>(null);
  const { colors } = useTheme();

  const show = useCallback((m: string, t: ToastType = "info") => {
    setMsg(m);
    setType(t);
    if (timer.current) clearTimeout(timer.current);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translate, { toValue: 0, useNativeDriver: true }),
    ]).start();
    timer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translate, { toValue: -20, duration: 220, useNativeDriver: true }),
      ]).start();
    }, 2400);
  }, [opacity, translate]);

  const bg =
    type === "success" ? colors.success : type === "error" ? colors.danger : type === "warning" ? colors.warning : colors.info;
  const icon =
    type === "success"
      ? "checkmark-circle"
      : type === "error"
      ? "close-circle"
      : type === "warning"
      ? "warning"
      : "information-circle";

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.wrap,
          { opacity, transform: [{ translateY: translate }] },
        ]}
      >
        <View style={[styles.toast, { backgroundColor: bg }]} testID="toast">
          <Ionicons name={icon as any} size={22} color="#fff" />
          <Text style={styles.text} numberOfLines={2}>
            {msg}
          </Text>
        </View>
      </Animated.View>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used within ToastProvider");
  return c;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: "70%",
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },
});

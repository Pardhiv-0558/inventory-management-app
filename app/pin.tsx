import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Numpad } from "@/src/components/Numpad";
import { useToast } from "@/src/components/Toast";
import { clearPin, isPinSet, setPin as savePin, verifyPin } from "@/src/store/db";
import { useTheme } from "@/src/theme/context";

type Mode = "setup" | "verify" | "change";

export default function PinScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ mode?: string }>();
  const initialMode = (params.mode as Mode) || "verify";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<"enter" | "confirm" | "old">(
    initialMode === "setup" ? "enter" : initialMode === "change" ? "old" : "enter"
  );
  const [pin, setPinInput] = useState("");
  const [firstPin, setFirstPin] = useState("");

  useEffect(() => {
    // If entering with setup mode but pin already exists, force verify
    (async () => {
      if (initialMode === "setup") {
        const has = await isPinSet();
        if (has) setMode("verify");
      }
    })();
  }, [initialMode]);

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleSubmit = async () => {
    const entered = pin;
    if (mode === "verify") {
      const ok = await verifyPin(entered);
      if (ok) {
        toast.show("Welcome back!", "success");
        router.replace("/(tabs)");
      } else {
        toast.show("Wrong PIN. Try again.", "error");
        setPinInput("");
      }
      return;
    }
    if (mode === "change" && step === "old") {
      const ok = await verifyPin(entered);
      if (ok) {
        setPinInput("");
        setStep("enter");
      } else {
        toast.show("Wrong current PIN", "error");
        setPinInput("");
      }
      return;
    }
    // setup or change (new pin)
    if (step === "enter") {
      setFirstPin(entered);
      setPinInput("");
      setStep("confirm");
      return;
    }
    if (step === "confirm") {
      if (firstPin === entered) {
        await savePin(entered);
        toast.show(mode === "change" ? "PIN changed successfully" : "PIN set successfully", "success");
        router.replace("/(tabs)");
      } else {
        toast.show("PINs did not match, start again", "error");
        setPinInput("");
        setFirstPin("");
        setStep("enter");
      }
    }
  };

  const heading =
    mode === "verify"
      ? "Welcome Back"
      : mode === "change" && step === "old"
      ? "Change PIN"
      : step === "confirm"
      ? "Confirm PIN"
      : "Create PIN";

  const subtitle =
    mode === "verify"
      ? "Enter your 4-digit PIN to unlock"
      : mode === "change" && step === "old"
      ? "Enter your current PIN"
      : step === "confirm"
      ? "Re-enter to confirm"
      : "Set a 4-digit PIN to protect your stock";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="pin-screen">
      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientTo]}
        style={styles.top}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Ionicons name="cube" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.brand}>SVT</Text>
              <Text style={styles.brandSub}>Sri Venkateswara Traders</Text>
            </View>
          </View>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.subheading}>{subtitle}</Text>

          <View style={styles.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i < pin.length ? "#fff" : "rgba(255,255,255,0.25)",
                    borderColor: "rgba(255,255,255,0.5)",
                  },
                ]}
                testID={`pin-dot-${i}`}
              />
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView edges={["bottom"]} style={{ flex: 1, padding: 20 }}>
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Numpad value={pin} onChange={setPinInput} maxLength={4} />
          {mode === "verify" && (
            <Pressable
              onPress={async () => {
                await clearPin();
                toast.show("PIN removed. Setup a new one.", "info");
                setMode("setup");
                setStep("enter");
                setPinInput("");
              }}
              style={{ alignSelf: "center", padding: 12, marginTop: 12 }}
              testID="forgot-pin"
            >
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                Forgot PIN? Reset device PIN
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 24, paddingBottom: 40 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#fff", fontWeight: "900", fontSize: 22, letterSpacing: 1 },
  brandSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
  heading: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 40,
    letterSpacing: -0.5,
  },
  subheading: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 6 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginTop: 32,
  },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
});

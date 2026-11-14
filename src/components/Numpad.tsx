import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/src/theme/context";

interface Props {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  allowDecimal?: boolean;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

export function Numpad({ value, onChange, maxLength = 6, allowDecimal = false }: Props) {
  const { colors } = useTheme();

  const press = (k: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    if (k === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (k === "clear") {
      onChange("");
      return;
    }
    if (value.length >= maxLength) return;
    if (k === "." && (!allowDecimal || value.includes("."))) return;
    onChange(value + k);
  };

  const Row = ({ children }: any) => <View style={styles.row}>{children}</View>;

  const Btn = ({ label, onPress, testID, tint }: any) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { transform: [{ scale: 0.96 }], backgroundColor: colors.chipBg },
      ]}
      testID={testID}
    >
      {typeof label === "string" ? (
        <Text style={[styles.keyText, { color: tint || colors.text }]}>{label}</Text>
      ) : (
        label
      )}
    </Pressable>
  );

  return (
    <View style={styles.pad} testID="numpad">
      {KEYS.map((row, i) => (
        <Row key={i}>
          {row.map((k) => (
            <Btn key={k} label={k} onPress={() => press(k)} testID={`numpad-${k}`} />
          ))}
        </Row>
      ))}
      <Row>
        <Btn
          label={allowDecimal ? "." : ""}
          onPress={() => allowDecimal && press(".")}
          testID="numpad-dot"
        />
        <Btn label="0" onPress={() => press("0")} testID="numpad-0" />
        <Btn
          label={<Ionicons name="backspace-outline" size={26} color={colors.danger} />}
          onPress={() => press("back")}
          testID="numpad-back"
        />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  key: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontSize: 26, fontWeight: "700" },
});

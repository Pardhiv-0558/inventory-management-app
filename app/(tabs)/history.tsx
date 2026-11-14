import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState";
import { getCompanies, getHistory, getProducts } from "@/src/store/db";
import { Company, Product, StockHistoryEntry } from "@/src/store/types";
import { useTheme } from "@/src/theme/context";

type F = "all" | "add" | "reduce";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filter, setFilter] = useState<F>("all");

  const load = useCallback(async () => {
    const [h, p, c] = await Promise.all([getHistory(), getProducts(), getCompanies()]);
    setHistory(h);
    setProducts(p);
    setCompanies(c);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const prodMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const compMap = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies]);

  const list = useMemo(() => {
    return history.filter((h) => (filter === "all" ? true : h.type === filter));
  }, [history, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="history-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <Text style={[styles.title, { color: colors.text }]}>Stock History</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {history.length} total movements
          </Text>
        </View>
        <FlatList
          data={
            [
              { k: "all", l: "All" },
              { k: "add", l: "Added" },
              { k: "reduce", l: "Reduced" },
            ] as { k: F; l: string }[]
          }
          keyExtractor={(i) => i.k}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const active = filter === item.k;
            return (
              <Pressable
                onPress={() => setFilter(item.k)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.chipActiveBg : colors.chipBg,
                    borderColor: active ? colors.chipActiveBg : colors.border,
                  },
                ]}
                testID={`history-filter-${item.k}`}
              >
                <Text
                  style={{
                    color: active ? colors.chipActiveText : colors.chipText,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {item.l}
                </Text>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>

      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 16, paddingBottom: 32, gap: 10 }}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No history yet"
            subtitle="Add or reduce stock to see movements here."
          />
        }
        renderItem={({ item }) => {
          const p = prodMap.get(item.productId);
          const isAdd = item.type === "add";
          const color = isAdd ? colors.success : colors.danger;
          const d = new Date(item.timestamp);
          return (
            <View
              style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
              testID={`history-item-${item.id}`}
            >
              <View style={[styles.iconWrap, { backgroundColor: color + "20" }]}>
                <Ionicons
                  name={isAdd ? "arrow-up" : "arrow-down"}
                  size={20}
                  color={color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>
                    {p ? `${p.model}${item.variant ? " • " + item.variant : ""}` : "Deleted product"}
                  </Text>
                  <Text style={{ color, fontWeight: "800", fontSize: 15 }}>
                    {isAdd ? "+" : "-"}
                    {item.quantity}
                  </Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                  {p ? `${compMap.get(p.companyId) || "-"} • ${p.size}` : ""} • {item.reason}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
                  {d.toLocaleDateString()} • {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {"  "}| {item.previous} → {item.current}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  item: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    alignItems: "center",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

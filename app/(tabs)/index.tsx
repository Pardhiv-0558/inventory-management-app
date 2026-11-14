import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { StatCard } from "@/src/components/StatCard";
import {
  getCategories,
  getCompanies,
  getHistory,
  getProducts,
  isLowStock,
  isOutOfStock,
  productTotal,
} from "@/src/store/db";
import { Category, Company, Product, StockHistoryEntry } from "@/src/store/types";
import { useTheme } from "@/src/theme/context";

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [c, ct, p, h] = await Promise.all([
      getCompanies(),
      getCategories(),
      getProducts(),
      getHistory(),
    ]);
    setCompanies(c);
    setCategories(ct);
    setProducts(p);
    setHistory(h);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalStock = products.reduce((s, p) => s + productTotal(p), 0);
  const lowStock = products.filter(isLowStock).length;
  const outOfStock = products.filter(isOutOfStock).length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = history.filter((h) => h.timestamp >= today.getTime()).length;

  // company wise chart data
  const companyStock = companies.map((co) => {
    const sum = products
      .filter((p) => p.companyId === co.id)
      .reduce((s, p) => s + productTotal(p), 0);
    return { name: co.name, value: sum };
  });
  const maxCoStock = Math.max(1, ...companyStock.map((c) => c.value));

  const categoryStock = categories.map((cat) => {
    const sum = products
      .filter((p) => p.categoryId === cat.id)
      .reduce((s, p) => s + productTotal(p), 0);
    return { name: cat.name, value: sum };
  });
  const maxCatStock = Math.max(1, ...categoryStock.map((c) => c.value));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="dashboard-screen">
      <SafeAreaView edges={["top"]}>
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroBrand}>SRI VENKATESWARA</Text>
              <Text style={styles.heroTitle}>Traders Dashboard</Text>
            </View>
            <Pressable
              onPress={() => router.push("/search")}
              style={styles.searchBtn}
              testID="dashboard-search-btn"
            >
              <Ionicons name="search" size={22} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{totalStock}</Text>
              <Text style={styles.heroStatLabel}>Total Boxes</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{products.length}</Text>
              <Text style={styles.heroStatLabel}>Products</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{todayCount}</Text>
              <Text style={styles.heroStatLabel}>Today</Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        {/* Stat cards */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Companies"
            value={companies.length}
            icon="business"
            gradient={["#3B82F6", "#1D4ED8"]}
            testID="stat-companies"
            onPress={() => router.push("/companies")}
          />
          <StatCard
            label="Categories"
            value={categories.length}
            icon="albums"
            gradient={["#8B5CF6", "#6D28D9"]}
            testID="stat-categories"
            onPress={() => router.push("/categories")}
          />
        </View>
        <View style={[styles.statsGrid, { marginTop: 12 }]}>
          <StatCard
            label="Low Stock"
            value={lowStock}
            icon="warning"
            gradient={["#F59E0B", "#D97706"]}
            testID="stat-low"
          />
          <StatCard
            label="Out of Stock"
            value={outOfStock}
            icon="alert-circle"
            gradient={["#EF4444", "#B91C1C"]}
            testID="stat-out"
          />
        </View>

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actions}>
          <QuickAction
            icon="add-circle"
            label="Add Product"
            color={colors.primary}
            onPress={() => router.push("/product/new")}
            testID="qa-add-product"
          />
          <QuickAction
            icon="cube"
            label="Browse Stock"
            color="#8B5CF6"
            onPress={() => router.push("/(tabs)/browse")}
            testID="qa-browse"
          />
          <QuickAction
            icon="search"
            label="Search"
            color="#F59E0B"
            onPress={() => router.push("/search")}
            testID="qa-search"
          />
          <QuickAction
            icon="download"
            label="Export"
            color="#10B981"
            onPress={() => router.push("/(tabs)/settings")}
            testID="qa-export"
          />
        </View>

        {/* Company wise chart */}
        {companyStock.some((c) => c.value > 0) && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Company-wise Stock</Text>
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]} testID="chart-company">
              {companyStock
                .sort((a, b) => b.value - a.value)
                .slice(0, 8)
                .map((c, i) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>{c.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{c.value}</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: colors.chipBg, borderRadius: 4, overflow: "hidden" }}>
                      <View
                        style={{
                          width: `${(c.value / maxCoStock) * 100}%`,
                          height: "100%",
                          backgroundColor: colors.primary,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </View>
                ))}
            </View>
          </>
        )}

        {/* Category wise chart */}
        {categoryStock.some((c) => c.value > 0) && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Category-wise Stock</Text>
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]} testID="chart-category">
              {categoryStock
                .filter((c) => c.value > 0)
                .sort((a, b) => b.value - a.value)
                .slice(0, 8)
                .map((c, i) => (
                  <View key={i} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 13 }}>{c.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{c.value}</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: colors.chipBg, borderRadius: 4, overflow: "hidden" }}>
                      <View
                        style={{
                          width: `${(c.value / maxCatStock) * 100}%`,
                          height: "100%",
                          backgroundColor: colors.secondary,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </View>
                ))}
            </View>
          </>
        )}

        {products.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]} testID="dashboard-empty">
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="cube-outline" size={36} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 14 }}>
              Start your stock book
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: "center", lineHeight: 20 }}>
              Add your first tile or sanitary product to start tracking stock digitally. Companies &amp; categories are already set up for you.
            </Text>
            <PrimaryButton
              label="Add First Product"
              onPress={() => router.push("/product/new")}
              icon={<Ionicons name="add" size={20} color="#fff" />}
              style={{ marginTop: 16, alignSelf: "stretch" }}
              testID="empty-add-first"
            />
            <Pressable onPress={() => router.push("/(tabs)/settings")} style={{ padding: 8, marginTop: 4 }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
                or import from Excel →
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Recently updated products */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recently Updated</Text>
            <View style={{ gap: 8 }}>
              {[...products]
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .slice(0, 5)
                .map((p) => {
                  const total = productTotal(p);
                  const low = isLowStock(p);
                  const out = isOutOfStock(p);
                  const badge = out ? colors.danger : low ? colors.warning : colors.success;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => router.push({ pathname: "/product/[id]", params: { id: p.id } })}
                      style={({ pressed }) => [
                        styles.recentRow,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        pressed && { transform: [{ scale: 0.99 }] },
                      ]}
                      testID={`recent-${p.model}`}
                    >
                      <View style={{ width: 6, height: 40, borderRadius: 3, backgroundColor: badge }} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }} numberOfLines={1}>
                          {p.model}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                          {companies.find((c) => c.id === p.companyId)?.name} • {p.size}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>{total}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 10 }}>boxes</Text>
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress, testID }: any) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.qa,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
      testID={testID}
    >
      <View style={[styles.qaIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 12, textAlign: "center" }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroBrand: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatValue: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  heroStatLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "600", marginTop: 4 },
  divider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.25)" },
  statsGrid: { flexDirection: "row", gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 24, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 10 },
  qa: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  qaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyCard: {
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState";
import {
  getCategories,
  getCompanies,
  getProducts,
  isLowStock,
  isOutOfStock,
  productTotal,
} from "@/src/store/db";
import { Category, Company, Product } from "@/src/store/types";
import { useTheme } from "@/src/theme/context";

type Filter = "all" | "in" | "low" | "out";

export default function BrowseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    const [c, ct, p] = await Promise.all([getCompanies(), getCategories(), getProducts()]);
    setCompanies(c);
    setCategories(ct);
    setProducts(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const compMap = useMemo(
    () => new Map(companies.map((c) => [c.id, c.name])),
    [companies]
  );
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => {
        if (companyFilter && p.companyId !== companyFilter) return false;
        if (statusFilter === "in" && productTotal(p) <= 0) return false;
        if (statusFilter === "out" && !isOutOfStock(p)) return false;
        if (statusFilter === "low" && !isLowStock(p)) return false;
        if (!q) return true;
        const co = (compMap.get(p.companyId) || "").toLowerCase();
        const cat = (catMap.get(p.categoryId)?.name || "").toLowerCase();
        return (
          p.model.toLowerCase().includes(q) ||
          p.size.toLowerCase().includes(q) ||
          co.includes(q) ||
          cat.includes(q)
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [products, query, companyFilter, statusFilter, compMap, catMap]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="browse-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Stock</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {filtered.length} of {products.length} products
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/product/new")}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              testID="btn-add-product"
            >
              <Ionicons name="add" size={22} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700" }}>Add</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search model, company, size..."
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, color: colors.text, fontSize: 15 }}
              testID="stock-search-input"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} testID="stock-search-clear">
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Status chips */}
        <View>
          <FlatList
            data={
              [
                { key: "all", label: "All" },
                { key: "in", label: "In Stock" },
                { key: "low", label: "Low Stock" },
                { key: "out", label: "Out of Stock" },
              ] as { key: Filter; label: string }[]
            }
            keyExtractor={(i) => i.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => {
              const active = statusFilter === item.key;
              return (
                <Pressable
                  onPress={() => setStatusFilter(item.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.chipActiveBg : colors.chipBg,
                      borderColor: active ? colors.chipActiveBg : colors.border,
                    },
                  ]}
                  testID={`filter-${item.key}`}
                >
                  <Text
                    style={{
                      color: active ? colors.chipActiveText : colors.chipText,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Company chips */}
        {companies.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <FlatList
              data={[{ id: "__all__", name: "All Companies" }, ...companies]}
              keyExtractor={(i) => i.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              renderItem={({ item }) => {
                const isAll = item.id === "__all__";
                const active = isAll ? !companyFilter : companyFilter === item.id;
                return (
                  <Pressable
                    onPress={() => setCompanyFilter(isAll ? null : item.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.text : colors.chipBg,
                        borderColor: active ? colors.text : colors.border,
                      },
                    ]}
                    testID={`co-filter-${item.name}`}
                  >
                    <Text
                      style={{
                        color: active ? colors.bg : colors.chipText,
                        fontWeight: "700",
                        fontSize: 13,
                      }}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        )}
      </SafeAreaView>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: 32, gap: 10 }}
        ListEmptyComponent={
          products.length === 0 ? (
            <EmptyState
              icon="cube-outline"
              title="No products yet"
              subtitle="Tap the Add button above to create your first product."
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No matches"
              subtitle="Try changing filters or the search text."
            />
          )
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            companyName={compMap.get(item.companyId) || "-"}
            category={catMap.get(item.categoryId)}
            onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}
          />
        )}
      />
    </View>
  );
}

function ProductCard({
  product,
  companyName,
  category,
  onPress,
}: {
  product: Product;
  companyName: string;
  category?: Category;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const total = productTotal(product);
  const low = isLowStock(product);
  const out = isOutOfStock(product);
  const badgeColor = out ? colors.danger : low ? colors.warning : colors.success;
  const badgeLabel = out ? "OUT" : low ? "LOW" : "OK";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
      testID={`product-card-${product.model}`}
    >
      <View style={[styles.thumb, { backgroundColor: colors.chipBg }]}>
        {product.photo ? (
          <Image source={{ uri: product.photo }} style={{ width: "100%", height: "100%" }} />
        ) : (
          <Ionicons name="image-outline" size={28} color={colors.textMuted} />
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }} numberOfLines={1}>
            {product.model}
          </Text>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>
              {badgeLabel}
            </Text>
          </View>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {companyName} • {category?.name || "-"} • {product.size}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 6, gap: 6 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>{total}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Boxes</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  card: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});

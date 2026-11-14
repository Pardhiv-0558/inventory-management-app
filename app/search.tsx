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

import { EmptyState } from "@/src/components/EmptyState";
import { Screen } from "@/src/components/Screen";
import {
  getCategories,
  getCompanies,
  getProducts,
  productTotal,
} from "@/src/store/db";
import { Category, Company, Product, VARIANT_KEYS } from "@/src/store/types";
import { useTheme } from "@/src/theme/context";

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");

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

  const compMap = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => {
        const co = (compMap.get(p.companyId) || "").toLowerCase();
        const cat = (catMap.get(p.categoryId)?.name || "").toLowerCase();
        return (
          p.model.toLowerCase().includes(q) ||
          p.size.toLowerCase().includes(q) ||
          co.includes(q) ||
          cat.includes(q)
        );
      })
      .slice(0, 40);
  }, [products, query, compMap, catMap]);

  return (
    <Screen title="Search" showBack testID="search-screen">
      <View style={{ paddingHorizontal: 16 }}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
          <Ionicons name="search" size={22} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Type model number, e.g. 9032"
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, color: colors.text, fontSize: 17, fontWeight: "600" }}
            autoFocus
            returnKeyType="search"
            testID="search-input"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} testID="search-clear">
              <Ionicons name="close-circle" size={22} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingTop: 12, gap: 12, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.trim() ? (
            <EmptyState
              icon="search-outline"
              title="No results"
              subtitle="Try a different keyword or check spelling."
            />
          ) : (
            <View style={{ padding: 32, alignItems: "center" }}>
              <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.chipBg, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="search" size={36} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 16 }}>
                Fast search
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: "center", lineHeight: 20 }}>
                Just type a model number like 9032 or 7210 to instantly see stock, variants, and photo.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const co = compMap.get(item.companyId) || "-";
          const cat = catMap.get(item.categoryId);
          const total = productTotal(item);
          return (
            <Pressable
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}
              style={[styles.result, { backgroundColor: colors.surface, borderColor: colors.border }]}
              testID={`search-result-${item.model}`}
            >
              <View style={[styles.thumb, { backgroundColor: colors.chipBg }]}>
                {item.photo ? (
                  <Image source={{ uri: item.photo }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>{item.model}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                  {co} • {cat?.name} • {item.size}
                </Text>
                {cat?.hasVariants && item.variants ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {VARIANT_KEYS.map((k) => (
                      <View
                        key={k}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          backgroundColor: colors.chipBg,
                          borderRadius: 8,
                          flexDirection: "row",
                          gap: 4,
                        }}
                      >
                        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: "800" }}>{k}</Text>
                        <Text style={{ color: colors.text, fontSize: 10, fontWeight: "800" }}>
                          {item.variants![k] || 0}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 6, gap: 4 }}>
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>{total}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Boxes</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 60,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  result: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    alignItems: "center",
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { Screen } from "@/src/components/Screen";
import { useToast } from "@/src/components/Toast";
import {
  deleteProduct,
  getCategories,
  getCompanies,
  getHistory,
  getProducts,
  isLowStock,
  isOutOfStock,
  productTotal,
} from "@/src/store/db";
import {
  Category,
  Company,
  Product,
  StockHistoryEntry,
  VARIANT_KEYS,
} from "@/src/store/types";
import { useTheme } from "@/src/theme/context";

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [zoom, setZoom] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [products, cos, cats, hist] = await Promise.all([
      getProducts(),
      getCompanies(),
      getCategories(),
      getHistory(),
    ]);
    const p = products.find((x) => x.id === id) || null;
    setProduct(p);
    if (p) {
      setCompany(cos.find((c) => c.id === p.companyId) || null);
      setCategory(cats.find((c) => c.id === p.categoryId) || null);
      setHistory(hist.filter((h) => h.productId === p.id).slice(0, 20));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!product) {
    return (
      <Screen title="Product" showBack>
        <View style={{ padding: 20 }}>
          <Text style={{ color: colors.textMuted }}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  const total = productTotal(product);
  const low = isLowStock(product);
  const out = isOutOfStock(product);
  const badgeColor = out ? colors.danger : low ? colors.warning : colors.success;
  const badgeLabel = out ? "Out of Stock" : low ? "Low Stock" : "In Stock";

  const doDelete = async () => {
    await deleteProduct(product.id);
    toast.show("Product deleted", "warning");
    setConfirm(false);
    router.back();
  };

  return (
    <Screen
      title={product.model}
      subtitle={`${company?.name || "-"} • ${product.size}`}
      showBack
      testID="product-detail"
      headerRight={
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Pressable
            onPress={() => router.push({ pathname: "/product/edit/[id]", params: { id: product.id } })}
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            testID="edit-product"
          >
            <Ionicons name="create-outline" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => setConfirm(true)}
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            testID="delete-product"
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </Pressable>
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 16 }}>
        {/* Photo */}
        <Pressable
          onPress={() => product.photo && setZoom(true)}
          style={[styles.photo, { backgroundColor: colors.chipBg, borderColor: colors.border }]}
          testID="product-photo"
        >
          {product.photo ? (
            <Image source={{ uri: product.photo }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: "center" }}>
              <Ionicons name="image-outline" size={48} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 8 }}>No photo</Text>
            </View>
          )}
        </Pressable>

        {/* Total Stock hero */}
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" }}>
              Total Stock
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <Text style={{ color: "#fff", fontSize: 44, fontWeight: "900", letterSpacing: -1 }}>
                {total}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: "600" }}>
                Boxes
              </Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 6 }}>
              {category?.name} • Min: {product.minStock}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: badgeColor }]}>
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>{badgeLabel}</Text>
          </View>
        </LinearGradient>

        {/* Variants grid */}
        {product.variants && category?.hasVariants && (
          <View style={[styles.variantsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "800", marginBottom: 12 }}>
              Variant Stock
            </Text>
            <View style={styles.variantsGrid}>
              {VARIANT_KEYS.map((k) => (
                <View
                  key={k}
                  style={[styles.variantTile, { backgroundColor: colors.chipBg, borderColor: colors.border }]}
                  testID={`variant-${k}`}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>
                    {k}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 4 }}>
                    {product.variants![k] || 0}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent history */}
        {history.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "800", marginBottom: 8 }}>
              Recent Activity
            </Text>
            {history.map((h) => {
              const d = new Date(h.timestamp);
              const isAdd = h.type === "add";
              const color = isAdd ? colors.success : colors.danger;
              return (
                <View
                  key={h.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>
                      {isAdd ? "+" : "-"}
                      {h.quantity}
                      {h.variant ? ` (${h.variant})` : ""} • {h.reason}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                      {d.toLocaleDateString()} • {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <Text style={{ color, fontSize: 14, fontWeight: "800" }}>
                    {h.previous} → {h.current}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <PrimaryButton
          label="Reduce"
          variant="danger"
          icon={<Ionicons name="remove" size={22} color="#fff" />}
          onPress={() => router.push({ pathname: "/stock/reduce", params: { id: product.id } })}
          style={{ flex: 1 }}
          size="lg"
          testID="btn-reduce-stock"
        />
        <PrimaryButton
          label="Add Stock"
          variant="success"
          icon={<Ionicons name="add" size={22} color="#fff" />}
          onPress={() => router.push({ pathname: "/stock/add", params: { id: product.id } })}
          style={{ flex: 1 }}
          size="lg"
          testID="btn-add-stock"
        />
      </View>

      {/* Photo zoom */}
      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
        <View style={styles.zoomOverlay}>
          <Pressable onPress={() => setZoom(false)} style={styles.zoomClose} testID="zoom-close">
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {product.photo && (
            <Image source={{ uri: product.photo }} style={{ width: "100%", height: "80%" }} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Delete confirm */}
      <Modal visible={confirm} transparent animationType="fade" onRequestClose={() => setConfirm(false)}>
        <View style={styles.confirmOverlay}>
          <SafeAreaView />
          <View style={[styles.confirmCard, { backgroundColor: colors.surface }]}>
            <View style={{ alignItems: "center" }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.danger + "20", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="trash" size={28} color={colors.danger} />
              </View>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 12 }}>
                Delete this product?
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center", marginTop: 8 }}>
                {product.model} — this cannot be undone.
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <PrimaryButton label="Cancel" variant="outline" onPress={() => setConfirm(false)} style={{ flex: 1 }} testID="delete-cancel" />
              <PrimaryButton label="Delete" variant="danger" onPress={doDelete} style={{ flex: 1 }} testID="delete-confirm" />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    height: 260,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: { padding: 20, borderRadius: 24, flexDirection: "row", alignItems: "center" },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  variantsCard: { padding: 16, borderRadius: 20, borderWidth: 1 },
  variantsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  variantTile: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 90,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  card: { padding: 16, borderRadius: 20, borderWidth: 1 },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomClose: {
    position: "absolute",
    top: 50,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  confirmCard: {
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
});

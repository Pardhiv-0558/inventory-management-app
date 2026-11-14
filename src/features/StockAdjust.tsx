import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Numpad } from "@/src/components/Numpad";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { useToast } from "@/src/components/Toast";
import {
  addHistory,
  applyStockChange,
  getCategories,
  getProducts,
  logActivity,
  productTotal,
  updateProduct,
} from "@/src/store/db";
import {
  ADD_REASONS,
  Category,
  Product,
  REDUCE_REASONS,
  StockOp,
  VARIANT_KEYS,
  VariantKey,
} from "@/src/store/types";
import { useTheme } from "@/src/theme/context";

export function StockAdjustScreen({ op }: { op: StockOp }) {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantKey | null>(null);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState<string>(op === "add" ? ADD_REASONS[0] : REDUCE_REASONS[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [products, cats] = await Promise.all([getProducts(), getCategories()]);
      const p = products.find((x) => x.id === id) || null;
      setProduct(p);
      if (p) {
        const c = cats.find((x) => x.id === p.categoryId) || null;
        setCategory(c);
        if (c?.hasVariants) setSelectedVariant("L");
      }
    })();
  }, [id]);

  const reasons = op === "add" ? ADD_REASONS : REDUCE_REASONS;

  const currentForVariant = useMemo(() => {
    if (!product) return 0;
    if (category?.hasVariants && product.variants && selectedVariant) {
      return product.variants[selectedVariant] || 0;
    }
    return product.total || 0;
  }, [product, category, selectedVariant]);

  const currentTotal = useMemo(() => (product ? productTotal(product) : 0), [product]);

  const numeric = parseInt(qty || "0", 10) || 0;
  const nextVal = op === "add" ? currentForVariant + numeric : currentForVariant - numeric;

  const submit = async () => {
    if (!product) return;
    if (numeric <= 0) {
      toast.show("Enter quantity", "error");
      return;
    }
    if (op === "reduce" && numeric > currentForVariant) {
      toast.show(`Insufficient stock — only ${currentForVariant} available`, "error");
      return;
    }
    if (category?.hasVariants && !selectedVariant) {
      toast.show("Select a variant", "error");
      return;
    }

    setBusy(true);
    try {
      const { updated, prev, curr } = applyStockChange(
        product,
        category?.hasVariants ? selectedVariant! : undefined,
        op,
        numeric
      );
      await updateProduct(product.id, updated);
      await addHistory({
        productId: product.id,
        type: op,
        variant: category?.hasVariants ? selectedVariant! : undefined,
        quantity: numeric,
        reason,
        previous: prev,
        current: curr,
      });
      await logActivity(
        op === "add" ? "Stock Added" : "Stock Reduced",
        `${product.model}${selectedVariant ? " " + selectedVariant : ""} ${op === "add" ? "+" : "-"}${numeric} • ${reason}`
      );
      toast.show(op === "add" ? "Stock added successfully" : "Stock reduced successfully", "success");
      router.back();
    } catch (e: any) {
      toast.show(`Failed: ${e?.message || e}`, "error");
    } finally {
      setBusy(false);
    }
  };

  if (!product) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      </View>
    );
  }

  const gradient: [string, string] = op === "add" ? ["#10B981", "#059669"] : ["#EF4444", "#B91C1C"];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID={`stock-${op}-screen`}>
      <SafeAreaView edges={["top"]}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.iconBtn}
              testID="stock-close"
            >
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={styles.headerTitle}>{op === "add" ? "Add Stock" : "Reduce Stock"}</Text>
              <Text style={styles.headerSub}>{product.model} • {product.size}</Text>
            </View>
          </View>
          <View style={styles.headerStats}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValue}>{currentForVariant}</Text>
            </View>
            <Ionicons name={op === "add" ? "arrow-forward" : "arrow-forward"} size={24} color="rgba(255,255,255,0.6)" />
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.statLabel}>After</Text>
              <Text style={[styles.statValue, nextVal < 0 && { color: "#FCA5A5" }]}>
                {nextVal}
              </Text>
            </View>
          </View>
          <Text style={styles.overallStats}>
            Overall product total: <Text style={{ fontWeight: "800", color: "#fff" }}>{currentTotal} Boxes</Text>
          </Text>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 14 }}>
        {/* Variant chips */}
        {category?.hasVariants && (
          <View>
            <Text style={styles.sectionLabel}>Choose variant</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {VARIANT_KEYS.map((k) => {
                const active = selectedVariant === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setSelectedVariant(k)}
                    style={[
                      styles.varChip,
                      {
                        backgroundColor: active ? colors.chipActiveBg : colors.chipBg,
                        borderColor: active ? colors.chipActiveBg : colors.border,
                      },
                    ]}
                    testID={`select-variant-${k}`}
                  >
                    <Text
                      style={{
                        color: active ? colors.chipActiveText : colors.chipText,
                        fontWeight: "800",
                        fontSize: 13,
                      }}
                    >
                      {k}
                    </Text>
                    <Text
                      style={{
                        color: active ? colors.chipActiveText : colors.textMuted,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {product.variants?.[k] || 0}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Quantity display */}
        <View style={[styles.qtyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.sectionLabel}>Quantity</Text>
          <Text style={{ color: colors.text, fontSize: 56, fontWeight: "900", letterSpacing: -1, textAlign: "center", marginVertical: 4 }}>
            {op === "add" ? "+" : "-"}{qty || "0"}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: "center" }}>Boxes</Text>
        </View>

        {/* Numpad */}
        <Numpad value={qty} onChange={setQty} maxLength={5} />

        {/* Reason chips */}
        <View>
          <Text style={styles.sectionLabel}>Reason</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {reasons.map((r) => {
              const active = reason === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setReason(r)}
                  style={[
                    styles.reasonChip,
                    {
                      backgroundColor: active ? colors.chipActiveBg : colors.chipBg,
                      borderColor: active ? colors.chipActiveBg : colors.border,
                    },
                  ]}
                  testID={`reason-${r}`}
                >
                  <Text
                    style={{
                      color: active ? colors.chipActiveText : colors.chipText,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <PrimaryButton
          label={op === "add" ? "Add to Stock" : "Reduce from Stock"}
          onPress={submit}
          variant={op === "add" ? "success" : "danger"}
          loading={busy}
          size="lg"
          testID="submit-stock"
          style={{ marginTop: 6 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
    gap: 12,
  },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  statValue: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 4 },
  overallStats: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 12, textAlign: "center" },
  sectionLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  varChip: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBox: { padding: 16, borderRadius: 20, borderWidth: 1 },
  reasonChip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/EmptyState";
import { PrimaryButton } from "@/src/components/PrimaryButton";
import { Screen } from "@/src/components/Screen";
import { useToast } from "@/src/components/Toast";
import {
  addCategory,
  deleteCategory,
  getCategories,
  getProducts,
  logActivity,
  updateCategory,
} from "@/src/store/db";
import { Category, Product } from "@/src/store/types";
import { useTheme } from "@/src/theme/context";

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [hasVariantsDraft, setHasVariantsDraft] = useState(false);

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([getCategories(), getProducts()]);
    setItems(c);
    setProducts(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stockFor = (id: string) => {
    const list = products.filter((p) => p.categoryId === id);
    return {
      models: list.length,
      total: list.reduce(
        (s, p) => s + (p.variants ? Object.values(p.variants).reduce((a, b) => a + b, 0) : p.total || 0),
        0
      ),
    };
  };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()));

  const submit = async () => {
    const n = nameDraft.trim();
    if (!n) return;
    if (editing) {
      await updateCategory(editing.id, n, hasVariantsDraft);
      await logActivity("Category Updated", n);
      toast.show("Category updated", "success");
    } else {
      await addCategory(n, hasVariantsDraft);
      await logActivity("Category Added", n);
      toast.show("Category added", "success");
    }
    setNameDraft("");
    setHasVariantsDraft(false);
    setEditing(null);
    setShowAdd(false);
    await load();
  };

  const remove = async (id: string, name: string) => {
    await deleteCategory(id);
    await logActivity("Category Deleted", name);
    toast.show("Category deleted", "warning");
    await load();
  };

  return (
    <Screen
      title="Categories"
      subtitle={`${items.length} categories`}
      showBack
      testID="categories-screen"
      headerRight={
        <Pressable
          onPress={() => {
            setNameDraft("");
            setHasVariantsDraft(false);
            setEditing(null);
            setShowAdd(true);
          }}
          style={[styles.iconBtn, { backgroundColor: colors.primary }]}
          testID="add-category-btn"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      }
    >
      <View style={{ paddingHorizontal: 16 }}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories"
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, color: colors.text, fontSize: 15 }}
            testID="category-search"
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState
            icon="albums-outline"
            title="No categories"
            subtitle="Add your first category with the + button."
          />
        }
        renderItem={({ item }) => {
          const stats = stockFor(item.id);
          return (
            <View
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              testID={`category-item-${item.name}`}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{item.name}</Text>
                  {item.hasVariants && (
                    <View style={{ backgroundColor: colors.primary + "20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: colors.primary, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 }}>
                        VARIANTS
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                  {stats.models} models • {stats.total} boxes
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setEditing(item);
                  setNameDraft(item.name);
                  setHasVariantsDraft(item.hasVariants);
                  setShowAdd(true);
                }}
                style={[styles.rowBtn, { backgroundColor: colors.chipBg }]}
                testID={`edit-category-${item.name}`}
              >
                <Ionicons name="create-outline" size={18} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() => remove(item.id, item.name)}
                style={[styles.rowBtn, { backgroundColor: colors.danger + "20" }]}
                testID={`delete-category-${item.name}`}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
          );
        }}
      />

      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowAdd(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.handle} />
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
              {editing ? "Edit Category" : "Add Category"}
            </Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Category name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              autoFocus
              style={[
                styles.modalInput,
                { backgroundColor: colors.chipBg, borderColor: colors.border, color: colors.text },
              ]}
              testID="category-name-input"
            />
            <Pressable
              onPress={() => setHasVariantsDraft((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 12,
                backgroundColor: colors.chipBg,
                borderRadius: 12,
              }}
              testID="category-has-variants"
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  backgroundColor: hasVariantsDraft ? colors.primary : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {hasVariantsDraft ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>Has design variants</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                  L / H1 / H2 / H3 / D / F (Kitchen or Bathroom tiles)
                </Text>
              </View>
            </Pressable>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <PrimaryButton
                label="Cancel"
                variant="outline"
                onPress={() => setShowAdd(false)}
                style={{ flex: 1 }}
                testID="category-cancel"
              />
              <PrimaryButton
                label={editing ? "Update" : "Add"}
                onPress={submit}
                style={{ flex: 1 }}
                testID="category-submit"
              />
            </View>
            <SafeAreaView edges={["bottom"]} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  rowBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalCard: {
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#94A3B8",
    opacity: 0.4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalInput: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
  },
});

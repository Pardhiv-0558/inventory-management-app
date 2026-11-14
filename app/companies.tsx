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
  addCompany,
  deleteCompany,
  getCompanies,
  getProducts,
  logActivity,
  updateCompany,
} from "@/src/store/db";
import { Company, Product } from "@/src/store/types";
import { useTheme } from "@/src/theme/context";

export default function CompaniesScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [items, setItems] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Company | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([getCompanies(), getProducts()]);
    setItems(c);
    setProducts(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stockFor = (id: string) => {
    const list = products.filter((p) => p.companyId === id);
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
      await updateCompany(editing.id, n);
      await logActivity("Company Updated", n);
      toast.show("Company updated", "success");
    } else {
      await addCompany(n);
      await logActivity("Company Added", n);
      toast.show("Company added", "success");
    }
    setNameDraft("");
    setEditing(null);
    setShowAdd(false);
    await load();
  };

  const remove = async (id: string, name: string) => {
    await deleteCompany(id);
    await logActivity("Company Deleted", name);
    toast.show("Company deleted", "warning");
    await load();
  };

  return (
    <Screen
      title="Companies"
      subtitle={`${items.length} companies`}
      showBack
      testID="companies-screen"
      headerRight={
        <Pressable
          onPress={() => {
            setNameDraft("");
            setEditing(null);
            setShowAdd(true);
          }}
          style={[styles.iconBtn, { backgroundColor: colors.primary }]}
          testID="add-company-btn"
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
            placeholder="Search companies"
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, color: colors.text, fontSize: 15 }}
            testID="company-search"
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="No companies"
            subtitle="Add your first company using the + button above."
          />
        }
        renderItem={({ item }) => {
          const stats = stockFor(item.id);
          return (
            <View
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              testID={`company-item-${item.name}`}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>{item.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                  {stats.models} models • {stats.total} boxes
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setEditing(item);
                  setNameDraft(item.name);
                  setShowAdd(true);
                }}
                style={[styles.rowBtn, { backgroundColor: colors.chipBg }]}
                testID={`edit-company-${item.name}`}
              >
                <Ionicons name="create-outline" size={18} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={() => remove(item.id, item.name)}
                style={[styles.rowBtn, { backgroundColor: colors.danger + "20" }]}
                testID={`delete-company-${item.name}`}
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
              {editing ? "Edit Company" : "Add Company"}
            </Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Company name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoFocus
              style={[
                styles.modalInput,
                { backgroundColor: colors.chipBg, borderColor: colors.border, color: colors.text },
              ]}
              testID="company-name-input"
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <PrimaryButton
                label="Cancel"
                variant="outline"
                onPress={() => setShowAdd(false)}
                style={{ flex: 1 }}
                testID="company-cancel"
              />
              <PrimaryButton
                label={editing ? "Update" : "Add"}
                onPress={submit}
                style={{ flex: 1 }}
                testID="company-submit"
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

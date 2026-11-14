import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/PrimaryButton";
import { Screen } from "@/src/components/Screen";
import { useToast } from "@/src/components/Toast";
import {
  addCategory,
  addCompany,
  addProduct,
  getCategories,
  getCompanies,
  getProducts,
  logActivity,
  updateProduct,
} from "@/src/store/db";
import {
  Category,
  Company,
  Product,
  VARIANT_KEYS,
  VariantStock,
} from "@/src/store/types";
import { useTheme } from "@/src/theme/context";

type Mode = "new" | "edit";

export default function ProductFormRoute({ mode }: { mode?: Mode }) {
  return <ProductForm mode={mode || "new"} />;
}

export function ProductForm({ mode }: { mode: Mode }) {
  const { colors, settings } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [model, setModel] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [minStock, setMinStock] = useState(String(settings.defaultMinStock));
  const [total, setTotal] = useState("0");
  const [variants, setVariants] = useState<VariantStock>({ L: 0, H1: 0, H2: 0, H3: 0, D: 0, F: 0 });
  const [busy, setBusy] = useState(false);
  const [companyPicker, setCompanyPicker] = useState(false);
  const [categoryPicker, setCategoryPicker] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryHasVariants, setNewCategoryHasVariants] = useState(false);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);

  useEffect(() => {
    (async () => {
      const [c, ct, p] = await Promise.all([getCompanies(), getCategories(), getProducts()]);
      setCompanies(c);
      setCategories(ct);
      if (mode === "edit" && id) {
        const found = p.find((x) => x.id === id);
        if (found) {
          setExistingProduct(found);
          setCompanyId(found.companyId);
          setCategoryId(found.categoryId);
          setSize(found.size);
          setModel(found.model);
          setPhoto(found.photo);
          setMinStock(String(found.minStock));
          if (found.variants) setVariants(found.variants);
          if (typeof found.total === "number") setTotal(String(found.total));
        }
      }
    })();
  }, [id, mode]);

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId) || null,
    [categories, categoryId]
  );
  const company = useMemo(
    () => companies.find((c) => c.id === companyId) || null,
    [companies, companyId]
  );

  const pickPhoto = async (fromCamera: boolean) => {
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        toast.show("Permission denied", "error");
        return;
      }
      const res = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.7,
            base64: true,
            allowsEditing: true,
            aspect: [1, 1],
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
            base64: true,
            allowsEditing: true,
            aspect: [1, 1],
          });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      if (a.base64) {
        setPhoto(`data:image/jpeg;base64,${a.base64}`);
      } else if (a.uri) {
        setPhoto(a.uri);
      }
    } catch (e: any) {
      toast.show(`Photo failed: ${e?.message || e}`, "error");
    }
  };

  const save = async () => {
    if (!companyId) {
      toast.show("Select a company", "error");
      return;
    }
    if (!categoryId) {
      toast.show("Select a category", "error");
      return;
    }
    if (!model.trim()) {
      toast.show("Enter model number", "error");
      return;
    }
    if (!size.trim()) {
      toast.show("Enter size (e.g. 12x18)", "error");
      return;
    }

    setBusy(true);
    try {
      const min = parseInt(minStock || "0", 10) || 0;
      const totalNum = parseInt(total || "0", 10) || 0;

      const payload: any = {
        companyId,
        categoryId,
        size: size.trim(),
        model: model.trim(),
        photo,
        minStock: min,
      };
      if (category?.hasVariants) {
        payload.variants = variants;
      } else {
        payload.total = totalNum;
      }

      if (mode === "edit" && existingProduct) {
        await updateProduct(existingProduct.id, payload);
        await logActivity("Update Product", `${payload.model} (${company?.name})`);
        toast.show("Product updated", "success");
      } else {
        const p = await addProduct(payload);
        await logActivity("Add Product", `${p.model} (${company?.name})`);
        toast.show("Product added", "success");
      }
      router.back();
    } catch (e: any) {
      toast.show(`Save failed: ${e?.message || e}`, "error");
    } finally {
      setBusy(false);
    }
  };

  const doAddCompany = async () => {
    const n = newCompanyName.trim();
    if (!n) return;
    const co = await addCompany(n);
    setCompanies((s) => [...s, co]);
    setCompanyId(co.id);
    setNewCompanyName("");
    setCompanyPicker(false);
  };
  const doAddCategory = async () => {
    const n = newCategoryName.trim();
    if (!n) return;
    const c = await addCategory(n, newCategoryHasVariants);
    setCategories((s) => [...s, c]);
    setCategoryId(c.id);
    setNewCategoryName("");
    setNewCategoryHasVariants(false);
    setCategoryPicker(false);
  };

  return (
    <Screen
      title={mode === "edit" ? "Edit Product" : "Add Product"}
      subtitle={mode === "edit" ? "Update details" : "New tile / sanitary item"}
      showBack
      testID="product-form"
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>
        {/* Photo */}
        <View style={[styles.photoRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            onPress={() => setPhoto(undefined)}
            disabled={!photo}
            style={[styles.photoBox, { backgroundColor: colors.chipBg, borderColor: colors.border }]}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={{ width: "100%", height: "100%" }} />
            ) : (
              <Ionicons name="image-outline" size={32} color={colors.textMuted} />
            )}
          </Pressable>
          <View style={{ flex: 1, gap: 8 }}>
            <PrimaryButton
              label="Take Photo"
              variant="outline"
              icon={<Ionicons name="camera-outline" size={20} color={colors.text} />}
              onPress={() => pickPhoto(true)}
              size="sm"
              testID="photo-camera"
            />
            <PrimaryButton
              label="From Gallery"
              variant="outline"
              icon={<Ionicons name="images-outline" size={20} color={colors.text} />}
              onPress={() => pickPhoto(false)}
              size="sm"
              testID="photo-gallery"
            />
            {photo && (
              <PrimaryButton
                label="Remove"
                variant="ghost"
                onPress={() => setPhoto(undefined)}
                size="sm"
                testID="photo-remove"
              />
            )}
          </View>
        </View>

        {/* Company */}
        <Label text="Company" />
        <Pressable
          onPress={() => setCompanyPicker(true)}
          style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          testID="pick-company"
        >
          <Text style={{ color: company ? colors.text : colors.textMuted, fontSize: 16, fontWeight: "600" }}>
            {company?.name || "Select company"}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
        </Pressable>

        {/* Category */}
        <Label text="Category" />
        <Pressable
          onPress={() => setCategoryPicker(true)}
          style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          testID="pick-category"
        >
          <Text style={{ color: category ? colors.text : colors.textMuted, fontSize: 16, fontWeight: "600" }}>
            {category?.name || "Select category"}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
        </Pressable>

        {/* Size */}
        <Label text="Size" />
        <TextInput
          value={size}
          onChangeText={setSize}
          placeholder="e.g. 12x18, 24x24, 16x16"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          testID="input-size"
          autoCapitalize="none"
        />

        {/* Model */}
        <Label text="Model Number" />
        <TextInput
          value={model}
          onChangeText={setModel}
          placeholder="e.g. 9032, 7210"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          testID="input-model"
          autoCapitalize="characters"
        />

        {/* Min stock */}
        <Label text="Low Stock Threshold" />
        <TextInput
          value={minStock}
          onChangeText={(t) => setMinStock(t.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          placeholder="Alert when stock is below"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          testID="input-min-stock"
        />

        {/* Stock inputs */}
        {category?.hasVariants ? (
          <>
            <Label text="Initial Stock (Variants)" />
            <View style={styles.variantsGrid}>
              {VARIANT_KEYS.map((k) => (
                <View
                  key={k}
                  style={[styles.variantInputCell, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "800" }}>{k}</Text>
                  <TextInput
                    value={String(variants[k])}
                    onChangeText={(t) =>
                      setVariants((s) => ({ ...s, [k]: parseInt(t.replace(/[^0-9]/g, "") || "0", 10) }))
                    }
                    keyboardType="number-pad"
                    style={{ color: colors.text, fontSize: 20, fontWeight: "800", padding: 0, marginTop: 4, textAlign: "center" }}
                    testID={`variant-input-${k}`}
                  />
                </View>
              ))}
            </View>
          </>
        ) : category ? (
          <>
            <Label text="Initial Total Stock (Boxes)" />
            <TextInput
              value={total}
              onChangeText={(t) => setTotal(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="e.g. 208"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              testID="input-total"
            />
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <PrimaryButton
          label={mode === "edit" ? "Save Changes" : "Add Product"}
          onPress={save}
          loading={busy}
          size="lg"
          testID="save-product"
        />
      </View>

      {/* Company picker */}
      <PickerModal
        visible={companyPicker}
        onClose={() => setCompanyPicker(false)}
        title="Select Company"
        items={companies}
        selectedId={companyId}
        onSelect={(id) => {
          setCompanyId(id);
          setCompanyPicker(false);
        }}
        addLabel="Add New Company"
        onAddNew={
          newCompanyName.trim()
            ? doAddCompany
            : undefined
        }
        addInput={
          <TextInput
            value={newCompanyName}
            onChangeText={setNewCompanyName}
            placeholder="New company name"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.chipBg, borderColor: colors.border, color: colors.text }]}
            testID="new-company-name"
            autoCapitalize="characters"
          />
        }
        onAddPress={doAddCompany}
      />

      {/* Category picker */}
      <PickerModal
        visible={categoryPicker}
        onClose={() => setCategoryPicker(false)}
        title="Select Category"
        items={categories}
        selectedId={categoryId}
        onSelect={(id) => {
          setCategoryId(id);
          setCategoryPicker(false);
        }}
        renderExtra={(item: any) =>
          item.hasVariants ? (
            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "700", marginTop: 2 }}>L/H1/H2/H3/D/F</Text>
          ) : null
        }
        addInput={
          <>
            <TextInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="New category name"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.chipBg, borderColor: colors.border, color: colors.text }]}
              testID="new-category-name"
              autoCapitalize="words"
            />
            <Pressable
              onPress={() => setNewCategoryHasVariants((v) => !v)}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, padding: 8 }}
              testID="new-category-has-variants"
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  backgroundColor: newCategoryHasVariants ? colors.primary : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {newCategoryHasVariants ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <Text style={{ color: colors.text, fontSize: 13 }}>Has design variants (L / H1 / H2 / H3 / D / F)</Text>
            </Pressable>
          </>
        }
        onAddPress={doAddCategory}
      />
    </Screen>
  );
}

function Label({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: -8 }}>
      {text}
    </Text>
  );
}

function PickerModal({
  visible,
  onClose,
  title,
  items,
  selectedId,
  onSelect,
  addInput,
  onAddPress,
  renderExtra,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: { id: string; name: string; hasVariants?: boolean }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  addLabel?: string;
  onAddNew?: () => void;
  addInput?: React.ReactNode;
  onAddPress?: () => void;
  renderExtra?: (item: any) => React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} testID="picker-close">
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ paddingBottom: 12 }}>
            {items.map((it) => {
              const active = it.id === selectedId;
              return (
                <Pressable
                  key={it.id}
                  onPress={() => onSelect(it.id)}
                  style={[
                    styles.pickerRow,
                    {
                      backgroundColor: active ? colors.primary + "15" : colors.chipBg,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  testID={`pick-${it.name}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: active ? colors.primary : colors.text, fontSize: 15, fontWeight: "700" }}>
                      {it.name}
                    </Text>
                    {renderExtra?.(it)}
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.addBox, { borderTopColor: colors.border }]}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
              Add New
            </Text>
            {addInput}
            <PrimaryButton
              label="Add"
              onPress={onAddPress || (() => {})}
              size="sm"
              testID="picker-add-new"
              style={{ marginTop: 8 }}
            />
          </View>
          <SafeAreaView edges={["bottom"]} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: "row", gap: 12, padding: 12, borderRadius: 20, borderWidth: 1, alignItems: "center" },
  photoBox: {
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  selector: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "600",
  },
  variantsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  variantInputCell: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 90,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#94A3B8",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
    opacity: 0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(148,163,184,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerRow: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  addBox: { paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
});

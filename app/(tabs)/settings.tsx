import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { useToast } from "@/src/components/Toast";
import {
  exportCSV,
  exportExcel,
  exportExcelTemplate,
  exportJSON,
  exportPDF,
  readExcelFromUri,
  readJsonFromUri,
} from "@/src/lib/export";
import {
  addProduct,
  clearAll,
  ensureSeeded,
  getCategories,
  getCompanies,
  logActivity,
  restoreBackup,
  saveCategories,
  saveCompanies,
} from "@/src/store/db";
import { Category, Company } from "@/src/store/types";
import { useTheme } from "@/src/theme/context";

export default function SettingsScreen() {
  const { colors, themePref, setThemePref, settings, setSettings } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [minStockDraft, setMinStockDraft] = useState(String(settings.defaultMinStock));
  const [confirmClear, setConfirmClear] = useState(false);

  const runExport = async (fn: () => Promise<string>, label: string, key: string) => {
    try {
      setBusy(key);
      await fn();
      await logActivity("Export", label);
      toast.show(`${label} exported`, "success");
    } catch (e: any) {
      toast.show(`Export failed: ${e?.message || e}`, "error");
    } finally {
      setBusy(null);
    }
  };

  const handleImportExcel = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "*/*",
        ],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      setBusy("import-excel");
      const uri = res.assets[0].uri;
      const rows = await readExcelFromUri(uri);
      const [companies, categories] = await Promise.all([getCompanies(), getCategories()]);
      const compMap = new Map(companies.map((c) => [c.name.toLowerCase(), c] as [string, Company]));
      const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c] as [string, Category]));

      let created = 0;
      let skipped = 0;
      for (const r of rows) {
        if (!r.company || !r.category || !r.model) {
          skipped++;
          continue;
        }
        let co = compMap.get(r.company.toLowerCase());
        if (!co) {
          co = {
            id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            name: r.company,
            createdAt: Date.now(),
          };
          companies.push(co);
          compMap.set(r.company.toLowerCase(), co);
        }
        let cat = catMap.get(r.category.toLowerCase());
        const isVariant =
          r.category.toLowerCase().includes("bathroom tile") ||
          r.category.toLowerCase().includes("kitchen tile");
        if (!cat) {
          cat = {
            id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            name: r.category,
            hasVariants: isVariant,
            createdAt: Date.now(),
          };
          categories.push(cat);
          catMap.set(r.category.toLowerCase(), cat);
        }
        const hasVariants = cat.hasVariants;
        await addProduct({
          companyId: co.id,
          categoryId: cat.id,
          size: r.size || "-",
          model: r.model,
          minStock: settings.defaultMinStock,
          ...(hasVariants
            ? {
                variants: {
                  L: r.L || 0,
                  H1: r.H1 || 0,
                  H2: r.H2 || 0,
                  H3: r.H3 || 0,
                  D: r.D || 0,
                  F: r.F || 0,
                },
              }
            : { total: r.total || 0 }),
        });
        created++;
      }
      await saveCompanies(companies);
      await saveCategories(categories);
      await logActivity("Import Excel", `${created} records imported`);
      toast.show(`Imported ${created} products (${skipped} skipped)`, "success");
    } catch (e: any) {
      toast.show(`Import failed: ${e?.message || e}`, "error");
    } finally {
      setBusy(null);
    }
  };

  const handleImportJSON = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "*/*"],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      setBusy("import-json");
      const data = await readJsonFromUri(res.assets[0].uri);
      await restoreBackup(data);
      await logActivity("Restore", "Backup restored from JSON");
      toast.show("Backup restored successfully", "success");
    } catch (e: any) {
      toast.show(`Restore failed: ${e?.message || e}`, "error");
    } finally {
      setBusy(null);
    }
  };

  const doClearAll = async () => {
    setConfirmClear(false);
    await clearAll();
    await ensureSeeded();
    toast.show("All data cleared. Defaults restored.", "warning");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="settings-screen">
      <SafeAreaView edges={["top"]}>
        <View style={{ padding: 16 }}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            Backup, restore, and preferences
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32, gap: 20 }}>
        {/* Data Management */}
        <Section title="Data Management">
          <Row
            icon="business"
            label="Companies"
            hint="Add, edit, delete companies"
            onPress={() => router.push("/companies")}
            testID="settings-companies"
          />
          <Row
            icon="albums"
            label="Categories"
            hint="Manage tile & sanitary categories"
            onPress={() => router.push("/categories")}
            testID="settings-categories"
          />
        </Section>

        {/* Export */}
        <Section title="Export">
          <Row
            icon="document-text"
            label="Export PDF Report"
            hint="Company-wise stock report"
            onPress={() => runExport(exportPDF, "PDF report", "pdf")}
            busy={busy === "pdf"}
            testID="settings-export-pdf"
          />
          <Row
            icon="grid"
            label="Export Excel"
            hint="Complete stock in .xlsx"
            onPress={() => runExport(exportExcel, "Excel", "excel")}
            busy={busy === "excel"}
            testID="settings-export-excel"
          />
          <Row
            icon="list"
            label="Export CSV"
            hint="Comma separated values"
            onPress={() => runExport(exportCSV, "CSV", "csv")}
            busy={busy === "csv"}
            testID="settings-export-csv"
          />
          <Row
            icon="cloud-download"
            label="Backup JSON"
            hint="Complete data snapshot for restore"
            onPress={() => runExport(exportJSON, "JSON backup", "json")}
            busy={busy === "json"}
            testID="settings-export-json"
          />
        </Section>

        {/* Import */}
        <Section title="Import & Restore">
          <Row
            icon="document-outline"
            label="Download Excel Template"
            hint="Sample .xlsx showing required columns"
            onPress={() => runExport(exportExcelTemplate, "Excel template", "template")}
            busy={busy === "template"}
            testID="settings-download-template"
          />
          <Row
            icon="cloud-upload"
            label="Import Excel"
            hint="Bulk add products from .xlsx"
            onPress={handleImportExcel}
            busy={busy === "import-excel"}
            testID="settings-import-excel"
          />
          <Row
            icon="refresh-circle"
            label="Restore Backup"
            hint="Restore from JSON snapshot"
            onPress={handleImportJSON}
            busy={busy === "import-json"}
            testID="settings-import-json"
          />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.rowInner}>
              <View style={[styles.iconBubble, { backgroundColor: colors.chipBg }]}>
                <Ionicons name="contrast" size={20} color={colors.text} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>Appearance</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {themePref === "system" ? "Follows device" : themePref === "dark" ? "Dark mode" : "Light mode"}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              {(["light", "dark", "system"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setThemePref(t)}
                  style={[
                    styles.themeChip,
                    {
                      backgroundColor: themePref === t ? colors.primary : colors.chipBg,
                      borderColor: themePref === t ? colors.primary : colors.border,
                    },
                  ]}
                  testID={`theme-${t}`}
                >
                  <Text style={{ color: themePref === t ? "#fff" : colors.text, fontWeight: "700", fontSize: 13 }}>
                    {t === "light" ? "Light" : t === "dark" ? "Dark" : "Auto"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 10 }]}>
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>Low Stock Threshold</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
              Alert when a product&apos;s stock drops below this value
            </Text>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginTop: 10 }}>
              <TextInput
                value={minStockDraft}
                onChangeText={(t) => setMinStockDraft(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                style={[
                  styles.numberInput,
                  { backgroundColor: colors.chipBg, borderColor: colors.border, color: colors.text },
                ]}
                testID="min-stock-input"
              />
              <PrimaryButton
                label="Save"
                size="sm"
                onPress={async () => {
                  const v = parseInt(minStockDraft || "0", 10);
                  await setSettings({ ...settings, defaultMinStock: v });
                  toast.show(`Low stock threshold set to ${v}`, "success");
                }}
                testID="min-stock-save"
              />
            </View>
          </View>

          <Row
            icon="lock-closed"
            label="Change PIN"
            hint="Update your app unlock PIN"
            onPress={() => router.push({ pathname: "/pin", params: { mode: "change" } })}
            testID="settings-change-pin"
          />
        </Section>

        {/* Danger */}
        <Section title="Danger Zone">
          <Pressable
            onPress={() => setConfirmClear(true)}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.danger }]}
            testID="settings-clear-all"
          >
            <View style={styles.rowInner}>
              <View style={[styles.iconBubble, { backgroundColor: colors.danger + "20" }]}>
                <Ionicons name="trash" size={20} color={colors.danger} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.danger, fontWeight: "700", fontSize: 15 }}>Clear All Data</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  Removes all products and history. Default companies & categories restored.
                </Text>
              </View>
            </View>
          </Pressable>
        </Section>

        <View style={{ padding: 16, alignItems: "center" }}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>Sri Venkateswara Traders • v1.0</Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
            Owner: {settings.ownerName}
          </Text>
        </View>
      </ScrollView>

      {/* Confirm modal */}
      <Modal visible={confirmClear} transparent animationType="fade" onRequestClose={() => setConfirmClear(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconBubble, { backgroundColor: colors.danger + "20", width: 56, height: 56, borderRadius: 28 }]}>
              <Ionicons name="warning" size={28} color={colors.danger} />
            </View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 12 }}>
              Clear all data?
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center", marginTop: 8 }}>
              This will delete every product and stock history. This action cannot be undone.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20, width: "100%" }}>
              <PrimaryButton
                label="Cancel"
                variant="outline"
                onPress={() => setConfirmClear(false)}
                style={{ flex: 1 }}
                testID="confirm-cancel"
              />
              <PrimaryButton
                label="Yes, Clear"
                variant="danger"
                onPress={doClearAll}
                style={{ flex: 1 }}
                testID="confirm-clear"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8, paddingHorizontal: 4 }}>
        {title}
      </Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function Row({ icon, label, hint, onPress, testID, busy }: any) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.85 },
        busy && { opacity: 0.6 },
      ]}
      testID={testID}
    >
      <View style={styles.rowInner}>
        <View style={[styles.iconBubble, { backgroundColor: colors.chipBg }]}>
          <Ionicons name={icon} size={20} color={colors.text} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>{label}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
            {hint}
          </Text>
        </View>
        <Ionicons name={busy ? "hourglass" : "chevron-forward"} size={20} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  card: { padding: 14, borderRadius: 20, borderWidth: 1 },
  rowInner: { flexDirection: "row", alignItems: "center" },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  themeChip: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  numberInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
  },
});

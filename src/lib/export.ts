import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";

import { getCategories, getCompanies, getProducts, exportBackup } from "@/src/store/db";
import { VARIANT_KEYS } from "@/src/store/types";

async function shareFile(uri: string, mimeType: string, dialogTitle: string) {
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle, UTI: mimeType });
  }
}

interface RowInput {
  company: string;
  category: string;
  size: string;
  model: string;
  L: number;
  H1: number;
  H2: number;
  H3: number;
  D: number;
  F: number;
  total: number;
}

async function buildRows(): Promise<RowInput[]> {
  const [companies, categories, products] = await Promise.all([
    getCompanies(),
    getCategories(),
    getProducts(),
  ]);
  const compMap = new Map(companies.map((c) => [c.id, c.name]));
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return products.map((p) => {
    const cat = catMap.get(p.categoryId);
    const isVar = !!cat?.hasVariants && !!p.variants;
    const v = p.variants || { L: 0, H1: 0, H2: 0, H3: 0, D: 0, F: 0 };
    const total = isVar
      ? VARIANT_KEYS.reduce((s, k) => s + (v[k] || 0), 0)
      : p.total || 0;
    return {
      company: compMap.get(p.companyId) || "-",
      category: cat?.name || "-",
      size: p.size,
      model: p.model,
      L: isVar ? v.L : 0,
      H1: isVar ? v.H1 : 0,
      H2: isVar ? v.H2 : 0,
      H3: isVar ? v.H3 : 0,
      D: isVar ? v.D : 0,
      F: isVar ? v.F : 0,
      total,
    };
  });
}

export async function exportExcel(): Promise<string> {
  const rows = await buildRows();
  const sheetData = [
    ["Company", "Category", "Size", "Model", "L", "H1", "H2", "H3", "D", "F", "Total"],
    ...rows.map((r) => [
      r.company,
      r.category,
      r.size,
      r.model,
      r.L,
      r.H1,
      r.H2,
      r.H3,
      r.D,
      r.F,
      r.total,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 12 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stock");
  const b64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const filename = `SVT_Stock_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const uri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
  await shareFile(
    uri,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Export Stock (Excel)"
  );
  return uri;
}

export async function exportCSV(): Promise<string> {
  const rows = await buildRows();
  const header = "Company,Category,Size,Model,L,H1,H2,H3,D,F,Total";
  const escape = (s: any) => {
    const str = String(s ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const body = rows
    .map((r) =>
      [r.company, r.category, r.size, r.model, r.L, r.H1, r.H2, r.H3, r.D, r.F, r.total]
        .map(escape)
        .join(",")
    )
    .join("\n");
  const csv = header + "\n" + body;
  const filename = `SVT_Stock_${new Date().toISOString().slice(0, 10)}.csv`;
  const uri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  await shareFile(uri, "text/csv", "Export Stock (CSV)");
  return uri;
}

export async function exportJSON(): Promise<string> {
  const backup = await exportBackup();
  const filename = `SVT_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  const uri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await shareFile(uri, "application/json", "Backup (JSON)");
  return uri;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function exportPDF(): Promise<string> {
  const rows = await buildRows();
  const byCompany: Record<string, RowInput[]> = {};
  rows.forEach((r) => {
    if (!byCompany[r.company]) byCompany[r.company] = [];
    byCompany[r.company].push(r);
  });

  let grand = 0;
  const now = new Date();

  let sections = "";
  Object.keys(byCompany)
    .sort()
    .forEach((co) => {
      const items = byCompany[co];
      const compTotal = items.reduce((s, r) => s + r.total, 0);
      grand += compTotal;
      const trs = items
        .map(
          (r) => `<tr>
        <td>${escapeHtml(r.category)}</td>
        <td>${escapeHtml(r.size)}</td>
        <td><b>${escapeHtml(r.model)}</b></td>
        <td class="n">${r.L || "-"}</td>
        <td class="n">${r.H1 || "-"}</td>
        <td class="n">${r.H2 || "-"}</td>
        <td class="n">${r.H3 || "-"}</td>
        <td class="n">${r.D || "-"}</td>
        <td class="n">${r.F || "-"}</td>
        <td class="n bold">${r.total}</td>
      </tr>`
        )
        .join("");
      sections += `
      <div class="section">
        <h2>${escapeHtml(co)}</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th><th>Size</th><th>Model</th>
              <th>L</th><th>H1</th><th>H2</th><th>H3</th><th>D</th><th>F</th><th>Total</th>
            </tr>
          </thead>
          <tbody>${trs}</tbody>
          <tfoot>
            <tr>
              <td colspan="9" class="right"><b>Company Total</b></td>
              <td class="n bold">${compTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;
    });

  const html = `<!DOCTYPE html>
  <html><head><meta charset="utf-8"/>
  <style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;padding:24px;color:#0F172A;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2563EB;padding-bottom:12px;margin-bottom:20px;}
    .brand{font-size:22px;font-weight:800;color:#2563EB;letter-spacing:0.5px;}
    .owner{font-size:13px;color:#64748B;margin-top:4px;}
    .meta{font-size:11px;color:#64748B;text-align:right;}
    .section{margin-bottom:24px;page-break-inside:avoid;}
    h2{font-size:16px;background:#EFF6FF;color:#1E40AF;padding:8px 12px;border-radius:8px;margin:0 0 8px;}
    table{width:100%;border-collapse:collapse;font-size:11px;}
    th,td{border:1px solid #E2E8F0;padding:6px 8px;text-align:left;}
    th{background:#F1F5F9;font-weight:700;color:#334155;}
    .n{text-align:right;}
    .right{text-align:right;}
    .bold{font-weight:700;}
    tfoot td{background:#F8FAFC;}
    .grand{margin-top:16px;padding:14px 16px;background:linear-gradient(135deg,#2563EB,#4338CA);color:#fff;border-radius:12px;font-size:16px;font-weight:800;display:flex;justify-content:space-between;}
  </style></head>
  <body>
    <div class="header">
      <div>
        <div class="brand">SRI VENKATESWARA TRADERS</div>
        <div class="owner">Owner: Daivala Nagaraju &middot; Tile &amp; Sanitary Stock Report</div>
      </div>
      <div class="meta">
        Date: ${now.toLocaleDateString()}<br/>
        Time: ${now.toLocaleTimeString()}<br/>
        Total Records: ${rows.length}
      </div>
    </div>
    ${sections || '<p style="text-align:center;color:#64748B;">No stock records available.</p>'}
    <div class="grand"><span>Grand Total Stock</span><span>${grand} Boxes</span></div>
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const filename = `SVT_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  const dest = FileSystem.documentDirectory + filename;
  try {
    await FileSystem.moveAsync({ from: uri, to: dest });
  } catch {
    // fallback: use original uri if move fails
  }
  const finalUri = (await FileSystem.getInfoAsync(dest)).exists ? dest : uri;
  await shareFile(finalUri, "application/pdf", "Stock Report (PDF)");
  return finalUri;
}

export async function exportExcelTemplate(): Promise<string> {
  const sheetData = [
    ["Company", "Category", "Size", "Model", "L", "H1", "H2", "H3", "D", "F", "Total"],
    ["EMBOZA", "Bathroom Tiles", "12x18", "9032", 15, 6, 0, 0, 1, 8, 30],
    ["Kajaria", "Kitchen Tiles", "12x18", "7112", 10, 4, 0, 0, 0, 6, 20],
    ["ASTA", "Parking Tiles", "16x16", "7210", 0, 0, 0, 0, 0, 0, 208],
    ["Somany", "Commodes", "-", "CM-2210", 0, 0, 0, 0, 0, 0, 12],
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 12 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Stock");
  const b64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const filename = "SVT_Import_Template.xlsx";
  const uri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
  await shareFile(
    uri,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Excel Import Template"
  );
  return uri;
}

// ---- Import ----
export interface ImportRow {
  company: string;
  category: string;
  size: string;
  model: string;
  L?: number;
  H1?: number;
  H2?: number;
  H3?: number;
  D?: number;
  F?: number;
  total?: number;
}

// Normalise header keys — accept many aliases (case, spaces, common variants).
function normKey(k: string) {
  return String(k).toLowerCase().replace(/[\s_-]+/g, "");
}

function pick(row: any, keys: string[]): any {
  const map: Record<string, any> = {};
  for (const k of Object.keys(row)) map[normKey(k)] = row[k];
  for (const alias of keys) {
    const v = map[normKey(alias)];
    if (v !== undefined && v !== "") return v;
  }
  return "";
}

function toNum(v: any): number {
  const n = parseInt(String(v || "0").replace(/[^0-9-]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

async function fetchArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  return await res.arrayBuffer();
}

async function fetchText(uri: string): Promise<string> {
  const res = await fetch(uri);
  return await res.text();
}

export async function readExcelFromUri(uri: string): Promise<ImportRow[]> {
  const buf = await fetchArrayBuffer(uri);
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error("Excel file has no sheets");
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows.map((r) => ({
    company: String(pick(r, ["Company", "Company Name", "Brand"])).trim(),
    category: String(pick(r, ["Category", "Type"])).trim(),
    size: String(pick(r, ["Size", "Dimension"])).trim(),
    model: String(pick(r, ["Model", "Model Number", "Design", "Code"])).trim(),
    L: toNum(pick(r, ["L"])),
    H1: toNum(pick(r, ["H1"])),
    H2: toNum(pick(r, ["H2"])),
    H3: toNum(pick(r, ["H3"])),
    D: toNum(pick(r, ["D"])),
    F: toNum(pick(r, ["F"])),
    total: toNum(pick(r, ["Total", "Stock", "Quantity", "Qty", "Boxes"])),
  }));
}

export async function readJsonFromUri(uri: string): Promise<any> {
  const raw = await fetchText(uri);
  return JSON.parse(raw);
}

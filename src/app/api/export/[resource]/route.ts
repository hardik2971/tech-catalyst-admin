import ExcelJS from "exceljs";
import { handler, HttpError, logActivity } from "@/lib/api";
import { listRows, parseListParams, type Row } from "@/lib/crud";
import { getResource } from "@/lib/resources";

const fmt = (v: unknown): string => {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(String).join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const human = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();

/**
 * GET /api/export/:resource — Excel export honouring the same filters as the list
 * (search, status, date range…). Survey payloads are flattened into columns,
 * matching the website's existing /api/survey-export format.
 */
export const GET = handler<{ resource: string }>(
  async (req, { params, session }) => {
    const r = getResource(params.resource);
    if (!r) throw new HttpError(404, "Unknown resource");

    const listParams = { ...parseListParams(new URL(req.url)), pageSize: "all" as const, page: 1 };
    const { data } = await listRows(r, listParams);

    const keys: string[] = ["id", "createdAt"];
    if (r.metaType) keys.push("status", "notes");
    keys.push(...Object.keys(r.columns).filter((k) => k !== "payload"));
    if (r.name === "activity") keys.push("adminName", "action", "entity", "entityId", "details");

    const payloadKeys = new Set<string>();
    if (r.name === "surveys") {
      for (const row of data) Object.keys((row.payload as Row) || {}).forEach((k) => payloadKeys.add(k));
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = "Tech Catalyst Summit Admin";
    wb.created = new Date();
    const sheet = wb.addWorksheet(r.label.slice(0, 31));
    sheet.columns = [
      ...keys.map((k) => ({ header: human(k), key: k, width: k === "id" ? 38 : 24 })),
      ...[...payloadKeys].map((k) => ({ header: human(k), key: `p_${k}`, width: 28 })),
    ];
    for (const row of data) {
      const out: Record<string, string> = {};
      for (const k of keys) out[k] = fmt(row[k]);
      for (const k of payloadKeys) out[`p_${k}`] = fmt((row.payload as Row)?.[k]);
      sheet.addRow(out);
    }
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E3CAD" } };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await wb.xlsx.writeBuffer();
    await logActivity(session, "export", r.label, null, `Exported ${data.length} ${r.label.toLowerCase()} record(s)`);
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${r.name}-${stamp}.xlsx"`,
      },
    });
  },
  { roles: ["super_admin", "admin"] },
);

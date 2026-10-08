import { randomUUID } from "crypto";
import { execute, q, query, queryOne } from "./db";
import { HttpError } from "./api";
import type { ResourceDef } from "./resources";

export type Row = Record<string, unknown>;
export type ListParams = {
  q?: string;
  page?: number;
  pageSize?: number | "all";
  sort?: string;
  order?: string;
  from?: string;
  to?: string;
  filters?: Record<string, string>;
};

const parseJson = (v: unknown) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

/** DB row → API shape (booleans, parsed JSON, ISO dates). */
export function serialize(r: ResourceDef, row: Row): Row {
  const out: Row = { ...row };
  for (const [key, col] of Object.entries(r.columns)) {
    if (!(key in out)) continue;
    if (col.type === "bool") out[key] = Boolean(Number(out[key]));
    else if (col.type === "json") out[key] = parseJson(out[key]) ?? null;
  }
  for (const [k, v] of Object.entries(out)) {
    if (v instanceof Date) out[k] = isNaN(v.getTime()) ? null : v.toISOString();
  }
  if ("payload" in out) out.payload = parseJson(out.payload) ?? {};
  return out;
}

/** API input → DB values, validating against the column definitions. */
function toDbValues(r: ResourceDef, input: Row, isCreate: boolean): Row {
  let data: Row = {};
  for (const [key, col] of Object.entries(r.columns)) {
    if (!(key in input)) continue;
    let v = input[key];
    if (v === undefined) continue;
    if (v === "" && col.type !== "string" && col.type !== "text") v = null;
    switch (col.type) {
      case "bool":
        v = v === true || v === 1 || v === "1" || v === "true" ? 1 : 0;
        break;
      case "int":
        v = v == null ? 0 : Math.trunc(Number(v));
        if (Number.isNaN(v)) throw new HttpError(400, `${key} must be a number`);
        break;
      case "json":
        v = JSON.stringify(v ?? []);
        break;
      case "datetime":
        if (v != null) {
          const d = new Date(String(v));
          if (isNaN(d.getTime())) throw new HttpError(400, `${key} is not a valid date`);
          v = d;
        }
        break;
      case "enum":
        if (v != null && col.values && !col.values.includes(String(v))) {
          throw new HttpError(400, `${key} must be one of: ${col.values.join(", ")}`);
        }
        break;
      default:
        v = v == null ? null : String(v).trim();
        if (col.max && typeof v === "string" && v.length > col.max) {
          throw new HttpError(400, `${key} must be at most ${col.max} characters`);
        }
    }
    data[key] = v;
  }
  if (r.prepare) data = r.prepare(data, isCreate);
  const required = Object.entries(r.columns).filter(([, c]) => c.required).map(([k]) => k);
  for (const key of required) {
    if ((isCreate || key in data) && (data[key] == null || data[key] === "")) {
      throw new HttpError(400, `${key} is required`);
    }
  }
  return data;
}

function baseSelect(r: ResourceDef) {
  if (r.metaType) {
    return {
      select: `SELECT t.*, COALESCE(m.status, 'new') AS status, m.notes AS notes FROM ${q(r.table)} t
               LEFT JOIN AdminRecordMeta m ON m.recordType = ? AND m.recordId = t.id`,
      params: [r.metaType] as unknown[],
    };
  }
  return { select: `SELECT t.* FROM ${q(r.table)} t`, params: [] as unknown[] };
}

export async function listRows(r: ResourceDef, p: ListParams) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (p.q?.trim()) {
    const like = `%${p.q.trim()}%`;
    where.push(`(${r.search.map((s) => `${s} LIKE ?`).join(" OR ")})`);
    params.push(...r.search.map(() => like));
  }
  for (const [key, value] of Object.entries(p.filters ?? {})) {
    if (!r.filters?.includes(key) || value === "" || value === "all") continue;
    if (key === "status" && r.metaType) {
      where.push("COALESCE(m.status, 'new') = ?");
    } else {
      where.push(`t.${q(key)} = ?`);
    }
    params.push(r.columns[key]?.type === "bool" ? (value === "true" || value === "1" ? 1 : 0) : value);
  }
  if (p.from) {
    where.push("t.createdAt >= ?");
    params.push(new Date(p.from));
  }
  if (p.to) {
    const to = new Date(p.to);
    to.setUTCHours(23, 59, 59, 999);
    where.push("t.createdAt <= ?");
    params.push(to);
  }

  const { select, params: baseParams } = baseSelect(r);
  const whereSql = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  const sortKey = p.sort && r.sortable.includes(p.sort) ? p.sort : r.defaultSort[0];
  const order = p.order?.toUpperCase() === "ASC" ? "ASC" : p.order?.toUpperCase() === "DESC" ? "DESC" : r.defaultSort[1];
  const sortExpr = sortKey === "status" && r.metaType ? "status" : `t.${q(sortKey)}`;

  const countSql = `SELECT COUNT(*) AS total FROM (${select}${whereSql}) x`;
  const [{ total }] = await query<{ total: number }>(countSql, [...baseParams, ...params]);

  let sql = `${select}${whereSql} ORDER BY ${sortExpr} ${order}, t.id ASC`;
  const all = p.pageSize === "all";
  const pageSize = all ? Number(total) : Math.min(Math.max(Number(p.pageSize) || 20, 1), 200);
  const page = Math.max(Number(p.page) || 1, 1);
  if (!all) {
    sql += " LIMIT ? OFFSET ?";
    params.push(pageSize, (page - 1) * pageSize);
  }
  const rows = await query<Row>(sql, [...baseParams, ...params]);
  return { data: rows.map((row) => serialize(r, row)), total: Number(total), page, pageSize };
}

export async function getRow(r: ResourceDef, id: string) {
  const { select, params } = baseSelect(r);
  const row = await queryOne<Row>(`${select} WHERE t.id = ?`, [...params, id]);
  if (!row) throw new HttpError(404, `${r.label} not found`);
  return serialize(r, row);
}

export async function createRow(r: ResourceDef, input: Row) {
  const data = toDbValues(r, input, true);
  const id = randomUUID();
  const cols: Row = { id, ...data };
  if (r.websiteTable) cols.createdAt = new Date();
  const keys = Object.keys(cols);
  await execute(
    `INSERT INTO ${q(r.table)} (${keys.map(q).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
    keys.map((k) => cols[k]),
  );
  await saveMeta(r, id, input);
  return getRow(r, id);
}

export async function updateRow(r: ResourceDef, id: string, input: Row) {
  await getRow(r, id); // 404 if missing
  const data = toDbValues(r, input, false);
  const keys = Object.keys(data);
  if (keys.length) {
    await execute(`UPDATE ${q(r.table)} SET ${keys.map((k) => `${q(k)} = ?`).join(", ")} WHERE id = ?`, [
      ...keys.map((k) => data[k]),
      id,
    ]);
  }
  await saveMeta(r, id, input);
  return getRow(r, id);
}

export async function deleteRows(r: ResourceDef, ids: string[]) {
  if (!ids.length) return 0;
  const res = await execute(`DELETE FROM ${q(r.table)} WHERE id IN (?)`, [ids]);
  if (r.metaType) {
    await execute("DELETE FROM AdminRecordMeta WHERE recordType = ? AND recordId IN (?)", [r.metaType, ids]);
  }
  return res.affectedRows;
}

async function saveMeta(r: ResourceDef, id: string, input: Row) {
  if (!r.metaType || !("status" in input || "notes" in input)) return;
  const current = await queryOne<{ status: string; notes: string | null }>(
    "SELECT status, notes FROM AdminRecordMeta WHERE recordType = ? AND recordId = ?",
    [r.metaType, id],
  );
  const status = "status" in input ? String(input.status || "new") : current?.status ?? "new";
  const notes = "notes" in input ? (input.notes == null ? null : String(input.notes)) : current?.notes ?? null;
  await execute(
    `INSERT INTO AdminRecordMeta (recordType, recordId, status, notes) VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes)`,
    [r.metaType, id, status.slice(0, 30), notes],
  );
}

export function parseListParams(url: URL): ListParams {
  const sp = url.searchParams;
  const reserved = new Set(["q", "page", "pageSize", "sort", "order", "from", "to"]);
  const filters: Record<string, string> = {};
  sp.forEach((v, k) => {
    if (!reserved.has(k)) filters[k] = v;
  });
  return {
    q: sp.get("q") ?? undefined,
    page: Number(sp.get("page") || 1),
    pageSize: sp.get("pageSize") === "all" ? "all" : Number(sp.get("pageSize") || 20),
    sort: sp.get("sort") ?? undefined,
    order: sp.get("order") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    filters,
  };
}

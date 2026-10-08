import { handler, HttpError, logActivity, readJson } from "@/lib/api";
import { createRow, deleteRows, listRows, parseListParams } from "@/lib/crud";
import { getResource } from "@/lib/resources";

type P = { resource: string };

function resolve(name: string) {
  const r = getResource(name);
  if (!r) throw new HttpError(404, `Unknown resource "${name}"`);
  return r;
}

/** GET /api/r/:resource?q=&page=&pageSize=&sort=&order=&from=&to=&<filter>= */
export const GET = handler<P>(async (req, { params }) => {
  const r = resolve(params.resource);
  return listRows(r, parseListParams(new URL(req.url)));
});

export const POST = handler<P>(async (req, { params, session }) => {
  const r = resolve(params.resource);
  if (!r.create) throw new HttpError(405, `${r.label} records can't be created here`);
  if (r.writeRoles && !r.writeRoles.includes(session.role)) throw new HttpError(403, "Not allowed");
  const row = await createRow(r, await readJson(req));
  await logActivity(session, "create", r.label, String(row.id), `Created ${r.label.toLowerCase()} "${row[r.titleField] ?? ""}"`);
  return row;
});

/** Bulk delete: DELETE /api/r/:resource  body { ids: string[] } */
export const DELETE = handler<P>(async (req, { params, session }) => {
  const r = resolve(params.resource);
  if (!r.remove) throw new HttpError(405, "Delete is not supported");
  if (r.deleteRoles && !r.deleteRoles.includes(session.role)) throw new HttpError(403, "Not allowed");
  const { ids } = await readJson<{ ids?: string[] }>(req);
  if (!Array.isArray(ids) || !ids.length) throw new HttpError(400, "ids are required");
  const deleted = await deleteRows(r, ids.map(String));
  await logActivity(session, "delete", r.label, null, `Deleted ${deleted} ${r.label.toLowerCase()} record(s)`);
  return { success: true, deleted };
});

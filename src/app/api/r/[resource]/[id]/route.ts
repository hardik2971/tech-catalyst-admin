import { handler, HttpError, logActivity, readJson } from "@/lib/api";
import { deleteRows, getRow, updateRow } from "@/lib/crud";
import { getResource } from "@/lib/resources";

type P = { resource: string; id: string };

function resolve(name: string) {
  const r = getResource(name);
  if (!r) throw new HttpError(404, `Unknown resource "${name}"`);
  return r;
}

export const GET = handler<P>(async (_req, { params }) => getRow(resolve(params.resource), params.id));

export const PUT = handler<P>(async (req, { params, session }) => {
  const r = resolve(params.resource);
  if (!r.update) throw new HttpError(405, "Update is not supported");
  if (r.writeRoles && !r.writeRoles.includes(session.role)) throw new HttpError(403, "Not allowed");
  const body = await readJson(req);
  const row = await updateRow(r, params.id, body);
  const what = "status" in body && Object.keys(body).length <= 2 ? `status → ${body.status}` : "details";
  await logActivity(session, "update", r.label, params.id, `Updated ${r.label.toLowerCase()} "${row[r.titleField] ?? ""}" (${what})`);
  return row;
});

export const DELETE = handler<P>(async (_req, { params, session }) => {
  const r = resolve(params.resource);
  if (!r.remove) throw new HttpError(405, "Delete is not supported");
  if (r.deleteRoles && !r.deleteRoles.includes(session.role)) throw new HttpError(403, "Not allowed");
  const row = await getRow(r, params.id);
  await deleteRows(r, [params.id]);
  await logActivity(session, "delete", r.label, params.id, `Deleted ${r.label.toLowerCase()} "${row[r.titleField] ?? ""}"`);
  return { success: true };
});

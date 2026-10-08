import { handler, HttpError, logActivity, readJson } from "@/lib/api";
import { execute, query } from "@/lib/db";

export const GET = handler(async () => {
  const rows = await query<{ key: string; value: string | null }>("SELECT `key`, value FROM SiteSetting ORDER BY `key`");
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
});

export const PUT = handler(
  async (req, { session }) => {
    const body = await readJson<Record<string, unknown>>(req);
    const entries = Object.entries(body).filter(([k]) => /^[A-Za-z0-9_.-]{1,100}$/.test(k));
    if (!entries.length) throw new HttpError(400, "No settings provided");
    for (const [key, value] of entries) {
      await execute(
        "INSERT INTO SiteSetting (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
        [key, value == null ? null : String(value)],
      );
    }
    await logActivity(session, "update", "Settings", null, `Updated ${entries.map(([k]) => k).join(", ")}`.slice(0, 500));
    return { success: true };
  },
  { roles: ["super_admin", "admin"] },
);

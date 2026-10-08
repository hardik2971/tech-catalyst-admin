import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { handler, HttpError, logActivity, readJson } from "@/lib/api";
import { execute, query, queryOne } from "@/lib/db";

const ROLES = ["super_admin", "admin", "editor"];
const PUBLIC_COLS = "id, name, email, role, isActive, lastLoginAt, createdAt, updatedAt";

export const GET = handler(
  async () => {
    const rows = await query<Record<string, unknown>>(`SELECT ${PUBLIC_COLS} FROM AdminUser ORDER BY createdAt ASC`);
    return { data: rows.map((r) => ({ ...r, isActive: Boolean(r.isActive) })), total: rows.length };
  },
  { roles: ["super_admin"] },
);

export const POST = handler(
  async (req, { session }) => {
    const b = await readJson<{ name?: string; email?: string; password?: string; role?: string; isActive?: boolean }>(req);
    const name = b.name?.trim();
    const email = b.email?.trim().toLowerCase();
    if (!name || !email) throw new HttpError(400, "Name and email are required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Invalid email address");
    if (!b.password || b.password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");
    const role = ROLES.includes(String(b.role)) ? String(b.role) : "admin";
    const id = randomUUID();
    await execute("INSERT INTO AdminUser (id, name, email, passwordHash, role, isActive) VALUES (?,?,?,?,?,?)", [
      id, name, email, await bcrypt.hash(b.password, 10), role, b.isActive === false ? 0 : 1,
    ]);
    await logActivity(session, "create", "Admin user", id, `Created admin ${email} (${role})`);
    return queryOne(`SELECT ${PUBLIC_COLS} FROM AdminUser WHERE id = ?`, [id]);
  },
  { roles: ["super_admin"] },
);

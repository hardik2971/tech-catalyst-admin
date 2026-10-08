import bcrypt from "bcryptjs";
import { handler, HttpError, logActivity, readJson } from "@/lib/api";
import { execute, queryOne } from "@/lib/db";

const ROLES = ["super_admin", "admin", "editor"];
type P = { id: string };

async function superAdminCount() {
  const r = await queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM AdminUser WHERE role = 'super_admin' AND isActive = 1");
  return Number(r?.c ?? 0);
}

export const PUT = handler<P>(
  async (req, { params, session }) => {
    const target = await queryOne<{ role: string; isActive: number; email: string }>(
      "SELECT role, isActive, email FROM AdminUser WHERE id = ?",
      [params.id],
    );
    if (!target) throw new HttpError(404, "Admin not found");
    const b = await readJson<{ name?: string; email?: string; password?: string; role?: string; isActive?: boolean }>(req);

    const demoting =
      target.role === "super_admin" && target.isActive &&
      ((b.role && b.role !== "super_admin") || b.isActive === false);
    if (demoting && (await superAdminCount()) <= 1) {
      throw new HttpError(400, "At least one active super admin is required");
    }

    const sets: string[] = [];
    const vals: unknown[] = [];
    if (b.name?.trim()) { sets.push("name = ?"); vals.push(b.name.trim()); }
    if (b.email?.trim()) { sets.push("email = ?"); vals.push(b.email.trim().toLowerCase()); }
    if (b.role && ROLES.includes(b.role)) { sets.push("role = ?"); vals.push(b.role); }
    if (typeof b.isActive === "boolean") { sets.push("isActive = ?"); vals.push(b.isActive ? 1 : 0); }
    if (b.password) {
      if (b.password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");
      sets.push("passwordHash = ?");
      vals.push(await bcrypt.hash(b.password, 10));
    }
    if (sets.length) await execute(`UPDATE AdminUser SET ${sets.join(", ")} WHERE id = ?`, [...vals, params.id]);
    await logActivity(session, "update", "Admin user", params.id, `Updated admin ${target.email}`);
    return queryOne("SELECT id, name, email, role, isActive, lastLoginAt, createdAt FROM AdminUser WHERE id = ?", [params.id]);
  },
  { roles: ["super_admin"] },
);

export const DELETE = handler<P>(
  async (_req, { params, session }) => {
    if (params.id === session.id) throw new HttpError(400, "You can't delete your own account");
    const target = await queryOne<{ role: string; email: string }>("SELECT role, email FROM AdminUser WHERE id = ?", [params.id]);
    if (!target) throw new HttpError(404, "Admin not found");
    if (target.role === "super_admin" && (await superAdminCount()) <= 1) {
      throw new HttpError(400, "At least one active super admin is required");
    }
    await execute("DELETE FROM AdminUser WHERE id = ?", [params.id]);
    await logActivity(session, "delete", "Admin user", params.id, `Deleted admin ${target.email}`);
    return { success: true };
  },
  { roles: ["super_admin"] },
);

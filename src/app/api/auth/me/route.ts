import bcrypt from "bcryptjs";
import { handler, HttpError, logActivity, readJson } from "@/lib/api";
import { execute, queryOne } from "@/lib/db";

export const GET = handler(async (_req, { session }) => {
  const user = await queryOne(
    "SELECT id, name, email, role, lastLoginAt, createdAt FROM AdminUser WHERE id = ?",
    [session.id],
  );
  return { user };
});

/** Update own profile (name / email) and optionally change password. */
export const PUT = handler(async (req, { session }) => {
  const body = await readJson<{ name?: string; email?: string; currentPassword?: string; newPassword?: string }>(req);
  const user = await queryOne<{ passwordHash: string }>("SELECT passwordHash FROM AdminUser WHERE id = ?", [session.id]);
  if (!user) throw new HttpError(404, "User not found");

  const sets: string[] = [];
  const params: unknown[] = [];
  if (body.name?.trim()) {
    sets.push("name = ?");
    params.push(body.name.trim());
  }
  if (body.email?.trim()) {
    sets.push("email = ?");
    params.push(body.email.trim().toLowerCase());
  }
  if (body.newPassword) {
    if (!body.currentPassword || !(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
      throw new HttpError(400, "Current password is incorrect");
    }
    if (body.newPassword.length < 8) throw new HttpError(400, "New password must be at least 8 characters");
    sets.push("passwordHash = ?");
    params.push(await bcrypt.hash(body.newPassword, 10));
  }
  if (sets.length) {
    await execute(`UPDATE AdminUser SET ${sets.join(", ")} WHERE id = ?`, [...params, session.id]);
    await logActivity(session, "update", "profile", session.id, body.newPassword ? "Changed password" : "Updated profile");
  }
  return { success: true };
});

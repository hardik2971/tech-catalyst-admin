import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { handler, HttpError, logActivity, readJson } from "@/lib/api";
import { execute, queryOne } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, type Role } from "@/lib/auth";

// Basic brute-force protection: 10 failed attempts per IP per 15 minutes.
const attempts = new Map<string, { count: number; until: number }>();
const WINDOW = 15 * 60 * 1000;

export const POST = handler(
  async (req) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const rec = attempts.get(ip);
    if (rec && rec.until > Date.now() && rec.count >= 10) {
      throw new HttpError(429, "Too many attempts. Try again in a few minutes.");
    }

    const { email, password } = await readJson<{ email?: string; password?: string }>(req);
    if (!email || !password) throw new HttpError(400, "Email and password are required");

    const user = await queryOne<{
      id: string; name: string; email: string; role: Role; passwordHash: string; isActive: number;
    }>("SELECT id, name, email, role, passwordHash, isActive FROM AdminUser WHERE email = ?", [
      email.trim().toLowerCase(),
    ]);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      const cur = rec && rec.until > Date.now() ? rec : { count: 0, until: Date.now() + WINDOW };
      attempts.set(ip, { count: cur.count + 1, until: cur.until });
      throw new HttpError(401, "Invalid email or password");
    }
    if (!user.isActive) throw new HttpError(403, "This account has been deactivated");
    attempts.delete(ip);

    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = await signSession(session);
    await execute("UPDATE AdminUser SET lastLoginAt = ? WHERE id = ?", [new Date(), user.id]);
    await logActivity(session, "login", "auth", user.id, `${user.email} signed in`);

    const res = NextResponse.json({ user: session });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  },
  { public: true },
);

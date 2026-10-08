import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "tcs_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "super_admin" | "admin" | "editor";

export type Session = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

function secret() {
  const s = process.env.ADMIN_JWT_SECRET || process.env.SECRET_KEY;
  if (!s) throw new Error("ADMIN_JWT_SECRET is not configured");
  return new TextEncoder().encode(s);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { SESSION_COOKIE, verifySession, type Role, type Session } from "./auth";
import { execute, queryOne } from "./db";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Ctx<P> = { session: Session; params: P };
type Options = { roles?: Role[]; public?: boolean };

/**
 * Wraps a route handler with: session check (re-validated against the DB so
 * deactivated admins are locked out immediately), role check, JSON response
 * and consistent error shape `{ message }`.
 */
export function handler<P = Record<string, string>>(
  fn: (req: NextRequest, ctx: Ctx<P>) => Promise<unknown>,
  opts: Options = {},
) {
  return async (req: NextRequest, route: { params: Promise<P> }) => {
    try {
      let session = null as Session | null;
      if (!opts.public) {
        session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
        if (!session) throw new HttpError(401, "Please sign in");
        const user = await queryOne<{ role: Role; isActive: number; name: string }>(
          "SELECT role, isActive, name FROM AdminUser WHERE id = ?",
          [session.id],
        );
        if (!user || !user.isActive) throw new HttpError(401, "Your account is inactive");
        session = { ...session, role: user.role, name: user.name };
        if (opts.roles && !opts.roles.includes(session.role)) {
          throw new HttpError(403, "You don't have permission for this action");
        }
      }
      const params = (route?.params ? await route.params : {}) as P;
      const result = await fn(req, { session: session as Session, params });
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { success: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ message: err.message }, { status: err.status });
  }
  const e = err as { code?: string; message?: string };
  if (e?.code === "ER_DUP_ENTRY") {
    return NextResponse.json({ message: "A record with the same unique value already exists" }, { status: 409 });
  }
  if (e?.code === "ETIMEDOUT" || e?.code === "ECONNREFUSED" || e?.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("[db]", err);
    return NextResponse.json({ message: `Database connection failed (${e.code})` }, { status: 503 });
  }
  console.error("[api]", err);
  return NextResponse.json({ message: e?.message || "Something went wrong" }, { status: 500 });
}

export async function readJson<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

export async function logActivity(
  session: Session | null,
  action: "create" | "update" | "delete" | "login" | "export" | "upload",
  entity: string,
  entityId?: string | null,
  details?: string,
) {
  try {
    await execute(
      "INSERT INTO AdminActivityLog (id, adminId, adminName, action, entity, entityId, details) VALUES (?,?,?,?,?,?,?)",
      [randomUUID(), session?.id ?? null, session?.name ?? null, action, entity, entityId ?? null, details?.slice(0, 500) ?? null],
    );
  } catch (e) {
    console.error("[activity] log failed", e);
  }
}

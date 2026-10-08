import { NextResponse } from "next/server";
import { getPool, ready } from "@/lib/db";

/** Public health check: verifies the MySQL connection + schema bootstrap. */
export async function GET() {
  const started = Date.now();
  try {
    await ready();
    await getPool().query("SELECT 1");
    return NextResponse.json({ ok: true, database: process.env.DB_NAME, latencyMs: Date.now() - started });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    return NextResponse.json({ ok: false, error: e.code || e.message }, { status: 503 });
  }
}

import mysql, { type Pool, type ResultSetHeader } from "mysql2/promise";
import { ensureSchema } from "./schema";

/**
 * Single shared MySQL pool (same database the Nuxt website uses).
 * Cached on globalThis so Next dev hot-reloads don't open new pools.
 */
declare global {
  var __tcsPool: Pool | undefined;
  var __tcsReady: Promise<void> | undefined;
}

export function getPool(): Pool {
  if (!globalThis.__tcsPool) {
    globalThis.__tcsPool = mysql.createPool({
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.DB_NAME,
      charset: "utf8mb4",
      // Sequelize (website) stores DATETIME in UTC; read/write the same way.
      timezone: "Z",
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 15000,
      supportBigNumbers: true,
    });
  }
  return globalThis.__tcsPool;
}

/** Creates admin tables + seeds website content once per server process. */
export function ready(): Promise<void> {
  if (!globalThis.__tcsReady) {
    globalThis.__tcsReady = ensureSchema(getPool()).catch((err) => {
      globalThis.__tcsReady = undefined; // retry on next request
      throw err;
    });
  }
  return globalThis.__tcsReady;
}

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  const [rows] = await getPool().query(sql, params);
  return rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  await ready();
  const [result] = await getPool().query<ResultSetHeader>(sql, params);
  return result;
}

/** Quote a trusted identifier (table / column names come from code, never from users). */
export const q = (name: string) => `\`${name.replace(/`/g, "")}\``;

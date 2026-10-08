"use client";

import axios, { AxiosError } from "axios";

/** Axios instance for every admin API call (same-origin, cookie session). */
export const api = axios.create({ baseURL: "/api", withCredentials: true });

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      // Hard redirect is intentional: this runs outside React (axios interceptor).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/login?next=${next}`;
    }
    return Promise.reject(error);
  },
);

export function apiError(err: unknown, fallback = "Something went wrong"): string {
  const e = err as AxiosError<{ message?: string }>;
  return e?.response?.data?.message || e?.message || fallback;
}

/** Download a file returned by the API (Excel exports). */
export async function download(url: string, params?: Record<string, unknown>) {
  const res = await api.get(url, { params, responseType: "blob" });
  const name = /filename="?([^"]+)"?/.exec(String(res.headers["content-disposition"] || ""))?.[1] || "export.xlsx";
  const href = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
  URL.revokeObjectURL(href);
}

export async function uploadFiles(files: File[] | FileList, folder = "media"): Promise<string[]> {
  const form = new FormData();
  Array.from(files).forEach((f) => form.append("files", f));
  form.append("folder", folder);
  const { data } = await api.post<{ urls: string[] }>("/upload", form);
  return data.urls;
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

/** Website-relative media paths (/event/x.jpg, /public/x.png) → absolute URL for previews. */
export function assetUrl(src?: string | null): string {
  if (!src) return "";
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  const clean = src.startsWith("/public/") ? src.slice(7) : src;
  return `${SITE}${clean.startsWith("/") ? "" : "/"}${clean}`;
}

export const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

export function youtubeId(url: string) {
  return /(?:youtu\.be\/|v=|embed\/)([\w-]{6,})/.exec(url)?.[1] ?? "";
}

export function formatDate(iso?: string | null, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const units: [number, string][] = [[31536000, "y"], [2592000, "mo"], [604800, "w"], [86400, "d"], [3600, "h"], [60, "m"]];
  for (const [sec, u] of units) if (s >= sec) return `${Math.floor(s / sec)}${u} ago`;
  return "";
}

/** ISO → value for <input type="datetime-local"> in the browser's timezone. */
export function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

export const cn = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ");

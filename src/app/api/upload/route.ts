import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { handler, HttpError, logActivity } from "@/lib/api";

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|gif|webp|svg\+xml|avif)|video\/(mp4|webm|quicktime))$/;

/**
 * POST multipart/form-data { files: File[], folder?: string }
 * Saves into UPLOAD_DIR (default: the website's public/uploads) and returns
 * site-relative URLs (e.g. /uploads/events/2026-10/abc-photo.jpg) that the
 * website can serve directly.
 */
export const POST = handler(async (req, { session }) => {
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) throw new HttpError(400, "No files uploaded");

  const folder = String(form.get("folder") || "media").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || "media";
  const month = new Date().toISOString().slice(0, 7);
  const baseDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR || "../tech-catalyst-summit/public/uploads");
  const publicBase = (process.env.UPLOAD_PUBLIC_PATH || "/uploads").replace(/\/$/, "");
  const dir = path.join(/*turbopackIgnore: true*/ baseDir, folder, month);
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED.test(file.type)) throw new HttpError(400, `${file.name}: unsupported file type (${file.type || "unknown"})`);
    if (file.size > MAX_BYTES) throw new HttpError(400, `${file.name}: larger than 50MB`);
    const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "");
    const base = path.basename(file.name, path.extname(file.name)).toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 60);
    const name = `${randomUUID().slice(0, 8)}-${base || "file"}${ext}`;
    await writeFile(path.join(/*turbopackIgnore: true*/ dir, name), Buffer.from(await file.arrayBuffer()));
    urls.push(`${publicBase}/${folder}/${month}/${name}`);
  }
  await logActivity(session, "upload", "Media", null, `Uploaded ${urls.length} file(s) to ${folder}`);
  return { urls };
});

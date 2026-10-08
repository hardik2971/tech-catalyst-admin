"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { apiError, assetUrl, cn, isVideo, uploadFiles } from "@/lib/client";
import { Input } from "./ui";

/** URL field with upload button and live preview (images or video). */
export function ImageInput({ value, onChange, folder = "media", accept = "image/*", placeholder = "/event/cover.jpg or https://…", round }: {
  value: string; onChange: (v: string) => void; folder?: string; accept?: string; placeholder?: string; round?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const [url] = await uploadFiles([files[0]], folder);
      onChange(url);
      setBroken(false);
      toast.success("Uploaded");
    } catch (e) {
      toast.error(apiError(e, "Upload failed"));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "relative grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden border border-line bg-surface-2 text-muted",
          round ? "rounded-full" : "rounded-xl",
        )}
      >
        {value && !broken ? (
          isVideo(value) ? (
            <video src={assetUrl(value)} className="h-full w-full object-cover" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(value)} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
          )
        ) : (
          <ImageIcon className="h-5 w-5" />
        )}
        {busy && <div className="absolute inset-0 grid place-items-center bg-surface/70"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>}
      </div>
      <div className="flex-1 space-y-2">
        <Input value={value} placeholder={placeholder} onChange={(e) => { setBroken(false); onChange(e.target.value); }} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-line px-2.5 py-1 text-xs font-semibold text-brand hover:border-brand hover:bg-brand-soft"
          >
            <Upload className="h-3.5 w-3.5" /> Upload file
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="cursor-pointer text-xs font-medium text-muted hover:text-danger">
              Remove
            </button>
          )}
          {broken && value && <span className="text-xs text-warning">Preview unavailable — is the website running?</span>}
        </div>
        <input ref={ref} type="file" accept={accept} hidden onChange={(e) => onFiles(e.target.files)} />
      </div>
    </div>
  );
}

/** Chip input for string arrays (press Enter or comma). */
export function TagsInput({ value, onChange, placeholder = "Type and press Enter", suggestions = [] }: {
  value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[];
}) {
  const [text, setText] = useState("");
  const add = (t: string) => {
    const v = t.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setText("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  };
  const rest = suggestions.filter((s) => !value.includes(s));
  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5 focus-within:border-brand focus-within:ring-4 focus-within:ring-[var(--ring)]">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
            {t}
            <button type="button" className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => onChange(value.filter((x) => x !== t))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => text && add(text)}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[120px] flex-1 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-muted/70"
        />
      </div>
      {rest.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rest.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="cursor-pointer rounded-lg border border-line px-2 py-0.5 text-[11px] font-medium text-muted hover:border-brand hover:text-brand">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

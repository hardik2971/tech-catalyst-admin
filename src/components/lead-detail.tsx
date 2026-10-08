"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, initials } from "@/lib/client";
import { STATUS_OPTIONS, STATUS_TONE } from "./configs";
import { Badge, Button, Textarea } from "./ui";
import type { Row } from "./resource-page";

export function StatusBadge({ status }: { status?: string }) {
  const s = status || "new";
  return <Badge tone={STATUS_TONE[s] ?? "gray"} dot>{s.replace("_", " ")}</Badge>;
}

export function ContactHeader({ name, email, subtitle, createdAt }: { name?: string; email?: string; subtitle?: ReactNode; createdAt?: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-line bg-surface-2/60 p-4">
      <div className="bg-brand-gradient grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white">{initials(name || email)}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-lg font-bold text-ink">{name || email}</div>
        {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {email && (
            <>
              <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand hover:brightness-95">
                <Mail className="h-3.5 w-3.5" /> {email}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(email).then(() => toast.success("Email copied"))}
                className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink"
                aria-label="Copy email"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {createdAt && <span className="text-xs text-muted">Submitted {formatDate(createdAt, true)}</span>}
        </div>
      </div>
    </div>
  );
}

/** Pipeline status + private notes (stored in AdminRecordMeta, never shown on the website). */
export function StatusPanel({ row, update }: { row: Row; update: (patch: Record<string, unknown>) => Promise<void> }) {
  const [notes, setNotes] = useState<string>(row.notes ?? "");
  const [saving, setSaving] = useState(false);
  useEffect(() => setNotes(row.notes ?? ""), [row.id, row.notes]);
  return (
    <div className="space-y-4 rounded-2xl border border-line p-4">
      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => update({ status: s.value })}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                (row.status || "new") === s.value ? "bg-brand-gradient border-transparent text-white shadow" : "border-line text-muted hover:border-brand hover:text-brand",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Internal notes</div>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Follow-up notes, call outcome, next steps…" />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            loading={saving}
            disabled={notes === (row.notes ?? "")}
            onClick={async () => {
              setSaving(true);
              await update({ notes });
              setSaving(false);
            }}
          >
            Save notes
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DetailList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="space-y-4">
      {items
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => (
          <div key={k}>
            <dt className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{k}</dt>
            <dd className="text-sm leading-relaxed whitespace-pre-wrap text-ink">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

export function Chips({ items }: { items?: string[] }) {
  if (!items?.length) return <span className="text-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => <span key={i} className="rounded-lg bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">{i}</span>)}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Eye, LayoutGrid, List, Pencil, Plus, RefreshCw, Search, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiError, cn, download, toLocalInput } from "@/lib/client";
import { Badge, Button, Card, ConfirmDialog, Drawer, EmptyState, Field, Input, Select, Skeleton, Switch, Tabs, Textarea } from "./ui";
import { ImageInput, TagsInput } from "./inputs";
import { PageHeader } from "./page-header";

export type Row = Record<string, any> & { id: string }; // eslint-disable-line @typescript-eslint/no-explicit-any

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "email" | "url" | "textarea" | "html" | "number" | "select" | "switch" | "image" | "datetime" | "tags";
  options?: { label: string; value: string }[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  span?: 1 | 2;
  rows?: number;
  folder?: string;
  suggestions?: string[];
  section?: string;
};

export type ColumnDef = {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: Row) => ReactNode;
  className?: string;
  hide?: "sm" | "md" | "lg";
};

export type FilterDef = { name: string; label: string; options: { label: string; value: string }[] };

type Props = {
  resource: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  columns: ColumnDef[];
  fields?: FieldDef[];
  defaults?: Record<string, unknown>;
  filters?: FilterDef[];
  tabs?: { name: string; items: { value: string; label: string }[] };
  fixedFilters?: Record<string, string>;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  dateRange?: boolean;
  createLabel?: string;
  searchPlaceholder?: string;
  renderDetail?: (row: Row, h: { update: (patch: Record<string, unknown>) => Promise<void>; edit: () => void }) => ReactNode;
  detailTitle?: (row: Row) => ReactNode;
  card?: (row: Row, a: { edit: () => void; remove: () => void; view: () => void }) => ReactNode;
  defaultView?: "table" | "grid";
  pageSize?: number;
  embedded?: boolean;
  onChanged?: () => void;
  /** Navigate to a dedicated page instead of opening the edit drawer */
  rowHref?: (row: Row) => string;
  /** Override the grid-view column classes */
  gridClassName?: string;
};

const hideCls = { sm: "max-sm:hidden", md: "max-md:hidden", lg: "max-lg:hidden" };

export function ResourcePage(p: Props) {
  const {
    resource, columns, fields, defaults = {}, filters = [], tabs, fixedFilters, canCreate = !!fields, canEdit = !!fields,
    canDelete = true, canExport = false, dateRange = false, pageSize: initialPageSize = 20,
  } = p;

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState<{ key?: string; order?: "ASC" | "DESC" }>({});
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("all");
  const [range, setRange] = useState({ from: "", to: "" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"table" | "grid">(p.defaultView ?? (p.card ? "grid" : "table"));

  const [editing, setEditing] = useState<Row | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row[] | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [debouncedQ, filterValues, tab, range, pageSize]);

  const fixedKey = JSON.stringify(fixedFilters ?? {});
  const tabName = tabs?.name;
  const params = useMemo(() => {
    const out: Record<string, unknown> = { page, pageSize, q: debouncedQ || undefined, ...JSON.parse(fixedKey) };
    Object.entries(filterValues).forEach(([k, v]) => v && v !== "all" && (out[k] = v));
    if (tabName && tab !== "all") out[tabName] = tab;
    if (sort.key) Object.assign(out, { sort: sort.key, order: sort.order });
    if (range.from) out.from = range.from;
    if (range.to) out.to = range.to;
    return out;
  }, [page, pageSize, debouncedQ, filterValues, tab, sort, range, tabName, fixedKey]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ data: Row[]; total: number }>(`/r/${resource}`, { params });
      setRows(data.data);
      setTotal(data.total);
      setSelected(new Set());
    } catch (e) {
      toast.error(apiError(e, "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [resource, params]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    load();
    p.onChanged?.();
  };

  async function update(id: string, patch: Record<string, unknown>) {
    try {
      const { data } = await api.put<Row>(`/r/${resource}/${id}`, patch);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...data } : r)));
      setViewing((v) => (v?.id === id ? { ...v, ...data } : v));
      toast.success("Saved");
      p.onChanged?.();
    } catch (e) {
      toast.error(apiError(e, "Update failed"));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      if (deleting.length === 1) await api.delete(`/r/${resource}/${deleting[0].id}`);
      else await api.delete(`/r/${resource}`, { data: { ids: deleting.map((r) => r.id) } });
      toast.success(deleting.length === 1 ? "Deleted" : `${deleting.length} records deleted`);
      setDeleting(null);
      setViewing(null);
      refresh();
    } catch (e) {
      toast.error(apiError(e, "Delete failed"));
    } finally {
      setDeleteBusy(false);
    }
  }

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: Row) => {
    setEditing(row);
    setFormOpen(true);
  };
  const router = useRouter();
  const onRowClick = (row: Row) =>
    p.rowHref ? router.push(p.rowHref(row)) : p.renderDetail ? setViewing(row) : canEdit ? openEdit(row) : undefined;

  const toggleSort = (key: string) =>
    setSort((s) => (s.key !== key ? { key, order: "ASC" } : s.order === "ASC" ? { key, order: "DESC" } : {}));

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const exportParams = { ...params, page: undefined, pageSize: undefined };

  return (
    <div className={cn(!p.embedded && "animate-fade-up space-y-6")}>
      {!p.embedded && (
        <PageHeader
          title={p.title}
          description={p.description}
          icon={p.icon}
          actions={
            <>
              {canExport && (
                <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={() => download(`/export/${resource}`, exportParams).catch((e) => toast.error(apiError(e)))}>
                  Export
                </Button>
              )}
              {canCreate && (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                  {p.createLabel ?? "Add new"}
                </Button>
              )}
            </>
          }
        />
      )}

      <Card className={cn("overflow-hidden", p.embedded && "shadow-none")}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="w-full sm:w-72">
              <Input icon={<Search className="h-4 w-4" />} placeholder={p.searchPlaceholder ?? "Search…"} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {tabs && <Tabs value={tab} onChange={setTab} items={[{ value: "all", label: "All" }, ...tabs.items]} />}
            {filters.map((f) => (
              <Select
                key={f.name}
                className="sm:w-44"
                value={filterValues[f.name] ?? "all"}
                onChange={(e) => setFilterValues((v) => ({ ...v, [f.name]: e.target.value }))}
              >
                <option value="all">{f.label}: All</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            ))}
            {dateRange && (
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Input type="date" className="min-w-0 flex-1 sm:w-[150px] sm:flex-none" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
                <span className="text-xs text-muted">to</span>
                <Input type="date" className="min-w-0 flex-1 sm:w-[150px] sm:flex-none" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && canDelete && (
              <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDeleting(rows.filter((r) => selected.has(r.id)))}>
                Delete {selected.size}
              </Button>
            )}
            {p.embedded && canCreate && (
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>{p.createLabel ?? "Add"}</Button>
            )}
            {p.card && (
              <div className="flex rounded-xl border border-line p-0.5">
                {(["grid", "table"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={cn("grid h-8 w-8 cursor-pointer place-items-center rounded-lg", view === v ? "bg-brand-soft text-brand" : "text-muted hover:text-ink")}
                    aria-label={`${v} view`}
                  >
                    {v === "grid" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Body */}
        {loading && rows.length === 0 ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={p.icon}
            title={debouncedQ || Object.keys(filterValues).length || tab !== "all" ? "No matching records" : "Nothing here yet"}
            text={debouncedQ ? "Try a different search or clear the filters." : undefined}
            action={canCreate ? <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>{p.createLabel ?? "Add new"}</Button> : undefined}
          />
        ) : view === "grid" && p.card ? (
          <div className={cn("grid gap-4 p-4", p.gridClassName ?? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", loading && "opacity-60")}>
            {rows.map((row) => (
              <div key={row.id}>{p.card!(row, { edit: () => openEdit(row), remove: () => setDeleting([row]), view: () => onRowClick(row) })}</div>
            ))}
          </div>
        ) : (
          <div className={cn("overflow-x-auto", loading && "opacity-60")}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/70 text-[11px] font-bold uppercase tracking-wider text-muted">
                  {canDelete && (
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-[var(--brand)]"
                        checked={allChecked}
                        onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
                      />
                    </th>
                  )}
                  {columns.map((c) => (
                    <th key={c.key} className={cn("px-4 py-3 whitespace-nowrap", c.hide && hideCls[c.hide], c.className)}>
                      {c.sortable ? (
                        <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex cursor-pointer items-center gap-1 uppercase hover:text-ink">
                          {c.header}
                          {sort.key === c.key && (sort.order === "ASC" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                  <th className="w-28 px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.id} className={cn("group cursor-pointer transition-colors hover:bg-brand-soft/40", selected.has(row.id) && "bg-brand-soft/50")} onClick={() => onRowClick(row)}>
                    {canDelete && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer accent-[var(--brand)]"
                          checked={selected.has(row.id)}
                          onChange={() => {
                            const n = new Set(selected);
                            if (n.has(row.id)) n.delete(row.id);
                            else n.add(row.id);
                            setSelected(n);
                          }}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 align-middle text-ink", c.hide && hideCls[c.hide], c.className)}>
                        {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
                        {p.renderDetail && (
                          <Button variant="ghost" size="icon" onClick={() => setViewing(row)} aria-label="View"><Eye className="h-4 w-4" /></Button>
                        )}
                        {canEdit && (
                          <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="hover:!text-danger" onClick={() => setDeleting([row])} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted sm:flex-row">
            <div className="flex items-center gap-3">
              <span>
                Showing <b className="text-ink">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</b> of <b className="text-ink">{total}</b>
              </span>
              <Select className="!h-8 w-[88px] text-xs" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="px-3 font-semibold text-ink">{page} / {pages}</span>
              <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>

      {fields && (
        <ResourceForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          resource={resource}
          label={p.title}
          fields={fields}
          row={editing}
          defaults={{ ...defaults, ...fixedFilters }}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      )}

      {p.renderDetail && viewing && (
        <Drawer
          open
          onClose={() => setViewing(null)}
          title={p.detailTitle ? p.detailTitle(viewing) : "Details"}
          footer={
            <>
              {canDelete && <Button variant="outline" className="mr-auto !text-danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleting([viewing])}>Delete</Button>}
              {canEdit && <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => { openEdit(viewing); setViewing(null); }}>Edit</Button>}
              <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
            </>
          }
        >
          {p.renderDetail(viewing, { update: (patch) => update(viewing.id, patch), edit: () => openEdit(viewing) })}
        </Drawer>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteBusy}
        title={deleting && deleting.length > 1 ? `Delete ${deleting.length} records?` : "Delete this record?"}
        text="This permanently removes the data from the database shared with the website. This action cannot be undone."
      />
    </div>
  );
}

/* ── Create / edit form (drawer) ─────────────────────────────────────── */
export function ResourceForm({ open, onClose, resource, label, fields, row, defaults, onSaved }: {
  open: boolean; onClose: () => void; resource: string; label: string; fields: FieldDef[]; row: Row | null;
  defaults?: Record<string, unknown>; onSaved: (row: Row) => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const init: Record<string, unknown> = {};
    for (const f of fields) {
      const v = row ? row[f.name] : defaults?.[f.name];
      init[f.name] = v ?? (f.type === "switch" ? false : f.type === "tags" ? [] : f.type === "number" ? 0 : "");
    }
    setValues({ ...(row ? {} : defaults), ...init });
    setErrors({});
    // Initialise only when the drawer opens / target row changes — not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row]);

  const set = (name: string, v: unknown) => setValues((s) => ({ ...s, [name]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.name];
      if (f.required && (v == null || v === "" || (Array.isArray(v) && !v.length))) errs[f.name] = `${f.label} is required`;
      if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) errs[f.name] = "Enter a valid email";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const { data } = row ? await api.put<Row>(`/r/${resource}/${row.id}`, values) : await api.post<Row>(`/r/${resource}`, values);
      toast.success(row ? "Changes saved" : "Created successfully");
      onSaved(data);
    } catch (err) {
      toast.error(apiError(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  const sections = useMemo(() => {
    const out: { name?: string; fields: FieldDef[] }[] = [];
    for (const f of fields) {
      const last = out[out.length - 1];
      if (!last || (f.section && f.section !== last.name)) out.push({ name: f.section, fields: [f] });
      else last.fields.push(f);
    }
    return out;
  }, [fields]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={row ? `Edit ${label.replace(/s$/, "").toLowerCase()}` : `New ${label.replace(/s$/, "").toLowerCase()}`}
      subtitle={row ? "Changes are saved to the shared website database." : "Fill in the details below."}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="resource-form" loading={saving}>{row ? "Save changes" : "Create"}</Button>
        </>
      }
    >
      <form id="resource-form" onSubmit={submit} className="space-y-8">
        {sections.map((s, i) => (
          <section key={i} className="space-y-4">
            {s.name && <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{s.name}</h4>}
            <div className="grid gap-4 sm:grid-cols-2">
              {s.fields.map((f) => (
                <Field
                  key={f.name}
                  label={f.type === "switch" ? undefined : f.label}
                  required={f.required}
                  hint={f.hint}
                  error={errors[f.name]}
                  className={cn((f.span === 2 || ["textarea", "html", "image", "tags"].includes(f.type)) && "sm:col-span-2")}
                >
                  <FieldControl f={f} value={values[f.name]} onChange={(v) => set(f.name, v)} />
                </Field>
              ))}
            </div>
          </section>
        ))}
      </form>
    </Drawer>
  );
}

function FieldControl({ f, value, onChange }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const str = value == null ? "" : String(value);
  switch (f.type) {
    case "textarea":
      return <Textarea rows={f.rows ?? 5} value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case "html":
      return <HtmlField value={str} onChange={onChange} rows={f.rows} />;
    case "number":
      return <Input type="number" value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
    case "select":
      return (
        <Select value={str} onChange={(e) => onChange(e.target.value)}>
          {!f.required && <option value="">—</option>}
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      );
    case "switch":
      return (
        <div className="flex h-full items-center rounded-xl border border-line px-3.5 py-2.5">
          <Switch checked={Boolean(value)} onChange={onChange} label={<span className="font-semibold">{f.label}</span>} />
        </div>
      );
    case "image":
      return <ImageInput value={str} onChange={onChange} folder={f.folder} placeholder={f.placeholder} accept={f.folder === "clips" ? "video/*" : "image/*"} />;
    case "datetime":
      return (
        <Input
          type="datetime-local"
          value={toLocalInput(str)}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        />
      );
    case "tags":
      return <TagsInput value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} suggestions={f.suggestions} placeholder={f.placeholder} />;
    default:
      return <Input type={f.type} value={str} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
}

function HtmlField({ value, onChange, rows = 12 }: { value: string; onChange: (v: unknown) => void; rows?: number }) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center justify-between border-b border-line bg-surface-2 px-2 py-1.5">
        <Tabs value={mode} onChange={setMode} items={[{ value: "edit", label: "HTML" }, { value: "preview", label: "Preview" }]} />
        <span className="pr-2 text-[11px] text-muted">Supports &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, links</span>
      </div>
      {mode === "edit" ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full resize-y bg-surface p-3.5 font-mono text-[12.5px] leading-relaxed text-ink outline-none"
        />
      ) : (
        <div className="prose-preview max-h-[480px] overflow-y-auto bg-surface p-4 text-sm leading-relaxed text-ink" dangerouslySetInnerHTML={{ __html: value }} />
      )}
    </div>
  );
}

/* ── Small display helpers used by page configs ─────────────────────── */
export function BoolBadge({ value, on = "Active", off = "Hidden" }: { value: unknown; on?: string; off?: string }) {
  return value ? <Badge tone="green" dot>{on}</Badge> : <Badge tone="gray" dot>{off}</Badge>;
}

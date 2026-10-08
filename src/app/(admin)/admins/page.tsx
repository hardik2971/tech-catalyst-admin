"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, formatDate, initials, timeAgo } from "@/lib/client";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Skeleton, Switch } from "@/components/ui";
import { can, useSession } from "@/components/session";

type Admin = { id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt: string | null; createdAt: string };
const ROLE_TONE = { super_admin: "violet", admin: "blue", editor: "teal" } as const;
const ROLE_HELP: Record<string, string> = {
  super_admin: "Full access, including admin users",
  admin: "Manage content, submissions, settings & exports",
  editor: "Edit website content only (no deletes, exports or settings)",
};

export default function AdminsPage() {
  const { me } = useSession();
  const [rows, setRows] = useState<Admin[] | null>(null);
  const [form, setForm] = useState<(Partial<Admin> & { password?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<Admin | null>(null);

  const load = useCallback(() => {
    api.get<{ data: Admin[] }>("/admins").then((r) => setRows(r.data.data)).catch((e) => toast.error(apiError(e)));
  }, []);
  useEffect(() => load(), [load]);

  if (me && !can(me, "super")) {
    return <Card><EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="Super admins only" text="Ask a super admin to manage admin accounts." /></Card>;
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      if (form.id) await api.put(`/admins/${form.id}`, form);
      else await api.post("/admins", form);
      toast.success(form.id ? "Admin updated" : "Admin created");
      setForm(null);
      load();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!del) return;
    try {
      await api.delete(`/admins/${del.id}`);
      toast.success("Admin deleted");
      setDel(null);
      load();
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Admin Users"
        description="People who can sign in to this console, and what they're allowed to do."
        icon={<ShieldCheck />}
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ role: "admin", isActive: true })}>Invite admin</Button>}
      />
      <Card className="overflow-hidden">
        {!rows ? (
          <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2/70 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                  <th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Last login</th><th className="px-5 py-3">Created</th><th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-2/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-brand-gradient grid h-9 w-9 place-items-center rounded-xl text-xs font-bold text-white">{initials(a.name)}</span>
                        <div>
                          <div className="font-semibold text-ink">{a.name} {a.id === me?.id && <span className="text-xs font-normal text-muted">(you)</span>}</div>
                          <div className="text-xs text-muted">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge tone={ROLE_TONE[a.role as keyof typeof ROLE_TONE]}>{a.role.replace("_", " ")}</Badge></td>
                    <td className="px-5 py-3">{a.isActive ? <Badge tone="green" dot>Active</Badge> : <Badge tone="red" dot>Disabled</Badge>}</td>
                    <td className="px-5 py-3 text-muted">{a.lastLoginAt ? timeAgo(a.lastLoginAt) : "Never"}</td>
                    <td className="px-5 py-3 text-muted">{formatDate(a.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => setForm({ ...a, password: "" })} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                      {a.id !== me?.id && <Button variant="ghost" size="icon" className="hover:!text-danger" onClick={() => setDel(a)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit admin" : "Invite admin"}
        subtitle={form?.id ? "Leave password empty to keep the current one." : "Share the password with them securely."}
        footer={<><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button loading={saving} onClick={save}>{form?.id ? "Save" : "Create admin"}</Button></>}
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email" required><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label={form.id ? "New password" : "Password"} required={!form.id} hint="At least 8 characters">
              <Input type="password" autoComplete="new-password" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="Role" hint={ROLE_HELP[form.role ?? "admin"]}>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="super_admin">Super admin</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Switch checked={!!form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Account active (can sign in)" disabled={form.id === me?.id} />
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title={`Delete ${del?.name}?`} text="They will immediately lose access to the admin console." />
    </div>
  );
}

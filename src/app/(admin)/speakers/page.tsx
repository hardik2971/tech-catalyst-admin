"use client";

import { Crown, Link2, Mic2, Pencil, Trash2 } from "lucide-react";
import { BoolBadge, ResourcePage } from "@/components/resource-page";
import { SPEAKER_FIELDS } from "@/components/configs";
import { Badge, Button } from "@/components/ui";
import { assetUrl, initials } from "@/lib/client";
import { can, useSession } from "@/components/session";

export default function SpeakersPage() {
  const { me } = useSession();
  return (
    <ResourcePage
      resource="speakers"
      title="Speakers"
      description="Featured speakers, previous main speakers and the founders shown on the About page."
      icon={<Mic2 />}
      createLabel="Add speaker"
      fields={SPEAKER_FIELDS}
      defaults={{ category: "featured", isActive: true, isFounder: false, sortOrder: 0 }}
      tabs={{ name: "category", items: [{ value: "featured", label: "Featured" }, { value: "previous", label: "Previous" }] }}
      canDelete={can(me, "manage")}
      canExport
      searchPlaceholder="Search by name or title…"
      columns={[
        {
          key: "name",
          header: "Speaker",
          sortable: true,
          render: (r) => (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(r.image)} alt="" className="h-10 w-10 rounded-full bg-surface-2 object-cover" />
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-muted">{r.position}</div>
              </div>
            </div>
          ),
        },
        { key: "category", header: "Section", sortable: true, render: (r) => <Badge tone={r.category === "featured" ? "blue" : "violet"}>{r.category}</Badge> },
        { key: "isFounder", header: "Founder", hide: "md", render: (r) => (r.isFounder ? <Badge tone="amber">Founder</Badge> : <span className="text-muted">—</span>) },
        { key: "isActive", header: "Visibility", render: (r) => <BoolBadge value={r.isActive} on="Visible" /> },
        { key: "sortOrder", header: "Order", sortable: true, hide: "lg" },
      ]}
      card={(r, a) => (
        <div className="group relative flex h-full flex-col items-center rounded-2xl border border-line bg-surface p-6 text-center transition hover:-translate-y-0.5 hover:shadow-xl">
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
            <Button variant="ghost" size="icon" onClick={a.edit} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
            {can(me, "manage") && <Button variant="ghost" size="icon" className="hover:!text-danger" onClick={a.remove} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>}
          </div>
          <div className="relative">
            <div className="bg-brand-gradient rounded-full p-[3px]">
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(r.image)} alt="" className="h-24 w-24 rounded-full border-4 border-surface bg-surface-2 object-cover" />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-surface bg-surface-2 text-xl font-bold text-brand">{initials(r.name)}</div>
              )}
            </div>
            {r.isFounder && <span className="absolute -right-1 bottom-1 grid h-7 w-7 place-items-center rounded-full bg-warning text-white ring-4 ring-surface"><Crown className="h-3.5 w-3.5" /></span>}
          </div>
          <button onClick={a.edit} className="mt-4 cursor-pointer font-bold text-ink hover:text-brand">{r.name}</button>
          <div className="mt-0.5 line-clamp-2 text-xs text-muted">{r.position}</div>
          <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted">{r.bio}</p>
          <div className="mt-auto flex items-center gap-2 pt-4">
            <Badge tone={r.category === "featured" ? "blue" : "violet"}>{r.category}</Badge>
            {!r.isActive && <Badge>Hidden</Badge>}
            {r.linkedin && <a href={r.linkedin} target="_blank" rel="noreferrer" className="text-muted hover:text-brand"><Link2 className="h-4 w-4" /></a>}
          </div>
        </div>
      )}
    />
  );
}

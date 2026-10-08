"use client";

import { ExternalLink, Handshake, Pencil, Star, Trash2 } from "lucide-react";
import { BoolBadge, ResourcePage } from "@/components/resource-page";
import { SPONSOR_FIELDS } from "@/components/configs";
import { Badge, Button } from "@/components/ui";
import { assetUrl } from "@/lib/client";
import { can, useSession } from "@/components/session";

export default function SponsorsPage() {
  const { me } = useSession();
  return (
    <ResourcePage
      resource="sponsors"
      title="Partners & Sponsors"
      description="Logos shown in the website's partner wall and main sponsor carousel."
      icon={<Handshake />}
      createLabel="Add partner"
      fields={SPONSOR_FIELDS}
      defaults={{ tier: "Platinum Partners", isActive: true, isMain: true, sortOrder: 0 }}
      filters={[{ name: "isActive", label: "Visibility", options: [{ label: "Visible", value: "true" }, { label: "Hidden", value: "false" }] }]}
      canDelete={can(me, "manage")}
      canExport
      searchPlaceholder="Search partners…"
      gridClassName="grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      columns={[
        {
          key: "name",
          header: "Partner",
          sortable: true,
          render: (r) => (
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(r.logo)} alt="" className="absolute inset-0 h-full w-full object-contain p-1" />
              </div>
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-xs text-muted">{r.subtitle}</div>
              </div>
            </div>
          ),
        },
        { key: "tier", header: "Tier", sortable: true, render: (r) => <Badge tone="violet">{r.tier}</Badge> },
        { key: "isMain", header: "Carousel", hide: "md", render: (r) => (r.isMain ? <Badge tone="amber">Main sponsor</Badge> : <span className="text-muted">—</span>) },
        { key: "isActive", header: "Visibility", render: (r) => <BoolBadge value={r.isActive} on="Visible" /> },
        { key: "sortOrder", header: "Order", sortable: true, hide: "lg" },
      ]}
      card={(r, a) => (
        <div className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-xl">
          <button onClick={a.edit} className="relative block aspect-square w-full cursor-pointer overflow-hidden bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetUrl(r.logo)} alt={r.name} className="absolute inset-0 h-full w-full object-contain p-6 transition group-hover:scale-105" />
            {r.isMain && <span className="absolute top-3 left-3 grid h-7 w-7 place-items-center rounded-full bg-warning/15 text-warning"><Star className="h-3.5 w-3.5 fill-current" /></span>}
          </button>
          <div className="flex items-center gap-2 border-t border-line p-4">
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold text-ink">{r.name}</div>
              <div className="truncate text-xs text-muted">{r.subtitle}</div>
            </div>
            {!r.isActive && <Badge>Hidden</Badge>}
            {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="p-1 text-muted hover:text-brand"><ExternalLink className="h-4 w-4" /></a>}
            <Button variant="ghost" size="icon" onClick={a.edit} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
            {can(me, "manage") && <Button variant="ghost" size="icon" className="hover:!text-danger" onClick={a.remove} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>}
          </div>
        </div>
      )}
    />
  );
}

"use client";

import { Activity } from "lucide-react";
import { ResourcePage } from "@/components/resource-page";
import { Badge, type Tone } from "@/components/ui";
import { formatDate, initials, timeAgo } from "@/lib/client";
import { can, useSession } from "@/components/session";

const TONE: Record<string, Tone> = { create: "green", update: "blue", delete: "red", login: "gray", export: "violet", upload: "teal" };

export default function ActivityPage() {
  const { me } = useSession();
  return (
    <ResourcePage
      resource="activity"
      title="Activity Log"
      description="An audit trail of every change made from the admin console."
      icon={<Activity />}
      canCreate={false}
      canEdit={false}
      canDelete={false}
      canExport={can(me, "manage")}
      dateRange
      pageSize={50}
      tabs={{ name: "action", items: Object.keys(TONE).map((k) => ({ value: k, label: k[0].toUpperCase() + k.slice(1) })) }}
      searchPlaceholder="Search admin, entity or details…"
      columns={[
        { key: "action", header: "Action", sortable: true, render: (r) => <Badge tone={TONE[r.action] ?? "gray"}>{r.action}</Badge> },
        { key: "details", header: "Details", render: (r) => <span className="text-ink">{r.details}</span> },
        { key: "entity", header: "Area", sortable: true, hide: "md", render: (r) => <span className="text-muted">{r.entity}</span> },
        {
          key: "adminName",
          header: "By",
          hide: "sm",
          render: (r) => (
            <span className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-[10px] font-bold text-brand">{initials(r.adminName)}</span>
              <span className="text-muted">{r.adminName ?? "System"}</span>
            </span>
          ),
        },
        { key: "createdAt", header: "When", sortable: true, render: (r) => <span className="whitespace-nowrap text-muted" title={formatDate(r.createdAt, true)}>{timeAgo(r.createdAt)}</span> },
      ]}
    />
  );
}

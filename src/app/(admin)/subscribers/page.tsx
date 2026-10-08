"use client";

import { Mail } from "lucide-react";
import { ResourcePage } from "@/components/resource-page";
import { formatDate, initials, timeAgo } from "@/lib/client";
import { can, useSession } from "@/components/session";

export default function SubscribersPage() {
  const { me } = useSession();
  const manage = can(me, "manage");
  return (
    <ResourcePage
      resource="subscribers"
      title="Gallery Subscribers"
      description="Emails captured when visitors unlock the event photo gallery on the website."
      icon={<Mail />}
      createLabel="Add subscriber"
      canCreate={manage}
      canEdit={manage}
      canDelete={manage}
      canExport={manage}
      dateRange
      searchPlaceholder="Search email…"
      fields={[{ name: "email", label: "Email address", type: "email", required: true, span: 2 }]}
      columns={[
        {
          key: "email",
          header: "Email",
          sortable: true,
          render: (r) => (
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-xs font-bold text-brand">{initials(r.email)}</span>
              <span className="font-medium">{r.email}</span>
            </div>
          ),
        },
        { key: "createdAt", header: "Subscribed", sortable: true, render: (r) => <span className="text-muted">{formatDate(r.createdAt, true)} · {timeAgo(r.createdAt)}</span> },
      ]}
    />
  );
}

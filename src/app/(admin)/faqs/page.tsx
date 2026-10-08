"use client";

import { FileQuestion } from "lucide-react";
import { BoolBadge, ResourcePage } from "@/components/resource-page";
import { FAQ_FIELDS } from "@/components/configs";
import { assetUrl } from "@/lib/client";
import { can, useSession } from "@/components/session";

export default function FaqsPage() {
  const { me } = useSession();
  return (
    <ResourcePage
      resource="faqs"
      title="FAQs"
      description="FAQ categories shown on the website's FAQ page. Hero text is under Site Settings."
      icon={<FileQuestion />}
      createLabel="Add category"
      fields={FAQ_FIELDS}
      defaults={{ isActive: true, sortOrder: 0, articleCount: 0 }}
      canDelete={can(me, "manage")}
      columns={[
        {
          key: "title",
          header: "Category",
          sortable: true,
          render: (r) => (
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.icon && <img src={assetUrl(r.icon)} alt="" className="absolute inset-0 h-full w-full object-contain p-2" />}
              </div>
              <div className="min-w-0">
                <div className="font-semibold uppercase">{r.title}</div>
                <div className="line-clamp-1 text-xs text-muted">{r.description}</div>
              </div>
            </div>
          ),
        },
        { key: "articleCount", header: "Articles", sortable: true },
        { key: "isActive", header: "Visibility", render: (r) => <BoolBadge value={r.isActive} on="Visible" /> },
        { key: "sortOrder", header: "Order", sortable: true, hide: "md" },
      ]}
    />
  );
}

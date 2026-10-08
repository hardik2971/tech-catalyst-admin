"use client";

import { Package } from "lucide-react";
import { BoolBadge, ResourcePage } from "@/components/resource-page";
import { PACKAGE_FIELDS } from "@/components/configs";
import { can, useSession } from "@/components/session";

export default function PackagesPage() {
  const { me } = useSession();
  return (
    <ResourcePage
      resource="packages"
      title="Sponsorship Packages"
      description="The “Sponsorship opportunities” options listed on the website's sponsor page."
      icon={<Package />}
      createLabel="Add package"
      fields={PACKAGE_FIELDS}
      defaults={{ isActive: true, sortOrder: 0 }}
      canDelete={can(me, "manage")}
      columns={[
        { key: "sortOrder", header: "#", sortable: true, className: "w-14 text-muted" },
        { key: "title", header: "Package", sortable: true, render: (r) => <span className="font-semibold">{r.title}</span> },
        { key: "description", header: "Description", hide: "md", render: (r) => <span className="line-clamp-2 max-w-xl text-muted">{r.description}</span> },
        { key: "isActive", header: "Visibility", render: (r) => <BoolBadge value={r.isActive} on="Visible" /> },
      ]}
    />
  );
}

"use client";

import { Globe, Handshake, Link2 } from "lucide-react";
import { ResourcePage } from "@/components/resource-page";
import { AUDIENCE_OPTIONS, GOAL_OPTIONS, PARTNERSHIP_OPTIONS, STATUS_OPTIONS } from "@/components/configs";
import { Chips, ContactHeader, DetailList, StatusBadge, StatusPanel } from "@/components/lead-detail";
import { formatDate } from "@/lib/client";
import { can, useSession } from "@/components/session";

export default function SponsorLeadsPage() {
  const { me } = useSession();
  const manage = can(me, "manage");
  return (
    <ResourcePage
      resource="sponsor-leads"
      title="Sponsor Leads"
      description="Partnership requests from the website's sponsor page form."
      icon={<Handshake />}
      tabs={{ name: "status", items: STATUS_OPTIONS.slice(0, 5) }}
      dateRange
      canExport={manage}
      canDelete={manage}
      canEdit={manage}
      canCreate={false}
      searchPlaceholder="Search name, email, company, website…"
      fields={[
        { name: "fullName", label: "Full name", type: "text", required: true },
        { name: "workEmail", label: "Work email", type: "email", required: true },
        { name: "company", label: "Company", type: "text", required: true },
        { name: "jobTitle", label: "Job title", type: "text", required: true },
        { name: "website", label: "Company website", type: "url", required: true },
        { name: "linkedin", label: "LinkedIn", type: "url" },
        { name: "partnershipTypes", label: "Partnership types", type: "tags", suggestions: PARTNERSHIP_OPTIONS },
        { name: "targetAudience", label: "Target audience", type: "tags", suggestions: AUDIENCE_OPTIONS },
        { name: "goals", label: "Goals", type: "tags", suggestions: GOAL_OPTIONS },
        { name: "details", label: "Details", type: "textarea", required: true },
      ]}
      columns={[
        {
          key: "fullName",
          header: "Contact",
          sortable: true,
          render: (r) => (
            <div>
              <div className="font-semibold">{r.fullName}</div>
              <div className="text-xs text-muted">{r.workEmail}</div>
            </div>
          ),
        },
        {
          key: "company",
          header: "Company",
          sortable: true,
          render: (r) => (
            <div>
              <div>{r.company}</div>
              <div className="text-xs text-muted">{r.jobTitle}</div>
            </div>
          ),
        },
        {
          key: "partnershipTypes",
          header: "Interested in",
          hide: "lg",
          render: (r) => (
            <span className="line-clamp-1 max-w-[260px] text-xs text-muted">{(r.partnershipTypes ?? []).join(", ") || "—"}</span>
          ),
        },
        { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
        { key: "createdAt", header: "Received", sortable: true, render: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.createdAt)}</span> },
      ]}
      detailTitle={(r) => r.company}
      renderDetail={(r, h) => (
        <div className="space-y-6">
          <ContactHeader name={r.fullName} email={r.workEmail} subtitle={`${r.jobTitle} · ${r.company}`} createdAt={r.createdAt} />
          {manage && <StatusPanel row={r} update={h.update} />}
          <DetailList
            items={[
              ["Company website", <a key="w" href={r.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-brand hover:underline"><Globe className="h-4 w-4" />{r.website}</a>],
              ["LinkedIn", r.linkedin && <a href={r.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-brand hover:underline"><Link2 className="h-4 w-4" />{r.linkedin}</a>],
              ["Partnership types", <Chips key="p" items={r.partnershipTypes} />],
              ["Target audience", <Chips key="a" items={r.targetAudience} />],
              ["Goals", <Chips key="g" items={r.goals} />],
              ["Details", r.details],
            ]}
          />
        </div>
      )}
    />
  );
}

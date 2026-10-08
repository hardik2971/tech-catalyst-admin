"use client";

import { Link2, UsersRound } from "lucide-react";
import { ResourcePage } from "@/components/resource-page";
import { STATUS_OPTIONS } from "@/components/configs";
import { ContactHeader, DetailList, StatusBadge, StatusPanel } from "@/components/lead-detail";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/client";
import { can, useSession } from "@/components/session";

export default function CommunityPage() {
  const { me } = useSession();
  const manage = can(me, "manage");
  return (
    <ResourcePage
      resource="community"
      title="Community Applications"
      description="Submissions from the website's Join the Community form. Track review status and keep internal notes."
      icon={<UsersRound />}
      tabs={{ name: "status", items: STATUS_OPTIONS.slice(0, 5) }}
      filters={[{ name: "smsConsent", label: "SMS consent", options: [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] }]}
      dateRange
      canExport={manage}
      canDelete={manage}
      canEdit={manage}
      canCreate={false}
      searchPlaceholder="Search name, email, company, phone…"
      fields={[
        { name: "fullName", label: "Full name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "text" },
        { name: "company", label: "Company", type: "text", required: true },
        { name: "jobTitle", label: "Job title", type: "text", required: true },
        { name: "linkedin", label: "LinkedIn", type: "url" },
        { name: "smsConsent", label: "SMS marketing consent", type: "switch" },
        { name: "whyJoin", label: "Why join", type: "textarea", required: true },
        { name: "expectations", label: "Expectations", type: "textarea", required: true },
        { name: "lookingForward", label: "Looking forward to", type: "textarea", required: true },
      ]}
      columns={[
        {
          key: "fullName",
          header: "Applicant",
          sortable: true,
          render: (r) => (
            <div>
              <div className="font-semibold">{r.fullName}</div>
              <div className="text-xs text-muted">{r.email}</div>
            </div>
          ),
        },
        {
          key: "company",
          header: "Company",
          sortable: true,
          hide: "md",
          render: (r) => (
            <div>
              <div>{r.company}</div>
              <div className="text-xs text-muted">{r.jobTitle}</div>
            </div>
          ),
        },
        { key: "phone", header: "Phone", hide: "lg", render: (r) => <span className="text-muted">{r.phone || "—"}</span> },
        { key: "smsConsent", header: "SMS", hide: "lg", render: (r) => (r.smsConsent ? <Badge tone="green">Yes</Badge> : <Badge>No</Badge>) },
        { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
        { key: "createdAt", header: "Applied", sortable: true, render: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.createdAt)}</span> },
      ]}
      detailTitle={(r) => r.fullName}
      renderDetail={(r, h) => (
        <div className="space-y-6">
          <ContactHeader name={r.fullName} email={r.email} subtitle={`${r.jobTitle} · ${r.company}`} createdAt={r.createdAt} />
          {manage && <StatusPanel row={r} update={h.update} />}
          <DetailList
            items={[
              ["Phone", r.phone],
              ["LinkedIn", r.linkedin && <a href={r.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-brand hover:underline"><Link2 className="h-4 w-4" />{r.linkedin}</a>],
              ["SMS marketing consent", r.smsConsent ? "Yes" : "No"],
              ["Why do you want to join?", r.whyJoin],
              ["What do you expect from the community?", r.expectations],
              ["What are you looking forward to?", r.lookingForward],
            ]}
          />
        </div>
      )}
    />
  );
}

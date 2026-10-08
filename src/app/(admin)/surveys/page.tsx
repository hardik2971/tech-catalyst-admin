"use client";

import { MessageSquareText, Star } from "lucide-react";
import { ResourcePage, type Row } from "@/components/resource-page";
import { Chips, ContactHeader, DetailList, StatusBadge, StatusPanel } from "@/components/lead-detail";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/client";
import { can, useSession } from "@/components/session";

const OTHER = "Other (specify below)";

/** Friendly labels for the website survey wizards (composables/use*SurveyWizard.ts). */
const LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  company: "Company",
  jobTitle: "Job title",
  sector: "Sector",
  priority1: "Priority #1",
  priority2: "Priority #2",
  priority3: "Priority #3",
  cloudEnvironments: "Cloud environments",
  heardAbout: "How they heard about us",
  pressureAnswer: "Biggest pressure",
  truthAnswer: "Hard truth",
  futureExperiences: "Future experiences",
  futureTopics: "Future topics",
  lookingForward: "Looking forward to",
  satisfaction: "Overall satisfaction (1–5)",
  foodAndBeverage: "Food & beverage (1–5)",
  networking: "Networking",
  attendAgain: "Would attend again",
  enjoyedMost: "Enjoyed most",
  improvement: "Improvement / disliked",
  recommendations: "Speaker / sponsor recommendations",
  founderFollowUp: "Founder follow-up",
};

const human = (k: string) => LABELS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const name = (r: Row) => `${r.payload?.firstName ?? ""} ${r.payload?.lastName ?? ""}`.trim();

/** Merge "Other (specify below)" answers with their free-text companion fields. */
function payloadItems(payload: Record<string, unknown>): [string, React.ReactNode][] {
  const skip = new Set(["email", "firstName", "lastName"]);
  const out: [string, React.ReactNode][] = [];
  for (const [k, v] of Object.entries(payload ?? {})) {
    if (skip.has(k) || k.endsWith("Other")) continue;
    const other = payload[`${k.replace(/Answer$/, "")}Other`] ?? payload[`${k}Other`];
    if (Array.isArray(v)) {
      const items = v.map(String).filter((x) => x !== OTHER);
      if (v.includes(OTHER) && other) items.push(String(other));
      out.push([human(k), <Chips key={k} items={items} />]);
    } else {
      const s = v === OTHER && other ? String(other) : v == null ? "" : String(v);
      if (s) out.push([human(k), /^(satisfaction|foodAndBeverage)$/.test(k) ? <Rating key={k} value={Number(s)} /> : s]);
    }
  }
  return out;
}

function Rating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={i <= value ? "h-4 w-4 fill-warning text-warning" : "h-4 w-4 text-line"} />)}
      <span className="ml-1.5 text-sm font-semibold">{value}/5</span>
    </span>
  );
}

export default function SurveysPage() {
  const { me } = useSession();
  const manage = can(me, "manage");
  return (
    <ResourcePage
      resource="surveys"
      title="Survey Responses"
      description="Pre-event and post-event survey submissions. Export matches the website's survey Excel format."
      icon={<MessageSquareText />}
      tabs={{ name: "surveyType", items: [{ value: "pre-event", label: "Pre-event" }, { value: "post-event", label: "Post-event" }] }}
      dateRange
      canExport={manage}
      canDelete={manage}
      canEdit={false}
      canCreate={false}
      searchPlaceholder="Search email or any answer…"
      columns={[
        {
          key: "email",
          header: "Respondent",
          sortable: true,
          render: (r) => (
            <div>
              <div className="font-semibold">{name(r) || r.email}</div>
              {name(r) && <div className="text-xs text-muted">{r.email}</div>}
            </div>
          ),
        },
        { key: "surveyType", header: "Survey", sortable: true, render: (r) => <Badge tone={r.surveyType === "post-event" ? "violet" : "teal"}>{r.surveyType}</Badge> },
        {
          key: "summary",
          header: "Highlights",
          hide: "md",
          render: (r) =>
            r.surveyType === "post-event" && r.payload?.satisfaction ? (
              <Rating value={Number(r.payload.satisfaction)} />
            ) : (
              <span className="line-clamp-1 max-w-[280px] text-xs text-muted">{r.payload?.sector ?? r.payload?.company ?? "—"}</span>
            ),
        },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "createdAt", header: "Submitted", sortable: true, render: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.createdAt, true)}</span> },
      ]}
      detailTitle={(r) => (r.surveyType === "post-event" ? "Post-event survey" : "Pre-event survey")}
      renderDetail={(r, h) => (
        <div className="space-y-6">
          <ContactHeader name={name(r)} email={r.email} subtitle={<Badge tone={r.surveyType === "post-event" ? "violet" : "teal"}>{r.surveyType}</Badge>} createdAt={r.createdAt} />
          {manage && <StatusPanel row={r} update={h.update} />}
          <DetailList items={payloadItems(r.payload)} />
        </div>
      )}
    />
  );
}

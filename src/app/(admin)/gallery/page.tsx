"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Images } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, assetUrl, cn } from "@/lib/client";
import { PageHeader } from "@/components/page-header";
import { GalleryManager } from "@/components/gallery-manager";
import { Card, EmptyState, Skeleton } from "@/components/ui";

type Ev = { id: string; title: string; dateLabel: string; coverImage: string; status: string };

export default function GalleryPage() {
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [active, setActive] = useState("");

  useEffect(() => {
    api
      .get<{ data: Ev[] }>("/r/events", { params: { pageSize: "all", sort: "startDate", order: "DESC" } })
      .then((r) => {
        setEvents(r.data.data);
        // Default to the most recent past event (the ones with galleries)
        setActive(r.data.data.find((e) => e.status === "past")?.id ?? r.data.data[0]?.id ?? "");
      })
      .catch((e) => toast.error(apiError(e)));
  }, []);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Media Gallery"
        description="Recap videos and photo albums for each event — shown on the website's event gallery page."
        icon={<Images />}
      />
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <Card className="h-fit overflow-hidden xl:sticky xl:top-24">
          <div className="border-b border-line px-5 py-4 text-sm font-bold text-ink">Choose an event</div>
          <div className="max-h-[70vh] space-y-1 overflow-y-auto p-2">
            {!events
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)
              : events.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setActive(e.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition",
                      active === e.id ? "bg-brand-soft ring-1 ring-brand/30" : "hover:bg-surface-2",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={assetUrl(e.coverImage)} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-surface-2 object-cover" onError={(ev) => (ev.currentTarget.style.visibility = "hidden")} />
                    <div className="min-w-0">
                      <div className={cn("truncate text-[13px] font-semibold", active === e.id ? "text-brand" : "text-ink")}>{e.title}</div>
                      <div className="flex items-center gap-1 text-[11px] text-muted"><CalendarDays className="h-3 w-3" />{e.dateLabel}</div>
                    </div>
                  </button>
                ))}
          </div>
        </Card>
        <div>
          {active ? (
            <GalleryManager key={active} eventId={active} />
          ) : events ? (
            <Card><EmptyState icon={<Images className="h-6 w-6" />} title="No events yet" text="Create an event first, then add its gallery." /></Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

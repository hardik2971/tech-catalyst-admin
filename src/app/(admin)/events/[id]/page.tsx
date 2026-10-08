"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, ExternalLink, Images, LayoutList, MapPin, Pencil, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, assetUrl, formatDate } from "@/lib/client";
import { ResourceForm, type Row } from "@/components/resource-page";
import { EVENT_FIELDS, EVENT_STATUS_TONE } from "@/components/configs";
import { GalleryManager } from "@/components/gallery-manager";
import { Badge, Button, Card, CardHeader, ConfirmDialog, Skeleton, Tabs } from "@/components/ui";
import { can, useSession } from "@/components/session";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me } = useSession();
  const [event, setEvent] = useState<Row | null>(null);
  const [tab, setTab] = useState<"overview" | "gallery">("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [del, setDel] = useState(false);

  const load = useCallback(() => {
    api.get<Row>(`/r/events/${id}`).then((r) => setEvent(r.data)).catch((e) => toast.error(apiError(e, "Event not found")));
  }, [id]);
  useEffect(() => load(), [load]);

  async function remove() {
    try {
      await api.delete(`/r/events/${id}`);
      toast.success("Event deleted");
      router.replace("/events");
    } catch (e) {
      toast.error(apiError(e));
    }
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-6">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      {/* Hero */}
      <div className="bg-sidebar relative overflow-hidden rounded-3xl text-white shadow-2xl">

        <div className="relative flex flex-col gap-6 p-6 sm:p-10 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2">
              <Badge tone={EVENT_STATUS_TONE[event.status]} dot className="bg-white/90">{event.status}</Badge>
              {event.badge && <span className="rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-semibold">{event.badge}</span>}
              {event.isFeatured && <span className="rounded-full bg-warning/90 px-3 py-0.5 text-[11px] font-bold text-[#3b2600]">Featured</span>}
            </div>
            <h1 className="font-display mt-3 text-4xl leading-tight sm:text-5xl">{event.title}</h1>
            {event.edition && <p className="mt-1 text-white/70">{event.edition}</p>}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{event.dateLabel || formatDate(event.startDate, true)}</span>
              {event.timeLabel && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{event.timeLabel}</span>}
              {event.venueName && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venueName}{event.venueAddress ? ` — ${event.venueAddress}` : ""}</span>}
            </div>
          </div>
          <div className="flex flex-col items-start justify-between gap-5 lg:items-end">
            {event.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={assetUrl(event.coverImage)}
                alt={event.title}
                className="h-44 w-44 rounded-2xl object-cover shadow-xl ring-1 ring-white/15"
                onError={(ev) => (ev.currentTarget.style.display = "none")}
              />
            )}
          <div className="flex flex-wrap gap-2">
            {event.ticketUrl && (
              <a href={event.ticketUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/25 px-4 text-sm font-semibold whitespace-nowrap hover:bg-white/10">
                <Ticket className="h-4 w-4" /> {event.ticketLabel || "Tickets"} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <Button variant="secondary" className="!bg-white !text-[#06173f] hover:!bg-white/90" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>Edit details</Button>
            {can(me, "manage") && <Button variant="danger" size="icon" onClick={() => setDel(true)} aria-label="Delete event"><Trash2 className="h-4 w-4" /></Button>}
          </div>
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "overview", label: <span className="flex items-center gap-1.5"><LayoutList className="h-4 w-4" />Overview</span> },
          { value: "gallery", label: <span className="flex items-center gap-1.5"><Images className="h-4 w-4" />Gallery & media</span> },
        ]}
      />

      {tab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader title="About the event" subtitle="As rendered on the website event page" action={<Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>Edit</Button>} />
            <div className="p-6">
              {event.summary && <p className="mb-5 rounded-xl bg-brand-soft p-4 text-sm leading-relaxed text-ink">{event.summary}</p>}
              {event.descriptionHtml ? (
                <div className="prose-preview text-[15px] leading-relaxed text-ink" dangerouslySetInnerHTML={{ __html: event.descriptionHtml }} />
              ) : (
                <p className="text-sm text-muted">No description yet.</p>
              )}
            </div>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader title="Details" />
              <dl className="divide-y divide-line text-sm">
                {[
                  ["Slug", event.slug],
                  ["Starts", formatDate(event.startDate, true)],
                  ["Ends", formatDate(event.endDate, true)],
                  ["City", event.city],
                  ["Address", event.venueAddress],
                  ["Ticket link", event.ticketUrl],
                  ["Hover clip", event.clipUrl],
                  ["Sort order", event.sortOrder],
                  ["Last updated", formatDate(event.updatedAt, true)],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-4 px-5 py-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="max-w-[220px] truncate text-right font-medium text-ink" title={String(v ?? "")}>{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            {event.coverImage && (
              <Card className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(event.coverImage)} alt="" className="aspect-square w-full object-cover" />
              </Card>
            )}
          </div>
        </div>
      ) : (
        <GalleryManager eventId={id} />
      )}

      <ResourceForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        resource="events"
        label="Events"
        fields={EVENT_FIELDS}
        row={event}
        onSaved={(r) => {
          setEvent(r);
          setEditOpen(false);
        }}
      />
      <ConfirmDialog
        open={del}
        onClose={() => setDel(false)}
        onConfirm={remove}
        title="Delete this event?"
        text="The event and its entire gallery (videos and albums) will be permanently removed."
      />
    </div>
  );
}

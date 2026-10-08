"use client";

import Link from "next/link";
import { CalendarDays, ImageOff, MapPin, Pencil, Star, Trash2 } from "lucide-react";
import { ResourcePage } from "@/components/resource-page";
import { EVENT_FIELDS, EVENT_STATUS_TONE } from "@/components/configs";
import { Badge, Button } from "@/components/ui";
import { assetUrl, formatDate } from "@/lib/client";
import { can, useSession } from "@/components/session";

export default function EventsPage() {
  const { me } = useSession();
  return (
    <ResourcePage
      resource="events"
      title="Events"
      description="Every Tech Catalyst Summit edition — upcoming events, past events and drafts. Open an event to manage its gallery."
      icon={<CalendarDays />}
      createLabel="New event"
      fields={EVENT_FIELDS}
      defaults={{ status: "upcoming", isFeatured: false, sortOrder: 0 }}
      tabs={{ name: "status", items: [{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }, { value: "draft", label: "Drafts" }] }}
      canDelete={can(me, "manage")}
      canExport
      searchPlaceholder="Search events, venues, cities…"
      rowHref={(r) => `/events/${r.id}`}
      columns={[
        {
          key: "title",
          header: "Event",
          sortable: true,
          render: (r) => (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(r.coverImage)} alt="" className="h-11 w-11 rounded-xl bg-surface-2 object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-semibold">{r.title}{r.isFeatured && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}</div>
                <div className="text-xs text-muted">{r.edition}</div>
              </div>
            </div>
          ),
        },
        { key: "startDate", header: "Date", sortable: true, render: (r) => r.dateLabel || formatDate(r.startDate) },
        { key: "venueName", header: "Venue", hide: "md", render: (r) => <span className="text-muted">{r.venueName}{r.city ? `, ${r.city}` : ""}</span> },
        { key: "status", header: "Status", sortable: true, render: (r) => <Badge tone={EVENT_STATUS_TONE[r.status]} dot>{r.status}</Badge> },
      ]}
      card={(r, a) => (
        <div className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-xl">
          <Link href={`/events/${r.id}`} className="relative block aspect-square overflow-hidden bg-surface-2">
            {r.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(r.coverImage)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            ) : (
              <div className="grid h-full place-items-center text-muted"><ImageOff className="h-6 w-6" /></div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-3 left-3 flex gap-1.5">
              <Badge tone={EVENT_STATUS_TONE[r.status]} dot className="bg-surface/95 backdrop-blur">{r.status}</Badge>
              {r.isFeatured && <span className="rounded-full bg-warning px-2.5 py-0.5 text-[11px] font-bold text-[#3b2600]">Featured</span>}
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white">
              <CalendarDays className="h-3.5 w-3.5" /> {r.dateLabel || formatDate(r.startDate)}
            </div>
          </Link>
          <div className="p-4">
            <Link href={`/events/${r.id}`} className="line-clamp-2 font-bold leading-snug text-ink hover:text-brand">{r.title}</Link>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{r.venueName}{r.city ? ` · ${r.city}` : ""}</span></div>
            <div className="mt-4 flex items-center gap-2">
              <Link href={`/events/${r.id}`} className="flex-1"><Button variant="secondary" size="sm" className="w-full">Manage</Button></Link>
              <Button variant="ghost" size="icon" onClick={a.edit} aria-label="Quick edit"><Pencil className="h-4 w-4" /></Button>
              {can(me, "manage") && <Button variant="ghost" size="icon" className="hover:!text-danger" onClick={a.remove} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>}
            </div>
          </div>
        </div>
      )}
    />
  );
}

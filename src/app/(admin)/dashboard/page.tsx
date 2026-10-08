"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, Clock, ExternalLink, Handshake, Images, Mail, MapPin, MessageSquareText,
  Mic2, Star, Ticket, UsersRound, Video,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiError, assetUrl, cn, formatDate, timeAgo } from "@/lib/client";
import { Badge, Card, CardHeader, EmptyState, Skeleton, Tabs } from "@/components/ui";
import { useSession } from "@/components/session";

type Count = { total: number; last7: number; prev7: number };
type Dash = {
  stats: { community: Count; sponsorLeads: Count; surveys: Count; subscribers: Count; preSurveys: Count; postSurveys: Count; content: Record<string, number> };
  series: { day: string; community: number; sponsorLeads: number; surveys: number; subscribers: number }[];
  nextEvent: Record<string, string> | null;
  recent: { id: string; type: string; name: string | null; email: string; extra: string | null; createdAt: string }[];
  insights: {
    partnershipTypes: { name: string; value: number }[];
    goals: { name: string; value: number }[];
    audience: { name: string; value: number }[];
    satisfaction: number | null;
    foodAndBeverage: number | null;
    postResponses: number;
    communityStatus: { name: string; value: number }[];
  };
  activity: { id: string; adminName: string; action: string; entity: string; details: string; createdAt: string }[];
};

const SERIES = [
  { key: "community", label: "Community", color: "var(--series-1)" },
  { key: "sponsorLeads", label: "Sponsor leads", color: "var(--series-2)" },
  { key: "surveys", label: "Surveys", color: "var(--series-3)" },
  { key: "subscribers", label: "Subscribers", color: "var(--series-4)" },
] as const;

const RECENT_META: Record<string, { label: string; href: string; tone: "blue" | "amber" | "teal" | "violet" }> = {
  community: { label: "Community", href: "/community", tone: "blue" },
  "sponsor-lead": { label: "Sponsor lead", href: "/sponsor-leads", tone: "amber" },
  survey: { label: "Survey", href: "/surveys", tone: "teal" },
  subscriber: { label: "Subscriber", href: "/subscribers", tone: "violet" },
};

function Countdown({ target }: { target?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target || now == null) return null;
  const s = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
  const parts = [
    [Math.floor(s / 86400), "Days"],
    [Math.floor((s % 86400) / 3600), "Hours"],
    [Math.floor((s % 3600) / 60), "Min"],
    [s % 60, "Sec"],
  ] as const;
  return (
    <div className="flex gap-2">
      {parts.map(([v, l]) => (
        <div key={l} className="min-w-[58px] rounded-xl border border-white/15 bg-white/10 px-2 py-2 text-center backdrop-blur">
          <div className="text-xl font-bold tabular-nums">{String(v).padStart(2, "0")}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{l}</div>
        </div>
      ))}
    </div>
  );
}

function Kpi({ label, count, icon, href, accent }: { label: string; count?: Count; icon: ReactNode; href: string; accent: string }) {
  const delta = count ? count.last7 - count.prev7 : 0;
  return (
    <Link href={href}>
      <Card className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-xl">
        <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-[0.12] blur-2xl" style={{ background: accent }} />
        <div className="flex items-start justify-between">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-ink ring-1 ring-line [&_svg]:h-[18px] [&_svg]:w-[18px]">{icon}</div>
          {count && (
            <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold", delta >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
              {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)} vs last wk
            </span>
          )}
        </div>
        <div className="mt-4 text-[13px] font-medium text-muted">{label}</div>
        {count ? <div className="mt-1 text-3xl font-bold tracking-tight text-ink tabular-nums">{count.total.toLocaleString()}</div> : <Skeleton className="mt-2 h-8 w-20" />}
        <div className="mt-1 text-xs text-muted">{count ? `+${count.last7} in the last 7 days` : " "}</div>
      </Card>
    </Link>
  );
}

function BarList({ items, empty }: { items: { name: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.name} title={`${i.name}: ${i.value}`}>
          <div className="mb-1 flex justify-between gap-3 text-[13px]">
            <span className="truncate font-medium text-ink capitalize">{i.name.replace(/_/g, " ")}</span>
            <span className="font-semibold text-muted tabular-nums">{i.value}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2">
            <div className="h-2 rounded-full bg-[var(--series-1)]" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((a, p) => a + (p.value || 0), 0);
  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs shadow-xl">
      <div className="mb-1.5 font-bold text-ink">{formatDate(label)}</div>
      {SERIES.map((s) => {
        const v = payload.find((p) => p.dataKey === s.key)?.value ?? 0;
        return (
          <div key={s.key} className="flex items-center justify-between gap-6 py-0.5 text-muted">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.label}</span>
            <b className="text-ink tabular-nums">{v}</b>
          </div>
        );
      })}
      <div className="mt-1.5 flex justify-between border-t border-line pt-1.5 font-semibold text-ink"><span>Total</span><span className="tabular-nums">{total}</span></div>
    </div>
  );
}

export default function DashboardPage() {
  const { me } = useSession();
  const [days, setDays] = useState<"30" | "90">("30");
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    api.get<Dash>("/dashboard", { params: { days } }).then((r) => setData(r.data)).catch((e) => toast.error(apiError(e, "Failed to load dashboard")));
  }, [days]);

  const totals = useMemo(() => {
    const t = { community: 0, sponsorLeads: 0, surveys: 0, subscribers: 0 };
    data?.series.forEach((d) => SERIES.forEach((s) => (t[s.key] += d[s.key])));
    return t;
  }, [data]);

  const ev = data?.nextEvent;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const c = data?.stats.content;

  return (
    <div className="animate-fade-up space-y-6">
      {/* Hero */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <div className="flex flex-col justify-center">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Dashboard</div>
          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl" suppressHydrationWarning>
            {greeting}, <span className="text-brand-gradient">{me?.name?.split(" ")[0] ?? "there"}</span>
          </h1>
          <p className="mt-3 max-w-lg text-[15px] text-muted">
            Here&apos;s what&apos;s happening across Tech Catalyst Summit — live from the website database.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { l: "Upcoming events", v: c?.upcomingEvents, i: <CalendarDays className="h-3.5 w-3.5" /> },
              { l: "Speakers", v: c?.speakers, i: <Mic2 className="h-3.5 w-3.5" /> },
              { l: "Partners", v: c?.sponsors, i: <Handshake className="h-3.5 w-3.5" /> },
              { l: "Gallery media", v: c?.mediaItems, i: <Images className="h-3.5 w-3.5" /> },
              { l: "Videos", v: c?.videos, i: <Video className="h-3.5 w-3.5" /> },
            ].map((x) => (
              <span key={x.l} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
                <span className="text-brand">{x.i}</span>{x.l}<b className="text-ink tabular-nums">{x.v ?? "–"}</b>
              </span>
            ))}
          </div>
        </div>

        {/* Next event */}
        <div className="bg-sidebar relative overflow-hidden rounded-3xl text-white shadow-2xl">
          <div className="relative flex h-full flex-col justify-between gap-6 p-6 sm:p-8">
            {!data ? (
              <Skeleton className="h-40 w-full bg-white/10" />
            ) : !ev ? (
              <div className="py-10 text-center text-white/70">No upcoming event. <Link href="/events" className="font-semibold text-white underline">Create one →</Link></div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#0dc9c9]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#7fe8e8]">Next event</span>
                    {ev.badge && <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">{ev.badge}</span>}
                  </div>
                  <h2 className="font-display mt-3 max-w-md text-3xl leading-tight">{ev.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/75">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{ev.dateLabel || formatDate(ev.startDate)}</span>
                    {ev.timeLabel && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{ev.timeLabel}</span>}
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{ev.venueName}{ev.city ? `, ${ev.city}` : ""}</span>
                  </div>
                </div>
                {ev.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={assetUrl(ev.coverImage)}
                    alt={ev.title}
                    className="hidden h-40 w-40 shrink-0 rounded-2xl object-cover 2xl:h-48 2xl:w-48 shadow-xl ring-1 ring-white/15 sm:block"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <Countdown target={ev.startDate} />
                  <div className="flex gap-2">
                    <Link href={`/events/${ev.id}`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#06173f] hover:bg-white/90">Manage event</Link>
                    {ev.ticketUrl && (
                      <a href={ev.ticketUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
                        <Ticket className="h-4 w-4" /> Tickets
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Community applications" count={data?.stats.community} icon={<UsersRound />} href="/community" accent="var(--series-1)" />
        <Kpi label="Sponsor leads" count={data?.stats.sponsorLeads} icon={<Handshake />} href="/sponsor-leads" accent="var(--series-2)" />
        <Kpi label="Survey responses" count={data?.stats.surveys} icon={<MessageSquareText />} href="/surveys" accent="var(--series-3)" />
        <Kpi label="Gallery subscribers" count={data?.stats.subscribers} icon={<Mail />} href="/subscribers" accent="var(--series-4)" />
      </div>

      {/* Trend + recent */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="flex flex-col">
          <CardHeader
            title="Website submissions"
            subtitle={`Daily form submissions · last ${days} days`}
            action={<Tabs value={days} onChange={setDays} items={[{ value: "30", label: "30d" }, { value: "90", label: "90d" }]} />}
          />
          <div className="px-5 pt-4">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {SERIES.map((s) => (
                <span key={s.key} className="flex items-center gap-2 text-xs text-muted">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                  {s.label} <b className="text-ink tabular-nums">{totals[s.key]}</b>
                </span>
              ))}
            </div>
          </div>
          <div className="h-[300px] px-2 pt-2 pb-4 xl:h-auto xl:min-h-[300px] xl:flex-1">
            {data ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series} margin={{ top: 12, right: 16, left: -12, bottom: 0 }} barCategoryGap={days === "30" ? "22%" : "12%"}>
                  <CartesianGrid vertical={false} stroke="var(--grid)" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted)" }}
                    tickFormatter={(d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                    minTickGap={24}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)" }} width={40} />
                  <Tooltip cursor={{ fill: "var(--brand-soft)" }} content={<TrendTooltip />} />
                  {SERIES.map((s, i) => (
                    <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} stroke="var(--surface)" strokeWidth={2} radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={28} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Latest submissions" subtitle="Across all website forms" />
          <div className="flex-1 divide-y divide-line">
            {!data ? (
              <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : data.recent.length === 0 ? (
              <EmptyState title="No submissions yet" text="New form entries from the website appear here." />
            ) : (
              data.recent.map((r) => {
                const m = RECENT_META[r.type];
                return (
                  <Link key={`${r.type}-${r.id}`} href={m.href} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{r.name || r.email}</div>
                      <div className="truncate text-xs text-muted">{r.name ? r.email : ""}{r.extra ? ` · ${r.extra}` : ""}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={m.tone}>{m.label}</Badge>
                      <span className="text-[11px] text-muted">{timeAgo(r.createdAt)}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Sponsorship interest" subtitle="Partnership types requested by leads" icon={<Handshake className="h-4 w-4" />} />
          <div className="p-5">{data ? <BarList items={data.insights.partnershipTypes} empty="No sponsor leads yet" /> : <Skeleton className="h-40" />}</div>
        </Card>
        <Card>
          <CardHeader title="Community pipeline" subtitle="Application review status" icon={<UsersRound className="h-4 w-4" />} />
          <div className="p-5">{data ? <BarList items={data.insights.communityStatus} empty="No applications yet" /> : <Skeleton className="h-40" />}</div>
        </Card>
        <Card>
          <CardHeader title="Post-event feedback" subtitle={`${data?.insights.postResponses ?? 0} post-event responses`} icon={<Star className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-4 p-5">
            {[
              { l: "Overall satisfaction", v: data?.insights.satisfaction },
              { l: "Food & beverage", v: data?.insights.foodAndBeverage },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="text-xs font-medium text-muted">{x.l}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-ink tabular-nums">{x.v ?? "–"}</span>
                  <span className="text-sm text-muted">/ 5</span>
                </div>
              </div>
            ))}
            <div className="col-span-2 rounded-2xl border border-line p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Pre-event surveys</span><b className="text-ink tabular-nums">{data?.stats.preSurveys.total ?? "–"}</b>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted">Post-event surveys</span><b className="text-ink tabular-nums">{data?.stats.postSurveys.total ?? "–"}</b>
              </div>
              <Link href="/surveys" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">View responses <ExternalLink className="h-3 w-3" /></Link>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent admin activity" subtitle="Who changed what" action={<Link href="/activity" className="text-xs font-semibold text-brand hover:underline">View all</Link>} />
        <ul className="divide-y divide-line">
          {data?.activity.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">No activity yet.</li>}
          {data?.activity.map((a) => (
            <li key={a.id} className="flex items-center gap-4 px-5 py-3 text-sm">
              <Badge tone={a.action === "delete" ? "red" : a.action === "create" ? "green" : a.action === "login" ? "gray" : "blue"}>{a.action}</Badge>
              <span className="min-w-0 flex-1 truncate text-ink">{a.details}</span>
              <span className="hidden text-xs text-muted sm:block">{a.adminName}</span>
              <span className="text-xs whitespace-nowrap text-muted">{timeAgo(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

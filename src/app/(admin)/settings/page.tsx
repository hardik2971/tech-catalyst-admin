"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BadgePercent, Building2, FileText, Globe, Save, Settings, Share2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/client";
import { PageHeader } from "@/components/page-header";
import { Button, Card, CardHeader, Field, Input, Skeleton, Textarea } from "@/components/ui";
import { can, useSession } from "@/components/session";

type S = { key: string; label: string; type?: "text" | "textarea" | "url" | "email"; hint?: string; rows?: number };
const GROUPS: { title: string; subtitle: string; icon: ReactNode; items: S[] }[] = [
  {
    title: "General",
    subtitle: "Brand and contact details",
    icon: <Building2 className="h-4 w-4" />,
    items: [
      { key: "siteName", label: "Site name" },
      { key: "tagline", label: "Tagline" },
      { key: "contactEmail", label: "Contact email", type: "email", hint: "Receives community & survey notifications" },
      { key: "websiteUrl", label: "Website URL", type: "url" },
      { key: "upcomingEventsUrl", label: "Upcoming events URL", type: "url" },
    ],
  },
  {
    title: "Social links",
    subtitle: "Footer and email links",
    icon: <Share2 className="h-4 w-4" />,
    items: [
      { key: "instagramUrl", label: "Instagram", type: "url" },
      { key: "linkedinUrl", label: "LinkedIn", type: "url" },
      { key: "xUrl", label: "X (Twitter)", type: "url" },
    ],
  },
  {
    title: "Tickets & promotion",
    subtitle: "Ticketing, countdown and VIP perk used in emails",
    icon: <Ticket className="h-4 w-4" />,
    items: [
      { key: "ticketsUrl", label: "Default tickets URL", type: "url" },
      { key: "countdownTarget", label: "Home countdown target", hint: "Format: YYYY-MM-DD HH:mm:ss (event local time)" },
      { key: "vipDiscountCode", label: "VIP discount code" },
      { key: "vipDiscountPercent", label: "VIP discount (%)" },
      { key: "sponsorVideoYoutubeId", label: "Sponsor page YouTube video ID" },
      { key: "metaPixelId", label: "Meta Pixel ID" },
    ],
  },
  {
    title: "Page content",
    subtitle: "Copy for About, Sponsor and FAQ pages",
    icon: <FileText className="h-4 w-4" />,
    items: [
      { key: "aboutText", label: "About us text", type: "textarea", rows: 8 },
      { key: "sponsorHeroSubheadline", label: "Sponsor hero — subheadline", type: "textarea", rows: 2 },
      { key: "sponsorHeroSupporting", label: "Sponsor hero — supporting text", type: "textarea", rows: 3 },
      { key: "sponsorFormIntro", label: "Sponsor form intro", type: "textarea", rows: 3 },
      { key: "faqHeroTitle", label: "FAQ hero title" },
      { key: "faqHeroText", label: "FAQ hero text", type: "textarea", rows: 3 },
    ],
  },
];

export default function SettingsPage() {
  const { me } = useSession();
  const editable = can(me, "manage");
  const [initial, setInitial] = useState<Record<string, string> | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Record<string, string>>("/settings").then((r) => { setInitial(r.data); setValues(r.data); }).catch((e) => toast.error(apiError(e)));
  }, []);

  const dirty = useMemo(() => (initial ? Object.keys(values).filter((k) => values[k] !== (initial[k] ?? "")) : []), [values, initial]);
  const known = new Set(GROUPS.flatMap((g) => g.items.map((i) => i.key)));
  const extra = Object.keys(values).filter((k) => !known.has(k));

  async function save() {
    setSaving(true);
    try {
      await api.put("/settings", Object.fromEntries(dirty.map((k) => [k, values[k]])));
      setInitial({ ...values });
      toast.success("Settings saved");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  const render = (s: S) => (
    <Field key={s.key} label={s.label} hint={s.hint} className={s.type === "textarea" ? "sm:col-span-2" : ""}>
      {s.type === "textarea" ? (
        <Textarea rows={s.rows} disabled={!editable} value={values[s.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))} />
      ) : (
        <Input type={s.type ?? "text"} disabled={!editable} value={values[s.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))} />
      )}
    </Field>
  );

  return (
    <div className="animate-fade-up space-y-6 pb-20">
      <PageHeader
        title="Site Settings"
        description="Global website values stored in the shared database (SiteSetting table)."
        icon={<Settings />}
        actions={editable && <Button icon={<Save className="h-4 w-4" />} disabled={!dirty.length} loading={saving} onClick={save}>Save {dirty.length ? `(${dirty.length})` : ""}</Button>}
      />
      {!initial ? (
        <div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {GROUPS.map((g) => (
            <Card key={g.title} className={g.title === "Page content" ? "lg:col-span-2" : ""}>
              <CardHeader title={g.title} subtitle={g.subtitle} icon={g.icon} />
              <div className="grid gap-4 p-5 sm:grid-cols-2">{g.items.map(render)}</div>
            </Card>
          ))}
          {extra.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader title="Other settings" icon={<Globe className="h-4 w-4" />} />
              <div className="grid gap-4 p-5 sm:grid-cols-2">{extra.map((k) => render({ key: k, label: k }))}</div>
            </Card>
          )}
        </div>
      )}
      {dirty.length > 0 && editable && (
        <div className="animate-pop fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-3 shadow-2xl lg:ml-[136px]">
          <BadgePercent className="h-4 w-4 text-brand" />
          <span className="text-sm text-ink">{dirty.length} unsaved change{dirty.length > 1 ? "s" : ""}</span>
          <Button size="sm" variant="ghost" onClick={() => setValues(initial!)}>Discard</Button>
          <Button size="sm" loading={saving} onClick={save}>Save changes</Button>
        </div>
      )}
    </div>
  );
}

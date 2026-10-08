import { handler } from "@/lib/api";
import { query, queryOne } from "@/lib/db";
import { serialize } from "@/lib/crud";
import { RESOURCES } from "@/lib/resources";

type Count = { total: number; last7: number; prev7: number };

async function counts(table: string, where = "1=1"): Promise<Count> {
  const row = await queryOne<Count>(
    `SELECT COUNT(*) AS total,
      SUM(createdAt >= UTC_TIMESTAMP() - INTERVAL 7 DAY) AS last7,
      SUM(createdAt < UTC_TIMESTAMP() - INTERVAL 7 DAY AND createdAt >= UTC_TIMESTAMP() - INTERVAL 14 DAY) AS prev7
     FROM \`${table}\` WHERE ${where}`,
  );
  return { total: Number(row?.total ?? 0), last7: Number(row?.last7 ?? 0), prev7: Number(row?.prev7 ?? 0) };
}

async function daily(table: string, days: number) {
  return query<{ day: string; cnt: number }>(
    `SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS day, COUNT(*) AS cnt FROM \`${table}\`
     WHERE createdAt >= UTC_DATE() - INTERVAL ? DAY GROUP BY day`,
    [days - 1],
  );
}

const toArr = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
};

function tally(lists: string[][], top = 6) {
  const m = new Map<string, number>();
  lists.flat().forEach((x) => m.set(x, (m.get(x) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, top).map(([name, value]) => ({ name, value }));
}

export const GET = handler(async (req) => {
  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get("days")) || 30, 7), 180);

  const [community, sponsorLeads, surveys, subscribers, preSurveys, postSurveys] = await Promise.all([
    counts("CommunityApplication"),
    counts("SponsorLead"),
    counts("RooftopSurveyResponse"),
    counts("GalleryEmail"),
    counts("RooftopSurveyResponse", "surveyType = 'pre-event'"),
    counts("RooftopSurveyResponse", "surveyType = 'post-event'"),
  ]);

  const [content] = await query<Record<string, number>>(
    `SELECT
      (SELECT COUNT(*) FROM Event WHERE status = 'upcoming') AS upcomingEvents,
      (SELECT COUNT(*) FROM Event WHERE status = 'past') AS pastEvents,
      (SELECT COUNT(*) FROM Speaker WHERE isActive = 1) AS speakers,
      (SELECT COUNT(*) FROM Sponsor WHERE isActive = 1) AS sponsors,
      (SELECT COUNT(*) FROM EventGalleryVideo) AS videos,
      (SELECT COALESCE(SUM(JSON_LENGTH(media)), 0) FROM EventGalleryAlbum) AS mediaItems`,
  );

  // Daily series for the trend chart
  const [sc, ss, sv, sg] = await Promise.all([
    daily("CommunityApplication", days),
    daily("SponsorLead", days),
    daily("RooftopSurveyResponse", days),
    daily("GalleryEmail", days),
  ]);
  const idx = (rows: { day: string; cnt: number }[]) => new Map(rows.map((r) => [r.day, Number(r.cnt)]));
  const [mc, ms, mv, mg] = [idx(sc), idx(ss), idx(sv), idx(sg)];
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (days - 1 - i));
    const day = d.toISOString().slice(0, 10);
    return { day, community: mc.get(day) ?? 0, sponsorLeads: ms.get(day) ?? 0, surveys: mv.get(day) ?? 0, subscribers: mg.get(day) ?? 0 };
  });

  // Next upcoming event (falls back to the featured one)
  const nextEventRow =
    (await queryOne(
      "SELECT * FROM Event WHERE status = 'upcoming' AND (startDate IS NULL OR startDate >= UTC_TIMESTAMP()) ORDER BY startDate ASC LIMIT 1",
    )) ?? (await queryOne("SELECT * FROM Event WHERE isFeatured = 1 ORDER BY startDate DESC LIMIT 1"));
  const nextEvent = nextEventRow ? serialize(RESOURCES.events, nextEventRow) : null;

  // Recent submissions across all website forms
  const recent = await query(
    `(SELECT id, 'community' AS type, fullName AS name, email, company AS extra, createdAt FROM CommunityApplication ORDER BY createdAt DESC LIMIT 6)
     UNION ALL (SELECT id, 'sponsor-lead', fullName, workEmail, company, createdAt FROM SponsorLead ORDER BY createdAt DESC LIMIT 6)
     UNION ALL (SELECT id, 'survey', JSON_UNQUOTE(JSON_EXTRACT(payload, '$.firstName')), email, surveyType, createdAt FROM RooftopSurveyResponse ORDER BY createdAt DESC LIMIT 6)
     UNION ALL (SELECT id, 'subscriber', NULL, email, NULL, createdAt FROM GalleryEmail ORDER BY createdAt DESC LIMIT 6)
     ORDER BY createdAt DESC LIMIT 10`,
  );

  // Insights
  const leads = await query<{ partnershipTypes: unknown; goals: unknown; targetAudience: unknown }>(
    "SELECT partnershipTypes, goals, targetAudience FROM SponsorLead",
  );
  const post = await query<{ payload: unknown }>("SELECT payload FROM RooftopSurveyResponse WHERE surveyType = 'post-event'");
  const ratings = post
    .map((p) => (typeof p.payload === "string" ? JSON.parse(p.payload) : p.payload) as Record<string, unknown>)
    .map((p) => ({ s: Number(p?.satisfaction), f: Number(p?.foodAndBeverage), again: String(p?.attendAgain ?? "") }));
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  const sat = ratings.map((r) => r.s).filter((n) => n > 0);
  const fb = ratings.map((r) => r.f).filter((n) => n > 0);

  const statusRows = await query<{ status: string; cnt: number }>(
    `SELECT COALESCE(m.status, 'new') AS status, COUNT(*) AS cnt FROM CommunityApplication t
     LEFT JOIN AdminRecordMeta m ON m.recordType = 'community' AND m.recordId = t.id GROUP BY status`,
  );

  const activity = await query(
    "SELECT id, adminName, action, entity, details, createdAt FROM AdminActivityLog ORDER BY createdAt DESC LIMIT 8",
  );

  return {
    stats: { community, sponsorLeads, surveys, subscribers, preSurveys, postSurveys, content },
    series,
    nextEvent,
    recent: recent.map((r) => ({ ...r, createdAt: (r.createdAt as Date)?.toISOString?.() ?? r.createdAt })),
    insights: {
      partnershipTypes: tally(leads.map((l) => toArr(l.partnershipTypes))),
      goals: tally(leads.map((l) => toArr(l.goals))),
      audience: tally(leads.map((l) => toArr(l.targetAudience))),
      satisfaction: avg(sat),
      foodAndBeverage: avg(fb),
      postResponses: ratings.length,
      communityStatus: statusRows.map((s) => ({ name: s.status, value: Number(s.cnt) })),
    },
    activity: activity.map((a) => ({ ...a, createdAt: (a.createdAt as Date)?.toISOString?.() ?? a.createdAt })),
  };
});

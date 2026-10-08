import type { Pool } from "mysql2/promise";
import { randomUUID } from "crypto";
import { SEED_EVENTS, SEED_FAQS, SEED_PACKAGES, SEED_SETTINGS, SEED_SPEAKERS, SEED_SPONSORS } from "./seed-data";

async function isEmpty(pool: Pool, table: string) {
  const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
  return Number((rows as { cnt: number }[])[0].cnt) === 0;
}

/**
 * Fills each content table with the website's current content — only when that
 * table is empty, so edits made in the admin are never overwritten.
 */
export async function seedContent(pool: Pool) {
  if (await isEmpty(pool, "Event")) {
    for (const [i, e] of SEED_EVENTS.entries()) {
      const id = randomUUID();
      await pool.query(
        `INSERT INTO Event (id, title, slug, edition, status, badge, startDate, dateLabel, timeLabel, venueName,
          venueAddress, city, coverImage, clipUrl, ticketUrl, ticketLabel, summary, descriptionHtml, isFeatured, sortOrder)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id, e.title, e.slug, e.edition, e.status, e.badge ?? null, new Date(e.startDate), e.dateLabel,
          e.timeLabel ?? null, e.venueName, e.venueAddress, e.city, e.coverImage, e.clipUrl ?? null,
          e.ticketUrl ?? null, e.ticketLabel ?? null, e.summary ?? null, e.descriptionHtml ?? null,
          e.isFeatured ? 1 : 0, i,
        ],
      );
      for (const [j, v] of e.videos.entries()) {
        await pool.query("INSERT INTO EventGalleryVideo (id, eventId, title, url, sortOrder) VALUES (?,?,?,?,?)", [
          randomUUID(), id, v.title, v.url, j,
        ]);
      }
      for (const [j, a] of e.albums.entries()) {
        await pool.query("INSERT INTO EventGalleryAlbum (id, eventId, label, media, sortOrder) VALUES (?,?,?,?,?)", [
          randomUUID(), id, a.label, JSON.stringify(a.media), j,
        ]);
      }
    }
    console.log(`[admin] seeded ${SEED_EVENTS.length} events with gallery`);
  }

  if (await isEmpty(pool, "Speaker")) {
    for (const [i, s] of SEED_SPEAKERS.entries()) {
      await pool.query(
        "INSERT INTO Speaker (id, name, position, bio, image, category, isFounder, sortOrder) VALUES (?,?,?,?,?,?,?,?)",
        [randomUUID(), s.name, s.position, s.bio, s.image, s.category, s.isFounder ? 1 : 0, i],
      );
    }
  }

  if (await isEmpty(pool, "Sponsor")) {
    for (const [i, s] of SEED_SPONSORS.entries()) {
      await pool.query(
        "INSERT INTO Sponsor (id, name, subtitle, logo, tier, isMain, sortOrder) VALUES (?,?,?,?,?,?,?)",
        [randomUUID(), s.name, s.subtitle, s.logo, "Platinum Partners", s.isMain ? 1 : 0, i],
      );
    }
  }

  if (await isEmpty(pool, "SponsorshipPackage")) {
    for (const [i, p] of SEED_PACKAGES.entries()) {
      await pool.query("INSERT INTO SponsorshipPackage (id, title, description, sortOrder) VALUES (?,?,?,?)", [
        randomUUID(), p.title, p.description, i,
      ]);
    }
  }

  if (await isEmpty(pool, "Faq")) {
    for (const [i, f] of SEED_FAQS.entries()) {
      await pool.query("INSERT INTO Faq (id, title, description, icon, articleCount, sortOrder) VALUES (?,?,?,?,?,?)", [
        randomUUID(), f.title, f.description, f.icon, f.articleCount, i,
      ]);
    }
  }

  // Settings: add any missing keys, keep existing values.
  for (const [key, value] of Object.entries(SEED_SETTINGS)) {
    await pool.query("INSERT IGNORE INTO SiteSetting (`key`, value) VALUES (?, ?)", [key, value]);
  }
}

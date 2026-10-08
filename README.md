# Tech Catalyst Summit — Admin Console

Next.js 16 (App Router) admin panel for the Tech Catalyst Summit website
(`../tech-catalyst-summit`, Nuxt). It uses **the same MySQL database** as the website,
talks to MySQL directly with `mysql2` (no Prisma, no Redis), and the UI calls its own
API routes with **axios**.

## Run

```bash
npm install
npm run dev        # http://localhost:2002
# production
npm run build && npm start
```

Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`
(default `admin@techcatalystsummit.com` / `Admin@TCS2026`) — change it under **Profile** after the first login.

Check the database connection any time: `GET /api/health`.

## What happens on first start

On the first API request the server runs an idempotent bootstrap (`src/lib/schema.ts`):

1. `CREATE TABLE IF NOT EXISTS` for the admin tables (below). The website's own tables are
   only created if missing — existing tables and their data are never altered.
2. Creates the first super admin if `AdminUser` is empty.
3. Seeds each content table **only if it is empty** with what the website currently hard-codes
   (`src/lib/seed-data.ts`): 7 events with their full gallery (14 videos, 12 albums, ~930 media items),
   6 speakers, 15 partners, 7 sponsorship packages, 6 FAQ categories and site settings.

## Modules

| Area | Data | Table |
|---|---|---|
| Dashboard | KPIs, 30/90-day submission trend, next event countdown, insights, activity | all |
| Events | upcoming / past / draft, venue, tickets, cover, hover clip, HTML description | `Event` |
| Media Gallery | YouTube recap videos + photo/video albums (upload or paste URLs) | `EventGalleryVideo`, `EventGalleryAlbum` |
| Speakers | featured / previous, founders flag, bio, headshot | `Speaker` |
| Partners & Sponsors | logos, tier, main-carousel flag | `Sponsor` |
| Sponsorship Packages | sponsor-page opportunities | `SponsorshipPackage` |
| FAQs | FAQ page categories | `Faq` |
| Community Applications | website Join-Community form | `CommunityApplication` *(website)* |
| Sponsor Leads | website sponsor form | `SponsorLead` *(website)* |
| Survey Responses | pre/post-event surveys | `RooftopSurveyResponse` *(website)* |
| Gallery Subscribers | gallery unlock emails | `GalleryEmail` *(website)* |
| Site Settings | contact, socials, tickets, VIP code, countdown, page copy | `SiteSetting` |
| Admin Users | super_admin / admin / editor | `AdminUser` |
| Activity Log | audit trail of every change | `AdminActivityLog` |

Lead **status and internal notes** are stored in `AdminRecordMeta`, a side table, so the
website's Sequelize tables are never modified (safe even with `DB_SYNC=alter` on the website).

Every list supports search, filters/tabs, date range, sorting, pagination, bulk delete and
**Excel export** (survey export matches the website's `/api/survey-export` format).

### Roles
- **super_admin** — everything, including admin users
- **admin** — content, submissions (status/notes/edit/delete), settings, exports
- **editor** — content only; no deletes, exports, settings or submission changes

## API

All under `/api`, cookie session (httpOnly JWT, 7 days):

```
POST /auth/login · POST /auth/logout · GET|PUT /auth/me
GET|POST|DELETE(bulk) /r/:resource          ?q&page&pageSize&sort&order&from&to&<filter>
GET|PUT|DELETE       /r/:resource/:id
GET /export/:resource                        same filters → .xlsx
GET /dashboard?days=30 · GET|PUT /settings · GET|POST /admins · PUT|DELETE /admins/:id
POST /upload (multipart: files[], folder) · GET /health
```
Resources: `events, gallery-videos, gallery-albums, speakers, sponsors, packages, faqs,
community, sponsor-leads, surveys, subscribers, activity` (see `src/lib/resources.ts`).

## Media

Image paths are stored as the website uses them (`/event/…`, `/speaker/…`). Previews load from
`NEXT_PUBLIC_SITE_URL`, so run the website alongside the admin to see them.
Uploads are written to `UPLOAD_DIR` (default `../tech-catalyst-summit/public/uploads`) and saved as
`/uploads/…` paths. Note: a built Nuxt site serves `public/` from its build output, so in production
point `UPLOAD_DIR` at a folder your web server serves.

## Website integration

The website is **not** wired to these tables yet — it still renders its hard-coded content.
Submissions (community, sponsor leads, surveys, subscribers) are already live because both
apps share those tables.

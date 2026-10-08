import type { Pool } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { seedContent } from "./seed";

const TABLE_OPTS = "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

/**
 * Tables the Nuxt website already owns (created by its Sequelize models).
 * Mirrored here with CREATE TABLE IF NOT EXISTS so the admin also works on a
 * fresh database — existing tables and their data are never touched.
 */
const WEBSITE_TABLES = [
  `CREATE TABLE IF NOT EXISTS RooftopSurveyResponse (
    id CHAR(36) BINARY NOT NULL,
    email VARCHAR(191) NOT NULL,
    surveyType ENUM('pre-event','post-event') NOT NULL DEFAULT 'pre-event',
    payload JSON NOT NULL,
    createdAt DATETIME NOT NULL,
    PRIMARY KEY (id)
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS GalleryEmail (
    id CHAR(36) BINARY NOT NULL,
    email VARCHAR(191) NOT NULL,
    createdAt DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS CommunityApplication (
    id CHAR(36) BINARY NOT NULL,
    fullName VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL,
    phone VARCHAR(32) NULL,
    company VARCHAR(191) NOT NULL,
    jobTitle VARCHAR(191) NOT NULL,
    linkedin VARCHAR(255) NULL,
    whyJoin TEXT NOT NULL,
    expectations TEXT NOT NULL,
    lookingForward TEXT NOT NULL,
    smsConsent TINYINT(1) NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL,
    PRIMARY KEY (id)
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS SponsorLead (
    id CHAR(36) BINARY NOT NULL,
    fullName VARCHAR(191) NOT NULL,
    workEmail VARCHAR(191) NOT NULL,
    company VARCHAR(191) NOT NULL,
    jobTitle VARCHAR(191) NOT NULL,
    linkedin VARCHAR(255) NULL,
    website VARCHAR(255) NOT NULL,
    partnershipTypes JSON NOT NULL,
    targetAudience JSON NOT NULL,
    goals JSON NOT NULL,
    details TEXT NOT NULL,
    createdAt DATETIME NOT NULL,
    PRIMARY KEY (id)
  ) ${TABLE_OPTS}`,
];

/** Tables owned by the admin panel (website content + admin data). */
const ADMIN_TABLES = [
  `CREATE TABLE IF NOT EXISTS AdminUser (
    id CHAR(36) NOT NULL,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role ENUM('super_admin','admin','editor') NOT NULL DEFAULT 'admin',
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    lastLoginAt DATETIME NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_email (email)
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS Event (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(191) NOT NULL,
    edition VARCHAR(191) NULL,
    status ENUM('upcoming','past','draft') NOT NULL DEFAULT 'upcoming',
    badge VARCHAR(100) NULL,
    startDate DATETIME NULL,
    endDate DATETIME NULL,
    dateLabel VARCHAR(100) NULL,
    timeLabel VARCHAR(100) NULL,
    venueName VARCHAR(191) NULL,
    venueAddress VARCHAR(255) NULL,
    city VARCHAR(191) NULL,
    coverImage VARCHAR(500) NULL,
    clipUrl VARCHAR(500) NULL,
    ticketUrl VARCHAR(500) NULL,
    ticketLabel VARCHAR(100) NULL,
    summary TEXT NULL,
    descriptionHtml MEDIUMTEXT NULL,
    isFeatured TINYINT(1) NOT NULL DEFAULT 0,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_event_slug (slug)
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS EventGalleryVideo (
    id CHAR(36) NOT NULL,
    eventId CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_video_event (eventId),
    CONSTRAINT fk_video_event FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS EventGalleryAlbum (
    id CHAR(36) NOT NULL,
    eventId CHAR(36) NOT NULL,
    label VARCHAR(191) NOT NULL,
    media JSON NOT NULL,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_album_event (eventId),
    CONSTRAINT fk_album_event FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS Speaker (
    id CHAR(36) NOT NULL,
    name VARCHAR(191) NOT NULL,
    position VARCHAR(255) NULL,
    bio TEXT NULL,
    image VARCHAR(500) NULL,
    linkedin VARCHAR(500) NULL,
    category ENUM('featured','previous') NOT NULL DEFAULT 'featured',
    isFounder TINYINT(1) NOT NULL DEFAULT 0,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS Sponsor (
    id CHAR(36) NOT NULL,
    name VARCHAR(191) NOT NULL,
    subtitle VARCHAR(255) NULL,
    logo VARCHAR(500) NULL,
    website VARCHAR(500) NULL,
    tier VARCHAR(100) NOT NULL DEFAULT 'Platinum Partners',
    isMain TINYINT(1) NOT NULL DEFAULT 0,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS SponsorshipPackage (
    id CHAR(36) NOT NULL,
    title VARCHAR(191) NOT NULL,
    description TEXT NULL,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS Faq (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(500) NULL,
    articleCount INT NOT NULL DEFAULT 0,
    link VARCHAR(500) NULL,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    sortOrder INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS SiteSetting (
    \`key\` VARCHAR(100) NOT NULL,
    value TEXT NULL,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`key\`)
  ) ${TABLE_OPTS}`,
  /* Status / notes for website submissions, kept in a side table so the
     website's own tables (and its Sequelize sync) are never altered. */
  `CREATE TABLE IF NOT EXISTS AdminRecordMeta (
    recordType VARCHAR(50) NOT NULL,
    recordId CHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    notes TEXT NULL,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (recordType, recordId)
  ) ${TABLE_OPTS}`,
  `CREATE TABLE IF NOT EXISTS AdminActivityLog (
    id CHAR(36) NOT NULL,
    adminId CHAR(36) NULL,
    adminName VARCHAR(191) NULL,
    action VARCHAR(30) NOT NULL,
    entity VARCHAR(60) NOT NULL,
    entityId VARCHAR(64) NULL,
    details VARCHAR(500) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_activity_created (createdAt)
  ) ${TABLE_OPTS}`,
];

async function seedAdmin(pool: Pool) {
  const [rows] = await pool.query("SELECT COUNT(*) AS cnt FROM AdminUser");
  if (Number((rows as { cnt: number }[])[0].cnt) > 0) return;
  const email = (process.env.ADMIN_EMAIL || "admin@techcatalystsummit.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin@TCS2026";
  const name = process.env.ADMIN_NAME || "Super Admin";
  await pool.query(
    "INSERT INTO AdminUser (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, 'super_admin')",
    [randomUUID(), name, email, await bcrypt.hash(password, 10)],
  );
  console.log(`[admin] created first super admin: ${email}`);
}

/**
 * Additive patches for website tables created by older versions of the site
 * (same idea as the website's own phone/smsConsent patches in config/database.ts).
 * Only ever ADDs a missing column the current website model expects.
 */
const WEBSITE_COLUMN_PATCHES: { table: string; column: string; ddl: string }[] = [
  {
    table: "RooftopSurveyResponse",
    column: "surveyType",
    ddl: "ALTER TABLE RooftopSurveyResponse ADD COLUMN surveyType ENUM('pre-event','post-event') NOT NULL DEFAULT 'pre-event' AFTER email",
  },
  { table: "CommunityApplication", column: "phone", ddl: "ALTER TABLE CommunityApplication ADD COLUMN phone VARCHAR(32) NULL AFTER email" },
  { table: "CommunityApplication", column: "smsConsent", ddl: "ALTER TABLE CommunityApplication ADD COLUMN smsConsent TINYINT(1) NOT NULL DEFAULT 0" },
];

async function patchWebsiteColumns(pool: Pool) {
  for (const p of WEBSITE_COLUMN_PATCHES) {
    // LOWER() — servers with lower_case_table_names=1 report table names in lowercase.
    const [rows] = await pool.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?) AND COLUMN_NAME = ? LIMIT 1`,
      [p.table, p.column],
    );
    if (!(rows as unknown[]).length) {
      await pool.query(p.ddl);
      console.log(`[admin] DB patch applied: ${p.table}.${p.column}`);
    }
  }
}

/** Idempotent: safe to run on every boot. */
export async function ensureSchema(pool: Pool) {
  for (const sql of [...WEBSITE_TABLES, ...ADMIN_TABLES]) {
    await pool.query(sql);
  }
  await patchWebsiteColumns(pool);
  await seedAdmin(pool);
  await seedContent(pool);
}

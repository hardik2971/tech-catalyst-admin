import type { Role } from "./auth";

export type ColType = "string" | "text" | "int" | "bool" | "json" | "datetime" | "enum";
export type Column = { type: ColType; required?: boolean; values?: readonly string[]; max?: number };

export type ResourceDef = {
  name: string;
  label: string;
  table: string;
  columns: Record<string, Column>;
  /** SQL expressions (trusted) matched with LIKE for ?q= */
  search: string[];
  sortable: string[];
  defaultSort: [string, "ASC" | "DESC"];
  /** Columns allowed as exact-match query filters (?column=value) */
  filters?: string[];
  /** Field used in activity-log messages */
  titleField: string;
  create?: boolean;
  update?: boolean;
  remove?: boolean;
  writeRoles?: Role[];
  deleteRoles?: Role[];
  /** Join AdminRecordMeta (status + notes) under this record type */
  metaType?: string;
  /** Website-owned table: createdAt has no DB default and there is no updatedAt */
  websiteTable?: boolean;
  /** Derive / normalize values before writing */
  prepare?: (data: Record<string, unknown>, isCreate: boolean) => Record<string, unknown>;
};

export const LEAD_STATUSES = ["new", "contacted", "in_review", "approved", "rejected", "archived"] as const;

const ALL: Role[] = ["super_admin", "admin", "editor"];
const MANAGERS: Role[] = ["super_admin", "admin"];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 180);

export const RESOURCES: Record<string, ResourceDef> = {
  events: {
    name: "events",
    label: "Event",
    table: "Event",
    titleField: "title",
    columns: {
      title: { type: "string", required: true, max: 255 },
      slug: { type: "string", max: 191 },
      edition: { type: "string" },
      status: { type: "enum", values: ["upcoming", "past", "draft"] },
      badge: { type: "string" },
      startDate: { type: "datetime" },
      endDate: { type: "datetime" },
      dateLabel: { type: "string" },
      timeLabel: { type: "string" },
      venueName: { type: "string" },
      venueAddress: { type: "string" },
      city: { type: "string" },
      coverImage: { type: "string", max: 500 },
      clipUrl: { type: "string", max: 500 },
      ticketUrl: { type: "string", max: 500 },
      ticketLabel: { type: "string" },
      summary: { type: "text" },
      descriptionHtml: { type: "text" },
      isFeatured: { type: "bool" },
      sortOrder: { type: "int" },
    },
    search: ["t.title", "t.edition", "t.venueName", "t.city"],
    sortable: ["title", "startDate", "status", "sortOrder", "createdAt"],
    defaultSort: ["startDate", "DESC"],
    filters: ["status"],
    create: true,
    update: true,
    remove: true,
    writeRoles: ALL,
    deleteRoles: MANAGERS,
    prepare: (d, isCreate) => {
      if ((isCreate || "slug" in d) && !d.slug && d.title) d.slug = slugify(String(d.title));
      else if (d.slug) d.slug = slugify(String(d.slug));
      if (isCreate && !d.status) d.status = "upcoming";
      return d;
    },
  },
  "gallery-videos": {
    name: "gallery-videos",
    label: "Gallery video",
    table: "EventGalleryVideo",
    titleField: "title",
    columns: {
      eventId: { type: "string", required: true },
      title: { type: "string", required: true },
      url: { type: "string", required: true, max: 500 },
      sortOrder: { type: "int" },
    },
    search: ["t.title", "t.url"],
    sortable: ["sortOrder", "title", "createdAt"],
    defaultSort: ["sortOrder", "ASC"],
    filters: ["eventId"],
    create: true,
    update: true,
    remove: true,
    writeRoles: ALL,
    deleteRoles: ALL,
  },
  "gallery-albums": {
    name: "gallery-albums",
    label: "Gallery album",
    table: "EventGalleryAlbum",
    titleField: "label",
    columns: {
      eventId: { type: "string", required: true },
      label: { type: "string", required: true },
      media: { type: "json" },
      sortOrder: { type: "int" },
    },
    search: ["t.label"],
    sortable: ["sortOrder", "label", "createdAt"],
    defaultSort: ["sortOrder", "ASC"],
    filters: ["eventId"],
    create: true,
    update: true,
    remove: true,
    writeRoles: ALL,
    deleteRoles: ALL,
    prepare: (d, isCreate) => {
      if (isCreate && d.media == null) d.media = [];
      return d;
    },
  },
  speakers: {
    name: "speakers",
    label: "Speaker",
    table: "Speaker",
    titleField: "name",
    columns: {
      name: { type: "string", required: true },
      position: { type: "string" },
      bio: { type: "text" },
      image: { type: "string", max: 500 },
      linkedin: { type: "string", max: 500 },
      category: { type: "enum", values: ["featured", "previous"] },
      isFounder: { type: "bool" },
      isActive: { type: "bool" },
      sortOrder: { type: "int" },
    },
    search: ["t.name", "t.position"],
    sortable: ["name", "category", "sortOrder", "createdAt"],
    defaultSort: ["sortOrder", "ASC"],
    filters: ["category", "isActive"],
    create: true,
    update: true,
    remove: true,
    writeRoles: ALL,
    deleteRoles: MANAGERS,
  },
  sponsors: {
    name: "sponsors",
    label: "Partner",
    table: "Sponsor",
    titleField: "name",
    columns: {
      name: { type: "string", required: true },
      subtitle: { type: "string" },
      logo: { type: "string", max: 500 },
      website: { type: "string", max: 500 },
      tier: { type: "string" },
      isMain: { type: "bool" },
      isActive: { type: "bool" },
      sortOrder: { type: "int" },
    },
    search: ["t.name", "t.subtitle", "t.tier"],
    sortable: ["name", "tier", "sortOrder", "createdAt"],
    defaultSort: ["sortOrder", "ASC"],
    filters: ["tier", "isActive"],
    create: true,
    update: true,
    remove: true,
    writeRoles: ALL,
    deleteRoles: MANAGERS,
  },
  packages: {
    name: "packages",
    label: "Sponsorship package",
    table: "SponsorshipPackage",
    titleField: "title",
    columns: {
      title: { type: "string", required: true },
      description: { type: "text" },
      isActive: { type: "bool" },
      sortOrder: { type: "int" },
    },
    search: ["t.title", "t.description"],
    sortable: ["title", "sortOrder", "createdAt"],
    defaultSort: ["sortOrder", "ASC"],
    create: true,
    update: true,
    remove: true,
    writeRoles: ALL,
    deleteRoles: MANAGERS,
  },
  faqs: {
    name: "faqs",
    label: "FAQ category",
    table: "Faq",
    titleField: "title",
    columns: {
      title: { type: "string", required: true },
      description: { type: "text" },
      icon: { type: "string", max: 500 },
      articleCount: { type: "int" },
      link: { type: "string", max: 500 },
      isActive: { type: "bool" },
      sortOrder: { type: "int" },
    },
    search: ["t.title", "t.description"],
    sortable: ["title", "sortOrder", "articleCount", "createdAt"],
    defaultSort: ["sortOrder", "ASC"],
    create: true,
    update: true,
    remove: true,
    writeRoles: ALL,
    deleteRoles: MANAGERS,
  },

  /* ── Website submissions (existing tables, same data the site writes) ── */
  community: {
    name: "community",
    label: "Community application",
    table: "CommunityApplication",
    titleField: "email",
    websiteTable: true,
    metaType: "community",
    columns: {
      fullName: { type: "string", required: true },
      email: { type: "string", required: true },
      phone: { type: "string" },
      company: { type: "string", required: true },
      jobTitle: { type: "string", required: true },
      linkedin: { type: "string" },
      whyJoin: { type: "text", required: true },
      expectations: { type: "text", required: true },
      lookingForward: { type: "text", required: true },
      smsConsent: { type: "bool" },
    },
    search: ["t.fullName", "t.email", "t.company", "t.jobTitle", "t.phone"],
    sortable: ["fullName", "email", "company", "createdAt", "status"],
    defaultSort: ["createdAt", "DESC"],
    filters: ["status", "smsConsent"],
    update: true,
    remove: true,
    writeRoles: MANAGERS,
    deleteRoles: MANAGERS,
  },
  "sponsor-leads": {
    name: "sponsor-leads",
    label: "Sponsor lead",
    table: "SponsorLead",
    titleField: "workEmail",
    websiteTable: true,
    metaType: "sponsor-lead",
    columns: {
      fullName: { type: "string", required: true },
      workEmail: { type: "string", required: true },
      company: { type: "string", required: true },
      jobTitle: { type: "string", required: true },
      linkedin: { type: "string" },
      website: { type: "string", required: true },
      partnershipTypes: { type: "json" },
      targetAudience: { type: "json" },
      goals: { type: "json" },
      details: { type: "text", required: true },
    },
    search: ["t.fullName", "t.workEmail", "t.company", "t.jobTitle", "t.website"],
    sortable: ["fullName", "company", "createdAt", "status"],
    defaultSort: ["createdAt", "DESC"],
    filters: ["status"],
    update: true,
    remove: true,
    writeRoles: MANAGERS,
    deleteRoles: MANAGERS,
  },
  surveys: {
    name: "surveys",
    label: "Survey response",
    table: "RooftopSurveyResponse",
    titleField: "email",
    websiteTable: true,
    metaType: "survey",
    columns: {
      email: { type: "string", required: true },
      surveyType: { type: "enum", values: ["pre-event", "post-event"] },
      payload: { type: "json" },
    },
    search: ["t.email", "CAST(t.payload AS CHAR)"],
    sortable: ["email", "surveyType", "createdAt"],
    defaultSort: ["createdAt", "DESC"],
    filters: ["surveyType", "status"],
    update: true,
    remove: true,
    writeRoles: MANAGERS,
    deleteRoles: MANAGERS,
  },
  subscribers: {
    name: "subscribers",
    label: "Gallery subscriber",
    table: "GalleryEmail",
    titleField: "email",
    websiteTable: true,
    columns: {
      email: { type: "string", required: true },
    },
    search: ["t.email"],
    sortable: ["email", "createdAt"],
    defaultSort: ["createdAt", "DESC"],
    create: true,
    update: true,
    remove: true,
    writeRoles: MANAGERS,
    deleteRoles: MANAGERS,
    prepare: (d) => {
      if (typeof d.email === "string") d.email = d.email.trim().toLowerCase();
      return d;
    },
  },
  activity: {
    name: "activity",
    label: "Activity",
    table: "AdminActivityLog",
    titleField: "entity",
    websiteTable: true,
    columns: {},
    search: ["t.adminName", "t.entity", "t.details", "t.action"],
    sortable: ["createdAt", "action", "entity"],
    defaultSort: ["createdAt", "DESC"],
    filters: ["action", "entity"],
  },
};

export function getResource(name: string): ResourceDef | undefined {
  return Object.prototype.hasOwnProperty.call(RESOURCES, name) ? RESOURCES[name] : undefined;
}

"use client";

import type { FieldDef } from "./resource-page";
import type { Tone } from "./ui";

export const EVENT_FIELDS: FieldDef[] = [
  { section: "Basics", name: "title", label: "Event title", type: "text", required: true, span: 2, placeholder: "Tech Catalyst Summit Arrives in NYC" },
  { section: "Basics", name: "edition", label: "Edition", type: "text", placeholder: "New York City Edition" },
  { section: "Basics", name: "slug", label: "URL slug", type: "text", hint: "Auto-generated from the title when empty" },
  {
    section: "Basics", name: "status", label: "Status", type: "select", required: true,
    options: [{ label: "Upcoming", value: "upcoming" }, { label: "Past", value: "past" }, { label: "Draft (hidden)", value: "draft" }],
  },
  { section: "Basics", name: "badge", label: "Badge", type: "text", placeholder: "Approval Required" },
  { section: "Basics", name: "isFeatured", label: "Featured on home page", type: "switch" },
  { section: "Basics", name: "sortOrder", label: "Sort order", type: "number" },

  { section: "Date & venue", name: "startDate", label: "Starts at", type: "datetime", hint: "Drives the website countdown" },
  { section: "Date & venue", name: "endDate", label: "Ends at", type: "datetime" },
  { section: "Date & venue", name: "dateLabel", label: "Date label", type: "text", placeholder: "Wednesday, October 28, 2026" },
  { section: "Date & venue", name: "timeLabel", label: "Time label", type: "text", placeholder: "6:00 PM – 10:00 PM ET" },
  { section: "Date & venue", name: "venueName", label: "Venue", type: "text", placeholder: "Palma Verde" },
  { section: "Date & venue", name: "city", label: "City", type: "text", placeholder: "New York, NY" },
  { section: "Date & venue", name: "venueAddress", label: "Address", type: "text", span: 2 },

  { section: "Tickets", name: "ticketUrl", label: "Ticket URL", type: "url", placeholder: "https://luma.com/…" },
  { section: "Tickets", name: "ticketLabel", label: "Button label", type: "text", placeholder: "Request to Join on Luma" },

  { section: "Media", name: "coverImage", label: "Cover image", type: "image", folder: "events" },
  { section: "Media", name: "clipUrl", label: "Hover clip (video)", type: "image", folder: "clips", hint: "Short .mp4 played on hover in “Previous events”" },

  { section: "Content", name: "summary", label: "Short summary", type: "textarea", rows: 3 },
  { section: "Content", name: "descriptionHtml", label: "About the event", type: "html", rows: 16 },
];

export const SPEAKER_FIELDS: FieldDef[] = [
  { name: "image", label: "Headshot", type: "image", folder: "speakers" },
  { name: "name", label: "Full name", type: "text", required: true },
  { name: "position", label: "Title / company", type: "text", placeholder: "Founder & CEO of …" },
  {
    name: "category", label: "Section", type: "select", required: true,
    options: [{ label: "Featured speaker", value: "featured" }, { label: "Previous main speaker", value: "previous" }],
  },
  { name: "linkedin", label: "LinkedIn URL", type: "url" },
  { name: "isFounder", label: "Show in “Meet the founders”", type: "switch" },
  { name: "isActive", label: "Visible on website", type: "switch" },
  { name: "sortOrder", label: "Sort order", type: "number" },
  { name: "bio", label: "Biography", type: "textarea", rows: 12, hint: "Separate paragraphs with a blank line" },
];

export const SPONSOR_FIELDS: FieldDef[] = [
  { name: "logo", label: "Logo", type: "image", folder: "sponsors" },
  { name: "name", label: "Company name", type: "text", required: true },
  { name: "subtitle", label: "Subtitle", type: "text", placeholder: "Cybersecurity Company" },
  { name: "tier", label: "Tier", type: "text", placeholder: "Platinum Partners" },
  { name: "website", label: "Website", type: "url" },
  { name: "isMain", label: "Show in main sponsor carousel", type: "switch" },
  { name: "isActive", label: "Visible on website", type: "switch" },
  { name: "sortOrder", label: "Sort order", type: "number" },
];

export const PACKAGE_FIELDS: FieldDef[] = [
  { name: "title", label: "Package name", type: "text", required: true, span: 2 },
  { name: "description", label: "Description", type: "textarea", rows: 4 },
  { name: "isActive", label: "Visible on website", type: "switch" },
  { name: "sortOrder", label: "Sort order", type: "number" },
];

export const FAQ_FIELDS: FieldDef[] = [
  { name: "icon", label: "Icon", type: "image", folder: "faqs" },
  { name: "title", label: "Category title", type: "text", required: true, span: 2 },
  { name: "description", label: "Description", type: "textarea", rows: 3 },
  { name: "articleCount", label: "Article count", type: "number" },
  { name: "link", label: "Link", type: "url" },
  { name: "isActive", label: "Visible on website", type: "switch" },
  { name: "sortOrder", label: "Sort order", type: "number" },
];

export const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

export const STATUS_TONE: Record<string, Tone> = {
  new: "blue",
  contacted: "teal",
  in_review: "amber",
  approved: "green",
  rejected: "red",
  archived: "gray",
};

export const EVENT_STATUS_TONE: Record<string, Tone> = { upcoming: "green", past: "gray", draft: "amber" };

/* Website sponsor form options (pages/sponsor.vue) */
export const PARTNERSHIP_OPTIONS = [
  "Event Sponsorship", "Recruiting Activation", "Executive Dinner", "Thought Leadership Panel", "Product Showcase",
  "Startup or Investor Activation", "Community Partnership", "Custom Event Collaboration",
];
export const AUDIENCE_OPTIONS = [
  "Executives", "Cybersecurity Leaders", "AI Professionals", "Startup Founders", "Investors", "Engineers and Technical Talent",
  "Students and Emerging Talent", "Enterprise Buyers", "Diverse Tech Talent", "Other",
];
export const GOAL_OPTIONS = [
  "Brand Awareness", "Lead Generation", "Recruiting", "Executive Relationship Building", "Community Engagement",
  "Product Education", "Thought Leadership", "Market Expansion", "Partner Development",
];

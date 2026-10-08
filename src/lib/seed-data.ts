/**
 * Content currently hard-coded in the Nuxt website (pages/event.vue, home.vue,
 * eventGallery.vue, sponsor.vue, faqs.vue, aboutus.vue, composables/usePreviousEvents.ts,
 * server/utils/mailer.ts). Seeded into MySQL the first time the admin boots so the
 * panel starts with exactly what the site shows today.
 */

const pad = (n: number, w: number) => String(n).padStart(w, "0");
const range = (len: number, fn: (i: number) => string) => Array.from({ length: len }, (_, i) => fn(i));

export type SeedEvent = {
  title: string;
  slug: string;
  edition: string;
  status: "upcoming" | "past";
  badge?: string;
  startDate: string; // UTC ISO
  dateLabel: string;
  timeLabel?: string;
  venueName: string;
  venueAddress: string;
  city: string;
  coverImage: string;
  clipUrl?: string;
  ticketUrl?: string;
  ticketLabel?: string;
  summary?: string;
  descriptionHtml?: string;
  isFeatured?: boolean;
  videos: { title: string; url: string }[];
  albums: { label: string; media: string[] }[];
};

const NYC_DESCRIPTION = `<b>Tech Catalyst Summit New York City Edition | Palma Verde</b><br>
📅 Wednesday, October 28, 2026<br>
📍 Palma Verde – 1604 Broadway 4th Floor, New York, NY 10019<br><br>
Welcome to the <b>Tech Catalyst Summit New York City Edition</b>, an elevated executive networking experience bringing together technology leaders, cybersecurity executives, founders, investors, innovators, talent leaders, and community builders for an evening of connection and opportunity.<br><br>
Tech Catalyst Summit is bringing its signature experience to <b>New York City</b>, creating a gathering designed to spark collaboration, business development, talent opportunities, and meaningful relationships across the technology ecosystem in a setting that feels intentional, welcoming, and relationship-driven.<br><br>
This experience is built for leaders who are not just attending events, but actively shaping what comes next across AI, cybersecurity, cloud, software, venture, workforce development, and emerging technology.<br><br>
At the heart of Tech Catalyst Summit is a simple mission: <b>connect seasoned executives with the next generation of technology leaders, innovators, and builders.</b> Whether you are leading an enterprise team, scaling a company, exploring a new opportunity, or investing in what comes next, this is a space to expand your perspective and your network.<br><br>
This is not your typical networking event. It is an elevated social experience built around executive conversations, meaningful introductions, hospitality, and authentic community.<br><br>
Expect the perfect blend of <b>executive-level networking and New York City energy</b>, where business opportunity, talent connection, and community come together.<br><br>
<b>✦ What to Expect</b><br>
◆ A premium networking experience designed for executives, founders, investors, and technology leaders<br>
◆ A curated audience of CIOs, CISOs, CTOs, senior executives, directors, operators, innovators, and rising leaders<br>
◆ Passed hors d'oeuvres included with your ticket, with beverages available for purchase at the cash bar<br>
◆ An elevated social atmosphere at Palma Verde, with space for both professional connections and genuine conversation<br>
◆ Warm, relationship-driven networking that goes beyond exchanging business cards<br>
◆ Opportunities to connect with event partners and technology companies supporting the community<br>
◆ Strategic conversations around AI, cybersecurity, cloud, innovation, workforce development, talent, and business growth<br>
◆ Meaningful introductions to potential partners, clients, investors, hires, mentors, and collaborators<br><br>
<b>✦ The Energy</b><br>
Think: <i>New York ambition meets Tech Catalyst Summit's executive social experience.</i><br>
Tech Catalyst Summit brings a genuine “family vibe” to executive networking — creating an environment where accomplished leaders and emerging talent can connect naturally, exchange ideas openly, and build relationships that extend beyond the event.<br><br>
Come ready to share what you are building, learn what others are working toward, and discover where your paths might align. This is where your next partner, client, investor, hire, mentor, collaborator, or friend could be one introduction away.<br><br>
<b>✦ Who This Is For</b><br>
◆ Technology executives and senior leaders, including CIOs, CISOs, CTOs, SVPs, directors, and decision-makers<br>
◆ Founders and operators building the next wave of innovation<br>
◆ Investors, ecosystem builders, and strategic partners<br>
◆ Cybersecurity, AI, cloud, software, and emerging technology professionals<br>
◆ HR, recruiting, workforce development, and talent leaders looking to connect with the technology community<br>
◆ Mid-career professionals and rising leaders who value meaningful access, fresh perspectives, and authentic relationships<br><br>
<b>✦ Why Attend</b><br>
◆ Build meaningful relationships across New York’s technology and business leadership community<br>
◆ Discover new partnership, client, investor, career, and talent opportunities<br>
◆ Expand your network beyond your company, industry, or usual professional circles<br>
◆ Exchange perspectives with leaders shaping the future of technology, security, and business<br>
◆ Experience Tech Catalyst Summit’s signature mix of executive networking, elevated hospitality, and authentic community<br><br>
<b>✦ Dress Code</b><br>
Stylish, polished, and camera-ready. Bring your personal style and come prepared for an elevated New York social experience.<br><br>
<b>✦ RSVP</b><br>
🚨 Spots are limited to preserve the quality of the connections and overall experience.<br>
Secure your RSVP and come ready to connect, collaborate, and build relationships with purpose.<br><br>
Join us for the <b>Tech Catalyst Summit New York City Edition</b>, where executive leadership, emerging talent, innovation, and community come together.<br>
<b>New York energy. Meaningful connections. What's next starts here.</b>`;

const WC = "/event/TechCatalystSummitWorldCupEdition";
const WC_GIFS = new Set([27, 28, 30, 32, 43, 44, 48, 50, 51, 52, 53, 54, 57, 58, 59, 60, 65, 66, 67, 68, 69, 70, 71, 74]);
const RS = "/event/TechCatalystSummitRooftopSpringSocial";

export const SEED_EVENTS: SeedEvent[] = [
  {
    title: "Tech Catalyst Summit Arrives in NYC",
    slug: "nyc-edition-2026",
    edition: "New York City Edition",
    status: "upcoming",
    badge: "Approval Required",
    startDate: "2026-10-28T22:00:00.000Z", // 6:00 PM ET (website countdown target)
    dateLabel: "Wednesday, October 28, 2026",
    timeLabel: "See Luma for event time",
    venueName: "Palma Verde",
    venueAddress: "1604 Broadway 4th Floor, New York, NY 10019",
    city: "New York, NY",
    coverImage: "/event/NYC-Edition/NYC-Edition.jpg",
    ticketUrl: "https://luma.com/tcsny",
    ticketLabel: "Request to Join on Luma",
    summary:
      "An elevated executive networking experience bringing together technology leaders, cybersecurity executives, founders, investors, innovators, talent leaders, and community builders.",
    descriptionHtml: NYC_DESCRIPTION,
    isFeatured: true,
    videos: [],
    albums: [],
  },
  {
    title: "Tech Catalyst Summit ATL Tech Week Edition",
    slug: "atl-tech-week-edition-2026",
    edition: "ATL Tech Week Edition",
    status: "past",
    startDate: "2026-08-13T22:00:00.000Z",
    dateLabel: "August 13, 2026",
    timeLabel: "6:00 PM – 10:00 PM ET",
    venueName: "8 Summit West",
    venueAddress: "889 Howell Mill Rd, Atlanta, GA 30318",
    city: "Atlanta, GA",
    coverImage: "/event/ATL-Tech-Week-Edition/ATL-Tech-Week-Edition.jpg",
    ticketUrl: "https://luma.com/ATW",
    videos: [],
    albums: [],
  },
  {
    title: "Tech Catalyst Summit World Cup Edition",
    slug: "world-cup-edition-2026",
    edition: "World Cup Edition",
    status: "past",
    startDate: "2026-07-15T22:00:00.000Z",
    dateLabel: "July 15, 2026",
    venueName: "No18 Buckhead",
    venueAddress: "Buckhead, Atlanta, GA",
    city: "Atlanta, GA",
    coverImage: "/event/World-Cup-Edition/World-Cup-Edition.png",
    videos: [{ title: "Event Recap", url: "https://youtu.be/n0STHu--YG0" }],
    albums: [
      {
        label: "Booth Photos",
        media: range(79, (i) => `${WC}/Photobooth/Photobooth${pad(i + 1, 2)}.${WC_GIFS.has(i + 1) ? "gif" : "jpg"}`),
      },
      { label: "Photographers", media: range(67, (i) => `${WC}/FFTV-Magazine/FFTV-Magazine${pad(i + 1, 2)}.JPG`) },
    ],
  },
  {
    title: "Tech Catalyst Summit Rooftop Spring Social",
    slug: "rooftop-spring-social-2026",
    edition: "Rooftop Spring Social",
    status: "past",
    startDate: "2026-04-30T22:00:00.000Z",
    dateLabel: "April 30, 2026",
    venueName: "The Electric Room Rooftop",
    venueAddress: "Atlanta, GA",
    city: "Atlanta, GA",
    coverImage: "/event/techCatalystSummitRooftopSpringSocialCover.png",
    clipUrl: `${RS}/DreamImagi/video/DreamImagi_video_01.mp4`,
    videos: [
      { title: "Short Recap Video", url: "https://youtu.be/hBNTY63Kum0" },
      { title: "Executive Testimonials", url: "https://youtu.be/6Y25mSdUd-8" },
      { title: "Emerging Talent & Investor Testimonials", url: "https://youtu.be/mNGhUikaLpE" },
      { title: "Full event recap", url: "https://youtu.be/AbAMEOY0Rf4" },
      { title: "WGU Keynote speaker", url: "https://youtu.be/Y2SDHkvxBmM" },
      { title: "ThreatLocker speaker", url: "https://youtu.be/43xAM9GICsw" },
    ],
    albums: [
      {
        label: "photobooth",
        media: [
          ...range(11, (i) => `${RS}/photobooth/AI-Photos/photobooth_AI_photos_${pad(i + 1, 2)}.jpg`),
          ...range(28, (i) => `${RS}/photobooth/Gifs/photobooth_Gifs_${pad(i + 1, 2)}.gif`),
          ...range(35, (i) => `${RS}/photobooth/Group-Photos/photobooth_Group_photos_${pad(i + 1, 2)}.jpg`),
          ...range(206, (i) => `${RS}/photobooth/Individual-Photos/photobooth_Individual_photos_${pad(i + 1, 3)}.jpg`),
        ],
      },
      {
        label: "DreamImagi",
        media: [
          ...range(40, (i) => `${RS}/DreamImagi/images/DreamImagi_images_${pad(i + 1, 2)}.jpg`),
          ...range(9, (i) => `${RS}/DreamImagi/video/DreamImagi_video_${pad(i + 1, 2)}.mp4`),
        ],
      },
      { label: "FFTV-Magazine", media: range(224, (i) => `${RS}/FFTV-Magazine/FFTV_Magazine_${pad(i + 1, 3)}.JPG`) },
      { label: "TamelUnderXover", media: range(23, (i) => `${RS}/TamelUnderXover/TamelUnderXover_${pad(i + 1, 2)}.JPG`) },
    ],
  },
  {
    title: "ATL Tech Week Edition",
    slug: "atl-tech-week-2025",
    edition: "ATL Tech Week Edition",
    status: "past",
    startDate: "2025-06-10T22:00:00.000Z",
    dateLabel: "June 10, 2025",
    venueName: "Modex Studio",
    venueAddress: "Atlanta, GA",
    city: "Atlanta, GA",
    coverImage: "/event/June-10-2025-photographers-1.jpg",
    videos: [
      {
        title: "ATL Tech Week’s Premier Event for Innovation, AI & Cybersecurity",
        url: "https://youtu.be/-6tIoakrKI8?si=thd7KcaqAxa9Hec4",
      },
    ],
    albums: [
      { label: "Booth Photos", media: range(75, (i) => `/event/June-10-2025-boostPhotos-${i + 93}.jpg`) },
      { label: "Photographers", media: range(92, (i) => `/event/June-10-2025-photographers-${i + 1}.jpg`) },
    ],
  },
  {
    title: "The Purple Social Dinner Soiree",
    slug: "purple-social-dinner-soiree-2025",
    edition: "Purple Social Dinner Soiree",
    status: "past",
    startDate: "2025-04-29T22:00:00.000Z",
    dateLabel: "April 29, 2025",
    venueName: "Atlanta",
    venueAddress: "Atlanta, GA",
    city: "Atlanta, GA",
    coverImage: "/event/SentinalDinner.jpg",
    videos: [
      { title: "Main Recap Video", url: "https://youtu.be/21dv0-NZgN4" },
      { title: "Recap with Guest Testimonials", url: "https://youtu.be/WisYhwi8vbI" },
      { title: "Keynote Speech from Jelani on AI in Cybersecurity", url: "https://youtu.be/iqIICqE-2Uw" },
    ],
    albums: [
      { label: "Booth Photos", media: [] },
      { label: "Photographers", media: range(11, (i) => `/event/29-apr-2025-photographers-${i + 1}.jpg`) },
    ],
  },
  {
    title: "Tech Catalyst Summit 2025",
    slug: "tech-catalyst-summit-2025",
    edition: "Tech Catalyst Summit 2025",
    status: "past",
    startDate: "2025-01-23T23:00:00.000Z",
    dateLabel: "January 23, 2025",
    venueName: "Modex Studios",
    venueAddress: "Atlanta, GA",
    city: "Atlanta, GA",
    coverImage: "/event/23-jan-2025-photographers-1.jpg",
    clipUrl: "/techcatasummit2025.mp4",
    videos: [
      { title: "Short Recap", url: "https://youtu.be/Qa5qS5yVOB0" },
      { title: "Full Recap with Highlights", url: "https://youtu.be/wNJy9b1N80c" },
      { title: "Guest Testimonials", url: "https://youtu.be/i_uq1UuwfZ0" },
    ],
    albums: [
      { label: "Booth Photos", media: range(24, (i) => `/event/23-jan-2025-boostPhotos-${i + 5}.jpeg`) },
      { label: "Photographers", media: range(4, (i) => `/event/23-jan-2025-photographers-${i + 1}.jpg`) },
    ],
  },
];

export const SEED_SPEAKERS = [
  {
    name: "Jelani Campbell",
    position: "Founder & CEO of Cyber Made Simple",
    category: "featured",
    isFounder: true,
    image: "/speaker/jelani_campbell.jpg",
    bio: `Jelani is a seasoned Cybersecurity Risk Management executive and entrepreneur with over 15 years experience designing and implementing cyber governance risk and compliance (GRC) programs and technologies within complex global organizations across sectors such as banking, technology, consumer products, government and others. Jelani's passion for entrepreneurship led him to start businesses in fashion, real estate, TV marketing and Cybersecurity.

Jelani's most recent entrepreneurial venture, Cyber Made Simple is a GRC consulting group focused on demystifying complex cyber risks for executive boards and senior management. The team accomplishes this through defining the strategy for the future state, aligning an organization to industry best practices and automating in tools and technologies such as ServiceNow, Archer and others. Through strategic alliance with the Holistic Information Security Practitioner Institute, Jelani's community-oriented approach has led to Vision 2030: to train 100k cybersecurity professionals by 2030.

Jelani's many years of building dynamic teams with his cool, calm, collected leadership style enables his ability to work in very complex environments across multiple projects/clients while also creating a fun and engaging team culture while solving the world's most technical and complex cybersecurity problems.`,
  },
  {
    name: "Josh Coffee",
    position: "Founder & CEO of Catalyst Tech Solutions",
    category: "featured",
    isFounder: true,
    image: "/speaker/josh_coffee.png",
    bio: `Joshua Coffee is a dynamic leader and visionary entrepreneur with over nine years of experience in the tech industry. As the Founder and CEO of Catalyst Tech Solutions, Joshua has built a premier IT consulting firm specializing in ServiceNow implementations. His commitment to delivering innovative, scalable solutions has positioned Catalyst Tech Solutions as a trusted partner for organizations seeking to streamline operations and drive digital transformation.

Recognizing the transformative power of technology, Joshua extended his impact by founding Catalyst Institute—a groundbreaking initiative designed to empower individuals from unconventional backgrounds to break into the tech industry. Through comprehensive technical training programs, Catalyst Institute equips students with the skills and confidence needed to launch thriving careers, with a focus on diversity, inclusivity, and upward mobility.

Joshua’s passion for leveraging technology to create opportunities and solve complex challenges fuels his drive to expand Catalyst Tech Solutions and Catalyst Institute. His dedication to fostering innovation and empowerment continues to inspire and transform the tech landscape.`,
  },
  {
    name: "Levi Perkins",
    position: "CEO of Hannibal AI",
    category: "previous",
    image: "/speaker/levi_perkins.JPG",
    bio: `Levi Perkins’ journey from farm life in North Georgia to a career as an innovative problem solver and entrepreneur reflects his passion for engineering, puzzles, and efficiency. After earning honors in Poultry Science and a Master’s in Economics from the University of Georgia, Levi began his career at Tyson Foods before becoming a USDA Agent, where he investigated agricultural financial crimes. Driven to improve processes, he developed tools to help agents identify and prosecute fraud.

Levi’s entrepreneurial spirit emerged as the third employee of a pharmaceutical data analytics startup, later acquired by WebMD, where he worked with top brands like Pfizer and AstraZeneca. He co-founded “The Digital Career Counselor,” a data analytics platform for colleges, and contributed to large-scale National Science Foundation research projects.

After guiding organizations as a fractional CTO, Levi became captivated by generative AI’s potential to revolutionize software. He founded Hannibal AI, an AI development company, alongside Dr. Sravan Dhulipala. Their flagship product, OrthoScribe, addresses clinical documentation challenges to reduce compliance burdens and improve patient care.

Outside of work, Levi enjoys chess, robotics, history, and restoring a 1969 Mustang with his father. He loves traveling with his wife, Natalia—especially to Seville, Spain—and spending time with their three rescue dogs, Georgia, Bonnie, and Moo.`,
  },
  {
    name: "Chamon Guyton",
    position: "Head of Cybersecurity for Paypal",
    category: "previous",
    image: "/speaker/Chamonheadshot.png",
    bio: `Chamon Gayton is well known cybersecurity expert with experience in government cloud compliance, security and auditing. She has over 17 years of security experience with 13 years of FedRAMP/DoD focused areas. As a US ARMY veteran she was able to facilitate and provide security trainings to many soldiers that assisted with attaining various security certifications.

Chamon has experience in Examining current issues in cybersecurity management, including enterprise risk management, vulnerability assessment/management, threat analysis, DevSecOps, crisis management, security architecture, security models, security policy development and implementation, security compliance, information privacy, identity management, incident response, disaster recovery, business continuity planning and government compliance.`,
  },
  {
    name: "Reginald Matthews",
    position: "Senior Manager of Transactions and Marketing for Intuit",
    category: "previous",
    image: "/speaker/reginal_matthews.png",
    bio: `Reginald is a seasoned legal professional with expertise in transactional, intellectual property, and data privacy law. As Senior Manager of Transactions and Marketing at Intuit, he drives high-profile deals and campaigns, including NIL agreements, Super Bowl sponsorships, and global events like the Intuit Dome. His work spans influencer contracts, SaaS infrastructure deals, and international campaigns, ensuring compliance and innovation worldwide.

At Calendly, Reginald built and led the company’s intellectual property and data privacy program, streamlining operations, protecting assets, and ensuring compliance. He played a pivotal role in the company’s rebrand and established a solid legal foundation for growth.

A Morehouse College graduate with a BA in Political Science, Reginald specialized in transactions and intellectual property during law school, gaining experience through internships with entertainment law firms, an NCAA athletic conference, and Apple.

Beyond his professional work, Reginald serves on the boards of Page Turners Make Great Learners, promoting literacy, and Silence the Shame, advocating for mental health awareness. A sought-after speaker, he shares expertise on legal best practices and career development at global conferences.

His accolades include the National Bar Association’s POWER 100 Award and multiple honors from Calendly. Reginald is also a published writer, with featured work on social media, employment law, and political broadcasting trends.`,
  },
  {
    name: "Jennifer Raiford",
    position: "EVP & Chief Information Security Officer",
    category: "previous",
    image: "/speaker/jennifer_raiford.webp",
    bio: `Jennifer Raiford is an award-winning Chief Information Security Officer with over 20 years of experience leading Fortune 500 companies in cybersecurity, risk management, and data privacy. Known for her visionary leadership, she has transformed organizations by operationalizing cybersecurity across industries, building innovative models, and fostering compliance excellence.

Currently Deputy CISO and Head BISO at Unisys, Raiford was appointed in 2022 as the Chief Executive Officer’s point of contact for the President’s National Security Telecommunications Advisory Committee (NSTAC). By 2023, she joined two NSTAC sub-committees contributing to critical reports for the U.S. President in 2024. She has also served as the DEI Executive Board Chair for Unisys’ Global Diversity Associate Impact Group, earning accolades like the Unisys Annual Achievement Award and National Leadership in Action Award.

Before Unisys, Raiford held leadership roles at Kellogg’s, Grant Thornton, InComm (FIS), Siemens, PwC, GE, and more. She pioneered the Security Privacy Compliance and Risk Office for the world's largest prepaid processor, becoming its first CISO, CCRO, and CPO. As a Six Sigma Black Belt, she boasts a perfect success rate in achieving industry certifications and frameworks.

A trusted advisor, strategist, and mentor, Raiford continues to shape the future of cybersecurity and national risk mitigation through her dedication to innovation, collaboration, and operational excellence.`,
  },
];

export const SEED_SPONSORS = [
  { name: "RNSC Technologies", subtitle: "Data Privacy & Cybersecurity Company", logo: "/sponsor/sponser_rnsc_logo.png", isMain: true },
  { name: "SentinelOne", subtitle: "Cybersecurity Company", logo: "/sponsor/sponser_sentinelone_logo.png", isMain: true },
  { name: "MODEx", subtitle: "Studio", logo: "/sponsor/sponser_modextm_logo.png", isMain: true },
  { name: "MODEx Studio", subtitle: "Studio", logo: "/sponsor/sponser_modex_studio_logo.jpg", isMain: true },
  { name: "Cyber Made Simple", subtitle: "Educational Consultant", logo: "/sponsor/CyberMadeSimple.jpg", isMain: true },
  { name: "Catalyst Solutions", subtitle: "Catalyst Solutions", logo: "/sponsor/catalyst.png", isMain: true },
  { name: "Tech Catalyst", subtitle: "Tech Catalyst", logo: "/main-logo-1.png", isMain: true },
  { name: "Deal Flow Exchange", subtitle: "Social Community", logo: "/sponsor/dfx.png", isMain: true },
  { name: "Cyversity Atlanta Chapter", subtitle: "Cyversity Atlanta Chapter", logo: "/sponsor/CyversityAtlantaChapter.png", isMain: true },
  { name: "TECH WOMEN", subtitle: "TECH WOMEN", logo: "/sponsor/TECH_WOMEN.png", isMain: true },
  { name: "Toc Short", subtitle: "Toc Short", logo: "/sponsor/Toc_Short_Logo_1024.png", isMain: true },
  { name: "Watermark Purple", subtitle: "Watermark Purple", logo: "/sponsor/Watermark-Purple.png", isMain: true },
  { name: "WGU", subtitle: "Western Governors University", logo: "/sponsor/wgu.png", isMain: false },
  { name: "Unframe", subtitle: "Unframe", logo: "/sponsor/unframe.png", isMain: false },
  { name: "ThreatLocker", subtitle: "Zero Trust Platform", logo: "/sponsor/ThreatLocker_Wordmark_ZTP_Color.png", isMain: false },
];

export const SEED_PACKAGES = [
  { title: "Presenting Sponsor", description: "Premium brand positioning across the event experience, promotional materials, stage mentions, digital content, and post-event visibility." },
  { title: "Panel or Fireside Chat Sponsor", description: "Sponsor a thought leadership conversation aligned to your brand, solution, or target audience." },
  { title: "VIP Experience Sponsor", description: "Support a private executive room, curated networking session, invite-only dinner, or premium hospitality experience." },
  { title: "Recruiting Activation Sponsor", description: "Create a targeted employer brand experience designed to connect your company with high-quality tech talent." },
  { title: "Startup or Pitch Showcase Sponsor", description: "Align your brand with innovation, founders, investors, and emerging companies." },
  { title: "Community Partner Sponsor", description: "Support ecosystem growth through community-centered branding, ticket access, and audience engagement." },
  { title: "Content Sponsor", description: "Gain visibility through recap videos, photo albums, interview clips, branded content, and post-event social promotion." },
];

export const SEED_FAQS = [
  { title: "Find out more about Tech Catalyst", description: "Discover Tech Catalyst and what's in store for this 2025 edition", icon: "/faqs/more-about.svg", articleCount: 5 },
  { title: "Attend Tech Catalyst as a visitor", description: "Information to help you choose your pass, select additional offers and manage your passes", icon: "/faqs/visitor.svg", articleCount: 16 },
  { title: "Take part in Tech Catalyst as a professional", description: "How to participate in Tech Catalyst as a partner, exhibitor or media", icon: "/faqs/professional.svg", articleCount: 16 },
  { title: "Take advantage of everything at Tech Catalyst with our survival guide", description: "Practical information to help you prepare your arrival, gain entry to the event, and find your way around", icon: "/faqs/guide.svg", articleCount: 12 },
  { title: "Use my digital tools", description: "Tips to help use the partner extranet, your personal account, and the Tech Catalyst app", icon: "/faqs/tool.svg", articleCount: 18 },
  { title: "Ask questions by category", description: "Structured approach for querying specific information by organizing questions into relevant categories in gathering targeted responses", icon: "/faqs/ask-questions.svg", articleCount: 12 },
];

export const SEED_SETTINGS: Record<string, string> = {
  siteName: "Tech Catalyst Summit",
  tagline: "Real relationships. Real opportunities.",
  contactEmail: "info@techcatalystsummit.com",
  websiteUrl: "https://www.techcatalystsummit.com",
  upcomingEventsUrl: "https://www.techcatalystsummit.com/event",
  instagramUrl: "https://www.instagram.com/techcatalystsummit",
  linkedinUrl: "https://www.linkedin.com/company/techcatalystsummit/",
  xUrl: "",
  ticketsUrl: "https://luma.com/ATW",
  vipDiscountCode: "CATALYSTVIP",
  vipDiscountPercent: "15",
  countdownTarget: "2026-10-28 18:00:00",
  sponsorVideoYoutubeId: "Y2chnjAZAdo",
  metaPixelId: "1643729593350912",
  aboutText:
    "Tech Catalyst Summit is a premier event platform and community initiative designed to bridge the gap between visionary executives, emerging tech talent, cutting-edge startups, and forward-thinking investors. Our mission is to accelerate innovation, fuel meaningful partnerships, and spotlight the trailblazers shaping the future of technology and cybersecurity.\n\nThrough dynamic in-person experiences—from high-impact panels to immersive networking and live pitch competitions—we create curated spaces that make tech exciting, inclusive, and actionable. As a Black-founded organization, we are deeply committed to representation, empowerment, and building pathways into tech for underrepresented communities.\n\nAt Tech Catalyst Summit, we don’t just talk about the future—we build it, together.",
  sponsorHeroSubheadline:
    "Tech Catalyst Summit connects sponsors with curated audiences across tech, AI, cybersecurity, startups, leadership, and innovation.",
  sponsorHeroSupporting:
    "Tech Catalyst Summit creates premium event experiences that connect brands with high-value audiences for visibility, leads, partnerships, recruiting, and meaningful business growth.",
  sponsorFormIntro:
    "Tell us about your goals, target audience, and upcoming priorities. Our team will follow up to explore the right sponsorship or partnership opportunity for your brand.",
  faqHeroTitle: "The Official FAQ for Tech Catalyst 2025",
  faqHeroText:
    "Tech Catalyst 2025 is an annual technology conference focusing on the latest innovations and trends in the tech industry, aimed at empowering developers, entrepreneurs, and enthusiasts to drive future advancements.",
};

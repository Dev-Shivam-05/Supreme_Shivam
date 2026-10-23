import { site } from "./site";

/**
 * Privacy policy and terms content — DEV-HANDOVER task 10, rewritten for Phase 6.
 *
 * Written from what this codebase actually does, not from a template. If the
 * data handling changes, this text has to change with it. The specific claims it
 * makes and where they are enforced:
 *
 *   "no cookies unless you opt in"             → components/vi/* load nothing until consent
 *   "aggregate analytics are cookieless"       → components/analytics/beacon.tsx
 *   "referrer kept as a domain only"           → app/api/collect/route.ts
 *   "arrival as one word; region + time zone,
 *    never city"                               → app/api/collect/route.ts (Phase 6b)
 *   "IP is keyed-hashed, never stored"         → lib/keyed-hash.ts, app/api/contact|collect/route.ts
 *   "journey records only IDs, never URLs"     → lib/vi/catalog.ts allowlists + lib/vi/engine.ts
 *   "15-day window, deleted at 22 days"        → lib/vi/policy.ts + vi_* TTL indexes
 *   "withdrawal erases immediately"            → lib/vi/engine.ts withdraw()
 *   "registry sees the network block only"     → lib/vi/network-core.ts networkPrefix()
 *   "no gender or sensitive traits"            → engine exact-key allowlist; no such form field
 *   "enquiries deleted after 24 months"        → models/lead.ts TTL index
 *   "analytics deleted after 180 days"         → models/event.ts TTL index
 *
 * India's DPDP Act 2023 applies; GDPR applies to any EU visitor. Not legal
 * advice — for a personal portfolio a clear, accurate policy covering the
 * points below is normally sufficient.
 */

export const LEGAL_UPDATED = "23 October 2026";

export type LegalSection = { h: string; id?: string; p?: string[]; list?: string[] };

export const privacySections: LegalSection[] = [
  {
    h: "Who is responsible for your data",
    p: [
      `This site is run by ${site.name}, an independent developer based in ${site.location}, India. There is no company, no data-processing department and no third party managing this on my behalf.`,
      `If you want anything on this page explained, corrected or acted on, write to ${site.email} and it reaches me directly.`,
    ],
  },
  {
    h: "No cookies unless you turn on visit insights",
    p: [
      "No advertising cookies, no tracking pixels, no Google Analytics, no Meta pixel, no third-party trackers of any kind. If you never press “Allow selected” on the visit-insights card, this site sets no cookies at all.",
      "Two things are stored in your own browser and never sent anywhere: your light or dark theme choice, and your answer to the visit-insights card, so you are not asked again. A “No thanks” is remembered for 180 days and then forgotten. Clearing your browser data removes both, and nothing breaks.",
      "If you do allow visit insights, two cookies are set: sb_vi, a random identifier for this browser that lasts at most 22 days, and sb_vi_s, which ends when you close the browser. Page scripts cannot read either one, and neither contains anything about you.",
    ],
  },
  {
    h: "What I collect when you use the contact form",
    p: [
      "If you send an enquiry, I receive exactly what you type: your name, your email address, the subject if you fill one in, and your message. It is emailed to me and stored so I can reply and keep a record of the conversation.",
      "Three more fields are optional: whether you are enquiring as an individual, for an organisation, as a recruiter or as an agency; the name of your organisation; and the topic. They are stored exactly as you choose them and are never checked against anything.",
      "Alongside it I store your browser's user-agent string and a keyed one-way hash of your IP address, made with a secret key that exists only on the server. The hash exists only so a repeat spammer can be recognised. Your actual IP address is not written down anywhere I control, and without that key the hash cannot be turned back into it.",
      "The form works the same whether or not you allowed visit insights.",
    ],
  },
  {
    h: "What I collect when you just read the site",
    p: [
      "The site counts pageviews with its own analytics, built into the site rather than bought from anyone. For each page you open it records the path, the site's own ID for that page, the domain name of the site that linked you here (not the full address), short campaign codes if the link carried any, and a general description of your device, browser and operating system.",
      "On the first page you open it also records how you arrived, as one word from a fixed list: direct, search, AI assistant, social, developer community, email, campaign or referral. Every later page in the same visit is recorded as internal. The address you came from is never sent.",
      "It records an approximate location: your country, your state or region, and your time zone. These are worked out by the hosting provider from your IP address, so they describe where your internet connection appears to be, which can be wrong (a VPN or a mobile network can place you in another region). Your city is not recorded in these statistics.",
      "It also records a visitor identifier, and this is the part worth being precise about: it is a keyed hash of today's date, your IP address and your browser string, made with a secret key that exists only on the server. The IP itself is never stored. Because the date is part of it, the identifier changes every day at midnight UTC, so today's visits cannot be joined to yesterday's. It is a counter, not a profile.",
      "Some of these numbers are published openly on the /stats page. Nothing there identifies anyone.",
    ],
  },
  {
    h: "Visit insights — only if you say yes",
    id: "visit-insights",
    p: [
      "When you first open the site, a small card asks whether I may understand why you visited. You can ignore it and keep reading; the site works the same either way. Nothing described in this section happens unless you press “Allow selected”. You choose each part separately:",
    ],
    list: [
      "Pages and buttons. For 15 days from your first page view, the site records which of its own pages you open — as a fixed ID such as “case study — AI-PULSE”, never a URL — which of its buttons you use (for example “contact”, “email”, “GitHub profile”), how you arrived as a category (“search engine”, “AI assistant”, “social”, “direct” and similar, never the address you came from), and, if you use the Cmd-K menu, only the broad topic of what you typed (“development”, “hiring”, “collaboration” or “other”), never the words.",
      "Link to an enquiry. Only if you also tick the box on the contact form, the pages you viewed in that browser session are attached to your enquiry, so I can see what you read. Nothing else is attached.",
      "Organisation lookup. The site asks the public internet registry responsible for your network who that network is registered to — usually an internet provider, a mobile carrier, a university or a company. It sends the registry the network block only (for example 49.36.0.0/24), never your full address, and your address is not stored. The answer describes the network, not you: being on a company's network does not mean you work there, and I never treat it as if it did.",
    ],
  },
  {
    h: "What visit insights are used for, and what they are not",
    p: [
      "From those records the site forms a small number of written hypotheses — for example “possible interest in development work” — each shown to me with the exact pages and buttons behind it, the other explanations that fit just as well, and what remains unknown. None of them is a score or a probability, and none of them ever triggers a message to you.",
    ],
    list: [
      "Never collected: gender, age, or any other personal or sensitive trait. There is no field for them and the system rejects them.",
      "Never done: device fingerprinting, tracking you on other sites, reconstructing your search history, buying contact details, or trying to work out who you are from your connection.",
      "Never sent: the text you type into any field you have not submitted, keystrokes, or the full address of any page.",
    ],
  },
  {
    h: "Why I collect any of it",
    list: [
      "To read and reply to your enquiry, and to keep a record of what was agreed.",
      "To know which pages people actually read, so the site can be improved.",
      "If you allow it, to understand why people visit — which work they look at and what brings them here.",
      "To stop the contact form and the site's own endpoints being abused by bots.",
      "Nothing is used for advertising, sold, rented, or shared for anyone else's marketing. Ever.",
    ],
  },
  {
    h: "Who else touches it",
    list: [
      "Vercel — hosts the site and serves the pages. Like every web host it keeps short-lived server request logs, which are outside my control.",
      "MongoDB Atlas — the database where enquiries, pageview counts and visit-insight records are stored.",
      "An SMTP email provider — delivers your enquiry to my inbox. It handles the message in transit.",
      "Only if you allow organisation lookup: IANA, which publishes the directory of registries, and the one regional internet registry responsible for your network (ARIN, RIPE NCC, APNIC, LACNIC or AFRINIC). The registry receives the network block described above, from this site's server, not from your browser.",
      "Google Fonts files are self-hosted on this domain, so your browser does not contact Google to load them.",
    ],
    p: [
      "That is the complete list. There is no analytics vendor, no CRM, no advertising network and no data broker in the chain.",
    ],
  },
  {
    h: "How long it is kept",
    p: [
      "Enquiries are deleted automatically 24 months after you send them. That is enforced by the database, not by me remembering.",
      "Pageview records are deleted automatically after 180 days, also enforced by the database.",
      "Visit-insight records — pages, buttons, the link to an enquiry, the organisation lookup and the hypotheses — are deleted 22 days after your first page view at the latest: the 15-day window plus a 7-day period for late records. A bare record of the window's start and end dates is removed within one further day, so the daily clean-up can log the deletion. The answer a registry gave about a network is cached for 30 days so the same network is not looked up twice; it contains nothing about you.",
      "A record that you agreed, and to what, is kept for 90 days. When visit-insight data is erased, a one-way marker is kept for 90 days so it cannot reappear from a backup; it cannot be traced back to you. Rejected requests to the site's endpoints are logged as an error code only, with no address and no content, for 7 days. Daily totals of how often the card was shown, accepted or declined are kept for 180 days.",
      "If you want your enquiry deleted sooner, ask and it is gone.",
    ],
  },
  {
    h: "Your rights",
    p: [
      "Under India's Digital Personal Data Protection Act 2023, and under the GDPR if you are in the EU or UK, you can ask me to:",
    ],
    list: [
      "Tell you what data of yours I hold.",
      "Correct anything that is wrong.",
      "Delete it.",
      "Stop using it, and withdraw any consent you previously gave.",
      "Send you a copy of it.",
      "Complain to a regulator if you are not satisfied with how I handled your request.",
    ],
  },
  {
    h: "Withdrawing visit insights",
    p: [
      "Use “Privacy choices” at the bottom of any page and press “Withdraw and erase”. Everything recorded about that visit is deleted at once — pages, buttons, any link to an enquiry, the organisation lookup and every hypothesis — the cookies are removed, and anything still in flight from your browser is refused. Your enquiry itself is not deleted by this; ask me if you want that too.",
    ],
  },
  {
    h: "How to ask",
    p: [
      `Email ${site.email} with what you want. There is no form to fill in and no account to create. I will reply within 30 days, and usually within 24 hours, because it is one person reading it.`,
      "I may ask you to confirm the email address the enquiry came from, so I do not hand your data to somebody else claiming to be you.",
    ],
  },
  {
    h: "Children",
    p: [
      "This site is a professional portfolio and is not directed at children. I do not knowingly collect data from anyone under 18. If you believe a child has sent an enquiry, tell me and I will delete it.",
    ],
  },
  {
    h: "Changes to this policy",
    p: [
      "If what the site does changes, this page changes with it and the date at the top moves. There is no version history to hunt through — what is on this page is what the site currently does.",
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    h: "What this page covers",
    p: [
      `This site is the portfolio of ${site.name}, an independent developer in ${site.location}, India. These terms cover using the website itself. They are not the contract for a project — paid work is governed by a separate written quote and scope that we both agree before anything starts.`,
    ],
  },
  {
    h: "Prices shown here are starting points",
    p: [
      `Where a page quotes a figure such as "from ${site.rateFrom}", that is a starting point for the simplest version of that work, not a quotation. The actual price depends on the scope, and you get a fixed number in writing after a scoping conversation, before any work begins.`,
      "Timelines shown are typical ranges based on comparable work. The agreed date for your project is the one written in your quote.",
    ],
  },
  {
    h: "Enquiries are not a contract",
    p: [
      "Sending the contact form starts a conversation. It does not book work, reserve time, or oblige either of us to anything. Work is only agreed when there is a written scope and quote that we have both accepted.",
    ],
  },
  {
    h: "What you can do with what is here",
    p: [
      "Read it, quote it, link to it, and share it. If you quote more than a line or two from the writing, credit it and link back to the original page.",
      "The photographs, the written posts, the case studies, the design and the code of this site are mine. Do not republish them wholesale or present them as your own work.",
    ],
  },
  {
    h: "Work shown belongs to the people who paid for it",
    p: [
      "Case studies describe projects built for clients or as open source. Client names, logos and the products themselves remain their owners' property and appear here as a record of work done, not as an endorsement of me by them.",
    ],
  },
  {
    h: "Accuracy, and the limits of it",
    p: [
      "The performance figures, metrics and outcomes described in the case studies were measured on those projects, under those conditions. They are evidence of what has been achieved, not a promise of what your project will achieve. Different constraints produce different numbers.",
      "The writing reflects my opinion at the time it was published. I do not go back and quietly edit posts to look more correct later.",
    ],
  },
  {
    h: "Availability",
    p: [
      "I try to keep the site up and correct, but it is a personal site on shared hosting. It may go down, and I offer no uptime guarantee for it. Nothing here creates liability for loss arising from the site being unavailable or from a decision taken on the basis of something you read on it.",
    ],
  },
  {
    h: "External links",
    p: [
      "Links to GitHub, LinkedIn, X, WakaTime and any other site are provided for convenience. What happens on those sites is governed by their terms and their privacy policies, not by mine.",
    ],
  },
  {
    h: "Governing law",
    p: [
      `These terms are governed by the laws of India, and disputes fall to the courts of ${site.address.region}.`,
    ],
  },
  {
    h: "Contact",
    p: [
      `Questions about anything on this page: ${site.email}.`,
    ],
  },
];

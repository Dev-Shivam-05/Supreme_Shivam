import { site } from "./site";

/**
 * Privacy policy and terms content — DEV-HANDOVER task 10.
 *
 * Written from what this codebase actually does, not from a template. If the
 * data handling changes, this text has to change with it. The specific claims it
 * makes and where they are enforced:
 *
 *   "no cookies, nothing stored for analytics" → components/analytics/beacon.tsx
 *   "IP is hashed, never stored"               → app/api/contact/route.ts, models/lead.ts
 *   "enquiries deleted after 24 months"        → models/lead.ts TTL index
 *   "analytics deleted after 180 days"         → models/event.ts TTL index
 *
 * India's DPDP Act 2023 applies; GDPR applies to any EU visitor. Not legal
 * advice — for a personal portfolio a clear, accurate policy covering the
 * points below is normally sufficient.
 */

export const LEGAL_UPDATED = "14 September 2026";

export type LegalSection = { h: string; p?: string[]; list?: string[] };

export const privacySections: LegalSection[] = [
  {
    h: "Who is responsible for your data",
    p: [
      `This site is run by ${site.name}, an independent developer based in ${site.location}, India. There is no company, no data-processing department and no third party managing this on my behalf.`,
      `If you want anything on this page explained, corrected or acted on, write to ${site.email} and it reaches me directly.`,
    ],
  },
  {
    h: "This site sets no cookies",
    p: [
      "No advertising cookies, no tracking pixels, no Google Analytics, no Meta pixel, no third-party trackers of any kind. That is why you are not being asked to dismiss a consent banner — there is nothing to consent to.",
      "Two things are stored in your own browser and never sent anywhere: your light or dark theme choice, and a flag recording that you have already seen the opening animation once this session. Both exist purely so the site behaves the way you left it. Clearing your browser data removes both, and nothing breaks.",
    ],
  },
  {
    h: "What I collect when you use the contact form",
    p: [
      "If you send an enquiry, I receive exactly what you type: your name, your email address, the subject if you fill one in, and your message. It is emailed to me and stored so I can reply and keep a record of the conversation.",
      "Alongside it I store your browser's user-agent string and a one-way cryptographic hash of your IP address. The hash exists only so a repeat spammer can be recognised. Your actual IP address is not written down anywhere I control, and the hash cannot be turned back into it.",
    ],
  },
  {
    h: "What I collect when you just read the site",
    p: [
      "The site counts pageviews with its own analytics, built into the site rather than bought from anyone. For each page you open it records the path, the referring site, any campaign tags in the link, your country, and a general description of your device, browser and operating system.",
      "It also records a visitor identifier, and this is the part worth being precise about: it is a cryptographic hash of a daily-rotating secret, your IP address and your browser string. The IP itself is never stored. The hash changes every day at midnight UTC, so today's visits cannot be joined to yesterday's. It is a counter, not a profile.",
      "Some of these numbers are published openly on the /stats page. Nothing there identifies anyone.",
    ],
  },
  {
    h: "Why I collect any of it",
    list: [
      "To read and reply to your enquiry, and to keep a record of what was agreed.",
      "To know which pages people actually read, so the site can be improved.",
      "To stop the contact form being abused by bots.",
      "Nothing is used for advertising, sold, rented, or shared for anyone else's marketing. Ever.",
    ],
  },
  {
    h: "Who else touches it",
    list: [
      "Vercel — hosts the site and serves the pages. Like every web host it keeps short-lived server request logs, which are outside my control.",
      "MongoDB Atlas — the database where enquiries and pageview counts are stored.",
      "An SMTP email provider — delivers your enquiry to my inbox. It handles the message in transit.",
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

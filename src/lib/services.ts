import { site } from "./site";

/**
 * Service and hire pages — DEV-HANDOVER task 7 (Goal B).
 *
 * These exist to be found by someone searching for a developer, not by someone
 * searching for Shivam. The queries they target are local and specific
 * (`web developer navsari`, `website developer surat`, `ai automation developer
 * india`) because the national ones — `website developer`, `mobile app
 * developer` — belong to agencies and marketplaces and are not winnable.
 *
 * Every page carries: an H1 naming the service AND the place, 500+ words of
 * real prose, a starting price, a timeline, proof that links to real case
 * studies, an FAQ, and a contact CTA. Pages without a price and a timeline
 * convert badly — clients filter on both.
 *
 * TIMELINES are Shivam's own figures, confirmed 2026-09-14: web 1–4 weeks,
 * mobile 2–8 weeks, automation 1–2 weeks per workflow. They live here, in one
 * place, and the FAQ answers below repeat them in words — change both together.
 */

export type ServiceFaq = { q: string; a: string };
export type ServiceSection = { h: string; p: string[] };

export type ServicePage = {
  slug: string;
  kind: "service" | "hire";
  index: string;
  label: string;
  /** The visible H1. Must name the service and the place. */
  h1: string;
  h1Accent: string;
  /** Metadata title (the layout appends "· Shivam Bhadoriya"). */
  title: string;
  description: string;
  /** `name` on the ProfessionalService node. */
  schemaName: string;
  lede: string;
  priceFrom: string;
  priceNote: string;
  timeline: string;
  sections: ServiceSection[];
  deliverables: { title: string; body: string }[];
  /** Project slugs from lib/site.ts — rendered as linked proof cards. */
  proof: string[];
  faqs: ServiceFaq[];
};

const CITY = site.address.locality;
const REGION = site.address.region;

export const servicePages: ServicePage[] = [
  {
    slug: "/services/web-development",
    kind: "service",
    index: "01",
    label: "Service",
    h1: "Web development in",
    h1Accent: `${CITY} & Surat.`,
    title: "Web Development",
    description: `Web development in ${CITY} and Surat by Shivam Bhadoriya, AI Engineer. Custom websites and web apps on Next.js, React, Node and MongoDB. From ${site.rateFrom}.`,
    schemaName: `${site.name} — Web Development, ${CITY} & Surat`,
    lede: `I build websites and web applications that hold up under inspection — fast, measured, and documented — for businesses in ${CITY}, Surat and across ${REGION}.`,
    priceFrom: site.rateFrom,
    priceNote: "Fixed quote after a free 30-minute scoping call. No hourly billing on fixed-scope work.",
    timeline: "1–4 weeks",
    sections: [
      {
        h: "What I actually build",
        p: [
          "Business and portfolio sites that load fast on a phone on mobile data, not just on a laptop on wifi. Marketing sites with a CMS behind them so you can change your own copy without calling a developer. And full web applications — dashboards, booking systems, internal tools, customer portals — with real user accounts, real permissions and a real database.",
          "The stack is Next.js and React on the front, Node and Express behind, MongoDB or PostgreSQL for data, deployed on Vercel. That is not a fashion choice. It is the stack I have shipped production systems on, which means when something breaks at 11pm I know where to look.",
        ],
      },
      {
        h: "How the work runs",
        p: [
          "Before anything is built I write a specification: the exact pages, the exact fields, what each button does, and what 'finished' means. You approve that document. It is the thing we both point at when there is a disagreement later, and it is the reason projects here do not drift.",
          "Then I build in phases you can see. You get a live preview URL from week one and it updates as the work lands, so you are never waiting until the end to find out it is not what you pictured. I review every change before it ships, and the parts that matter — payments, logins, anything that touches data — get tests.",
          "I work the way I work at Aaziko Global LLP, where I am an AI Engineer: I write the spec, direct the coding agents that implement it, and review and test what comes back. That is why a fixed quote is realistic. The implementation is fast now; the judgement, the architecture and the review are what you are paying for, and those are mine.",
        ],
      },
      {
        h: "Speed is part of the brief, not an upsell",
        p: [
          "Every site I ship is built to a performance budget. On JSClimateNow that meant 98/100 Lighthouse and roughly 60% less bandwidth through a request-throttling cache. On database-backed work it has meant 70% faster queries through indexing and aggregation rather than throwing a bigger server at it.",
          "This matters commercially, not just technically. A slow site loses visitors before they read anything, and Google ranks it lower for the same query. If a page is slow at handover, it is not finished.",
        ],
      },
      {
        h: "What it costs and what happens first",
        p: [
          `Projects start at ${site.rateFrom}. A brochure site for a local business sits near the bottom of that; a web application with accounts, roles and a dashboard sits well above it. I quote a fixed price after a free 30-minute call where you tell me the problem and I tell you honestly whether I am the right person for it.`,
          "If what you need is a five-page site that a template would solve for a tenth of the price, I will say so. I would rather lose the enquiry than take the money for work that does not need me.",
        ],
      },
    ],
    deliverables: [
      { title: "A written spec", body: "Pages, fields, behaviour and acceptance criteria — approved by you before code starts." },
      { title: "A live preview from week one", body: "A URL that updates as the work lands. No end-of-project surprises." },
      { title: "Performance budget", body: "Built to a Lighthouse target and measured on a throttled mobile profile before handover." },
      { title: "Search-ready out of the box", body: "Metadata, structured data, sitemap and robots configured, not bolted on later." },
      { title: "The code, in your account", body: "Your GitHub, your hosting, your database. No lock-in and no hostage situations." },
      { title: "30 days of fixes included", body: "Anything that does not match the approved spec gets fixed free after launch." },
    ],
    proof: ["cgpe-connect", "observable-machine", "jsclimatenow"],
    faqs: [
      {
        q: "How much does a website cost?",
        a: `Projects start at ${site.rateFrom}. A simple business site for a local shop or clinic is near that figure. A web application with logins, roles, a dashboard and a payment flow is a different scale of work and will be quoted higher. You get a fixed number before anything starts — I do not bill hourly on fixed-scope work.`,
      },
      {
        q: "How long does it take?",
        a: "One to four weeks, depending on how many pages there are and how much of the content you already have written. The single biggest cause of delay is waiting on copy and photographs from the client, so the faster you get me those, the faster it ships.",
      },
      {
        q: "Do you work with clients outside Navsari and Surat?",
        a: `Yes. I am based in ${CITY} and I meet clients in person in ${CITY} and Surat, but most of the work is remote and I have collaborated with teams across time zones, async-first. Distance has not been the constraint on any project I have shipped.`,
      },
      {
        q: "Who owns the code when it is finished?",
        a: "You do. It goes in your GitHub account, deployed to your hosting, connected to your database. I hand over the accounts and the documentation at the end. If you want to hire someone else next year, nothing stops you.",
      },
      {
        q: "Can you take over a site someone else built?",
        a: "Often, yes — but I will look at it first and tell you honestly whether fixing it or rebuilding it is cheaper. Inheriting a badly built codebase and patching it forever is usually the more expensive path, and I would rather say that up front than discover it three weeks in.",
      },
      {
        q: "What do you need from me to start?",
        a: "A conversation about the problem, examples of sites you like and dislike, whatever copy and images you already have, and one person who can make decisions. That last one matters more than people expect — projects with three approvers take twice as long.",
      },
    ],
  },
  {
    slug: "/services/mobile-app-development",
    kind: "service",
    index: "02",
    label: "Service",
    h1: "Mobile app development in",
    h1Accent: `${CITY} & Surat.`,
    title: "Mobile App Development",
    description: `Mobile app development in ${CITY} and Surat. Cross-platform Android and iOS apps in React Native, on a Node and MongoDB backend. From ${site.rateFrom}.`,
    schemaName: `${site.name} — Mobile App Development, ${CITY} & Surat`,
    lede: "Cross-platform apps for Android and iOS from one codebase, on the same tested backend patterns I use for production web systems.",
    priceFrom: site.rateFrom,
    priceNote: "Fixed quote after a free 30-minute scoping call. Store submission included.",
    timeline: "2–8 weeks, including store review",
    sections: [
      {
        h: "One codebase, both stores",
        p: [
          "I build in React Native, which means Android and iOS come out of a single codebase rather than two separate builds. For almost every business app — a booking tool, a delivery tracker, a customer account app, an internal tool for your field staff — that is the correct trade-off. You pay for one app and ship to both stores.",
          "Where it is not the correct trade-off, I will tell you. If your app depends on heavy device-specific hardware, real-time video processing, or platform features that only exist natively, cross-platform will fight you and you should hire a native developer. That is a short conversation, not a three-week discovery.",
        ],
      },
      {
        h: "What I can and cannot show you",
        p: [
          "My shipped app work is covered by client confidentiality, so it is not listed on this site and I will not name it on a first call. That is the normal arrangement for contract work, and you would want the same protection on yours.",
          "What I can show you is the layer underneath, which is the part that actually decides whether an app succeeds — and all of it is public, inspectable and linked below.",
        ],
      },
      {
        h: "The part that actually decides whether an app works",
        p: [
          "Most apps that fail do not fail at the screens. They fail at the backend — the API is slow, the data model was wrong, the auth leaks, there is no way to see what went wrong in production. That is the part I have the most production experience in.",
          "On CGPE Connect I built exactly this layer: an Express and MongoDB backend with JWT authentication and role-based access on every route, rate limiting, input sanitisation, structured logging, realtime updates over Socket.io, and file storage on S3 behind signed URLs. An app is a client on top of a system like that. Getting the system right is most of the job.",
        ],
      },
      {
        h: "How the work runs",
        p: [
          "The same way as the web work: a written specification first, with every screen and every state described — including the loading state, the empty state and what the user sees when the network drops, because those are where apps feel cheap.",
          "You get builds on your own phone throughout, not screenshots. Testing an app on a real device on real mobile data is the only way to know it is any good, and it catches the problems that never appear in a simulator.",
          "I handle the Play Store and App Store submission, the store listings, the privacy declarations and the review process. First-time submissions get rejected for predictable reasons; knowing them in advance is worth a fortnight.",
        ],
      },
      {
        h: "Cost, timeline and honesty about scope",
        p: [
          `Apps start at ${site.rateFrom} and realistically sit above that, because an app is a backend, two store listings and a review process as well as a set of screens. Two to eight weeks to a first release, depending on scope, and roughly one of those weeks is store review, which is outside anyone's control.`,
          "If your idea is really a website that people would open on a phone, say a menu, a catalogue or a booking form, then a fast mobile web app is cheaper, ships sooner, needs no store approval and updates instantly. I will point that out rather than sell you an app you do not need.",
        ],
      },
    ],
    deliverables: [
      { title: "One codebase, two stores", body: "React Native, shipped to Google Play and the App Store." },
      { title: "A real backend", body: "Node and MongoDB with authentication, roles, rate limiting and structured logs." },
      { title: "Builds on your phone", body: "Test on a real device throughout, not in a simulator at the end." },
      { title: "Store submission handled", body: "Listings, assets, privacy declarations and the review process." },
      { title: "Offline and failure states designed", body: "What the app does with no signal is part of the spec, not an afterthought." },
      { title: "30 days of fixes included", body: "Anything that does not match the approved spec gets fixed free after launch." },
      { title: "Your confidentiality", body: "Your app is not put on my portfolio unless you say it can be. Same protection I give every client." },
    ],
    proof: ["cgpe-connect", "jsclimatenow", "ai-pulse"],
    faqs: [
      {
        q: "How much does a mobile app cost?",
        a: `Apps start at ${site.rateFrom} and most sit meaningfully above it. The price is driven by the backend and the number of distinct screens with their own logic, not by the platforms — because one React Native codebase covers both Android and iOS, you are not paying twice.`,
      },
      {
        q: "How long until it is in the store?",
        a: "Two to eight weeks for a first release, depending on how many screens have their own logic. Roughly one of those weeks is Google and Apple's review, which nobody can speed up. Updates after launch are much faster — usually days.",
      },
      {
        q: "Do I need an app, or would a website do?",
        a: "If people will use it occasionally and you mainly need to be found, a fast mobile website is cheaper, ships sooner, needs no store approval and updates instantly. An app earns its cost when you need push notifications, offline use, device hardware, or a customer who opens it every week. I will tell you which one you are.",
      },
      {
        q: "Android and iOS both, or one first?",
        a: "Both, from one codebase — that is the whole reason for React Native. Shipping one platform first only makes sense if you are validating an idea and want to spend less, and in that case Android first is usually right in India.",
      },
      {
        q: "Can I see an app you have built?",
        a: "Not on this page — my shipped app work is under client confidentiality and I do not publish clients' products without permission. I can talk through the architecture, the decisions and the problems on a call, and the backend and performance work linked below is public and inspectable. You get the same confidentiality on your project.",
      },
      {
        q: "Who owns the developer accounts?",
        a: "You do, and this matters more than people realise. The Play Console and Apple Developer accounts must be registered to you, not to me. If a developer offers to publish under their own account, that is a lock-in you will regret.",
      },
      {
        q: "What happens after launch?",
        a: "Thirty days of fixes for anything that does not match the spec are included. Beyond that I can work on a monthly retainer for updates and OS-version maintenance, or hand the codebase to your team with documentation. Both are fine; neither is compulsory.",
      },
    ],
  },
  {
    slug: "/services/ai-automation",
    kind: "service",
    index: "03",
    label: "Service",
    h1: "AI automation for",
    h1Accent: "Indian businesses.",
    title: "AI Automation",
    description: `AI automation and workflow engineering by Shivam Bhadoriya, AI Engineer at Aaziko Global LLP. Unattended pipelines, integrations and internal tooling. From ${site.rateFrom}.`,
    schemaName: `${site.name} — AI Automation & Workflow Engineering, India`,
    lede: "The repetitive work in your business, running unattended, tested, and with a visible trail of what it did. This is the thing I actually do for a living.",
    priceFrom: site.rateFrom,
    priceNote: "Fixed quote per workflow after a free 30-minute call. Most automations cost less than the salary of the hours they return.",
    timeline: "1–2 weeks per workflow",
    sections: [
      {
        h: "What this means in practice",
        p: [
          "Not a chatbot on your website. The work that eats a person's day: copying data between two systems that do not talk to each other, generating the same report every Monday, chasing invoices, sorting and routing incoming enquiries, publishing content on a schedule, keeping a spreadsheet and a database in sync.",
          "Each of those is a workflow with a trigger, a set of steps and a definition of success. Once that is written down precisely, it can run without a person — and it will run at 3am on a Sunday, which the person will not.",
        ],
      },
      {
        h: "Why I am credible on this specifically",
        p: [
          "I am an AI Engineer at Aaziko Global LLP. In August 2026, AI agents made 99.77% of my line changes; in October 2025 they made none. The whole of my working practice is now writing the specification, directing agents to implement it, and reviewing and testing what comes back. Automating other people's work is the same skill applied outward.",
          "AI-PULSE is the public proof. It is a YouTube channel that publishes itself: one long-form video and one Short about a trending AI tool, every day, with nobody pressing go. It runs entirely inside GitHub Actions — no server, no cron box, no monthly bill — and its own tests run before the publish step, so a broken run fails loudly instead of publishing something wrong. That last detail is the difference between automation you can leave alone and automation you have to babysit.",
        ],
      },
      {
        h: "The failure mode I design against",
        p: [
          "An unattended system's danger is not that it stops. It is that it keeps going and quietly does the wrong thing for three weeks before anyone notices. So every automation I build has three things: tests that gate the step which is expensive to get wrong, a log of what it did and when, and an alert that reaches a human when it fails.",
          "Silence is cheaper than a wrong invoice. If the pipeline is not certain, it stops and tells you.",
        ],
      },
      {
        h: "Cost, and how to tell whether it is worth it",
        p: [
          `Automations start at ${site.rateFrom} per workflow and most take one to two weeks. The arithmetic is usually simple: count the hours a week the task currently takes, multiply by what that person's hour costs you, and multiply by fifty. If the automation costs less than that, it pays for itself inside a year and keeps paying every year after.`,
          "Where it is not worth it: tasks that happen rarely, tasks whose rules change every month, and tasks where a human judgement call is the actual work. I will tell you which of your processes are in that category rather than automating them badly.",
        ],
      },
    ],
    deliverables: [
      { title: "A written workflow spec", body: "The trigger, every step, every failure path, and what success means — before anything is built." },
      { title: "It runs where you are", body: "GitHub Actions, a scheduled job or your existing tooling. No new server unless one is genuinely needed." },
      { title: "Tests before the expensive step", body: "The action that costs money or reaches a customer does not run unless the checks pass." },
      { title: "A visible trail", body: "A log of every run, what it processed and what it decided. You can audit it." },
      { title: "Alerts that reach a person", body: "Failures surface immediately instead of being discovered a month later." },
      { title: "Handover documentation", body: "How it works, how to change it, how to turn it off. In English." },
    ],
    proof: ["ai-pulse", "observable-machine", "cgpe-connect"],
    faqs: [
      {
        q: "What can actually be automated in my business?",
        a: "Anything with a clear trigger and repeatable rules: moving data between systems, recurring reports, invoice and quote generation, routing enquiries, scheduled publishing, syncing a spreadsheet with a database, monitoring something and alerting when it changes. If you can write down the steps, it can usually run itself.",
      },
      {
        q: "How much does an automation cost?",
        a: `From ${site.rateFrom} per workflow, quoted fixed after a free 30-minute call. Work out the hours a week the task takes now, multiply by the hourly cost and by fifty — if the automation costs less than that, it has paid for itself within a year.`,
      },
      {
        q: "Will it need a server I have to pay for every month?",
        a: "Usually not. AI-PULSE — which publishes two videos a day, unattended — runs entirely inside GitHub Actions with no infrastructure cost at all. I default to that and only add a server when the work genuinely requires one.",
      },
      {
        q: "What happens when it breaks?",
        a: "It stops and tells you, rather than continuing and doing the wrong thing. Every workflow gets tests in front of the step that is expensive to get wrong, a run log you can inspect, and an alert that reaches a person. Silence is cheaper than a wrong invoice.",
      },
      {
        q: "Is this the same as ChatGPT writing my emails?",
        a: "No. That is a person using a tool. This is a system that runs on a schedule or a trigger, without anyone opening it, with tests and logging around it. An AI model may be one step inside the pipeline, or there may be no model at all — the value is in the workflow being reliable, not in which technology is inside it.",
      },
      {
        q: "Do you take over automations someone else built?",
        a: "Yes, and the first thing I do is find out whether it has any tests or logging. Most inherited automations have neither, which is why nobody trusts them. Adding those is often cheaper than rebuilding and is where I would start.",
      },
    ],
  },
  {
    slug: "/hire/web-developer-navsari",
    kind: "hire",
    index: "04",
    label: "Hire",
    h1: "Web developer in",
    h1Accent: `${CITY}.`,
    title: `Web Developer in ${CITY}`,
    description: `Looking for a web developer in ${CITY}? Shivam Bhadoriya builds fast websites, web apps and AI automation for ${CITY} businesses. From ${site.rateFrom}. Meet in person.`,
    schemaName: `${site.name} — Web Developer, ${CITY}`,
    lede: `I live and work in ${CITY}. If you are a business here that needs a website, a web application or a process automated, you can sit across a table from the person who will actually build it.`,
    priceFrom: site.rateFrom,
    priceNote: "Free 30-minute scoping call or an in-person meeting in Navsari. Fixed quote after it.",
    timeline: "1–4 weeks",
    sections: [
      {
        h: "Why local matters more than people admit",
        p: [
          `Most web work for ${CITY} businesses goes to an agency in a bigger city or to a marketplace freelancer three time zones away. It usually works, until it does not — and then you are raising a ticket with someone who has never seen your shop, does not know your season, and answers in four days.`,
          `I am in ${CITY}. You can meet me, show me the business rather than describe it, and get an answer the same day. When something breaks the week before your busiest month, that difference is the whole thing.`,
        ],
      },
      {
        h: "What I build for businesses here",
        p: [
          "Websites that load fast on a phone on mobile data, because that is how your customers will actually see it. Booking and enquiry systems that put requests somewhere you can act on them instead of a mailbox nobody reads. Catalogues and product sites for traders and manufacturers. Internal tools that replace the spreadsheet three people are emailing back and forth.",
          "And increasingly, automation: the repetitive part of your operation running by itself. That is my day job — I am an AI Engineer at Aaziko Global LLP — and it is usually the cheapest thing on this list relative to what it gives back.",
        ],
      },
      {
        h: "The proof, with numbers",
        p: [
          "I do not ask anyone to take the craft on trust. CGPE Connect is a production operations platform with realtime dashboards, role-separated access and a document vault, replacing spreadsheets and email for agents and admins. JSClimateNow scores 98 out of 100 on Lighthouse and cut bandwidth by roughly 60% through a caching layer. Database work has meant 70% faster queries through indexing and aggregation.",
          "The site you are reading is itself a proof point: it runs its own analytics pipeline, and the numbers are public at /stats. Most portfolios show screenshots. This one lets you inspect the machine.",
        ],
      },
      {
        h: "What it costs, plainly",
        p: [
          `Projects start at ${site.rateFrom}, quoted fixed after a free 30-minute conversation. A straightforward site for a local business sits near that; anything with logins, roles or payments sits above it. Most sites take one to four weeks, and the usual reason one takes longer is waiting on photographs and copy.`,
          "If a ready-made template or a page on a marketplace would genuinely solve your problem for a fraction of the price, I will say so on the call. I would rather give you that answer for free than take a project that did not need a developer.",
        ],
      },
    ],
    deliverables: [
      { title: "Meet in person", body: `In ${CITY}, before you commit to anything. No obligation and no cost.` },
      { title: "A fixed quote", body: "A number and a date, in writing, after the scoping call. Not an hourly meter." },
      { title: "Built for phones first", body: "Measured on a throttled mobile connection, because that is how your customers arrive." },
      { title: "Found on Google", body: "Metadata, structured data and a sitemap configured properly, plus help setting up your Business Profile." },
      { title: "Everything in your name", body: "Domain, hosting, database and code registered to you. No lock-in." },
      { title: "Someone who answers", body: "Same-day replies, and a person who can come and look at it." },
    ],
    proof: ["cgpe-connect", "jsclimatenow", "observable-machine"],
    faqs: [
      {
        q: `How much does a website cost in ${CITY}?`,
        a: `Mine start at ${site.rateFrom} for a business site, quoted fixed after a free call. You will see cheaper on marketplaces and from template resellers — sometimes that is genuinely the right answer for a very simple brochure site, and I will tell you when it is. What you get here instead is a written spec, a performance budget, proper search setup, and a developer in the same town.`,
      },
      {
        q: "Can we meet before I decide?",
        a: `Yes, and I would prefer it. A 30-minute conversation in ${CITY} — or a call if that is easier — costs nothing and commits you to nothing. It is also the fastest way for both of us to find out whether this is a good fit.`,
      },
      {
        q: "Do you also handle the domain and hosting?",
        a: "Yes, and I set them up in your name, not mine. I will tell you exactly what to buy and where, so you are paying the registrar directly at cost instead of a marked-up reseller price. The accounts stay yours.",
      },
      {
        q: "My current website is slow and nobody finds it. Can you fix it?",
        a: "Usually. I will look at it first and tell you whether fixing it or rebuilding it is cheaper — those are genuinely different answers depending on how it was built, and I would rather find that out before you pay me than after.",
      },
      {
        q: "Do you work with businesses in Surat too?",
        a: "Yes — Surat is an hour away and a lot of the work comes from there. There is a dedicated page for it, and in-person meetings in Surat are no problem.",
      },
      {
        q: "What if I need changes after it launches?",
        a: "Thirty days of fixes for anything that does not match the agreed spec are included. After that, small changes are quoted individually or covered by a monthly retainer if you would rather have someone on call. You are never obliged to keep paying me to keep your site working.",
      },
    ],
  },
  {
    slug: "/hire/web-developer-surat",
    kind: "hire",
    index: "05",
    label: "Hire",
    h1: "Web developer for",
    h1Accent: "Surat businesses.",
    title: "Web Developer in Surat",
    description: `Web and app developer for Surat businesses. Shivam Bhadoriya builds fast websites, web apps and AI automation. Based an hour away in ${CITY}. From ${site.rateFrom}.`,
    schemaName: `${site.name} — Web Developer serving Surat`,
    lede: `I am based in ${CITY}, an hour from Surat, and a large share of my work comes from Surat businesses — textiles, trading, manufacturing and services.`,
    priceFrom: site.rateFrom,
    priceNote: "Free 30-minute scoping call, or I come to you in Surat. Fixed quote after it.",
    timeline: "1–4 weeks",
    sections: [
      {
        h: "Close enough to turn up",
        p: [
          `Surat has no shortage of agencies. What it has less of is a developer who will sit in your office, understand the actual operation, and then build the thing himself rather than passing it to a junior you never meet. I am an hour away in ${CITY}, which is close enough to turn up when it matters and far enough that I am not charging city agency overheads.`,
          "Most of the work happens remotely, the same as it would with anyone. The difference is that when a launch is going badly, being able to be in the room is worth more than another email thread.",
        ],
      },
      {
        h: "What Surat businesses usually need",
        p: [
          "Trading and textile businesses mostly need two things: a site that makes them look credible to a buyer who found them on Google, and a catalogue that is actually maintainable — searchable, filterable, and updatable by someone in the office rather than by a developer.",
          "Manufacturers and service businesses tend to need the internal side: enquiry handling that does not live in one person's inbox, order or job tracking that replaces the shared spreadsheet, dashboards that tell the owner what is happening without asking three people. That is the work I have the most production experience in.",
          "And the automation layer underneath all of it — data moving between systems, reports generating themselves, follow-ups going out on schedule. That is my day job as an AI Engineer at Aaziko Global LLP, and it is usually the highest-return item on the list.",
        ],
      },
      {
        h: "Built to be found, not just built",
        p: [
          "A site nobody finds is an expensive brochure. Every build ships with the search groundwork done: correct metadata, structured data, a sitemap submitted to Google, a performance budget measured on a throttled mobile connection, and help setting up your Google Business Profile so you appear in the map results for local searches.",
          "The performance part is not cosmetic. JSClimateNow scores 98 out of 100 on Lighthouse with roughly 60% less bandwidth than it started with; on database work, indexing and aggregation have taken query times down by 70%. Fast pages keep visitors and rank better for the same query.",
        ],
      },
      {
        h: "Price, timeline, and a straight answer",
        p: [
          `Projects start at ${site.rateFrom} with a fixed quote after a free 30-minute call. Most sites take one to four weeks. Everything — domain, hosting, database, code — is registered in your name from day one.`,
          "If your problem does not need a custom build, I will tell you that on the call rather than three weeks into an invoice.",
        ],
      },
    ],
    deliverables: [
      { title: "In-person when it counts", body: "I come to Surat for scoping and for launch. An hour away, not a time zone." },
      { title: "A fixed quote", body: "A number and a date in writing, after a free scoping conversation." },
      { title: "Maintainable catalogues", body: "Product and listing data your own office staff can update, without calling a developer." },
      { title: "Internal tools that replace spreadsheets", body: "Enquiry handling, job tracking and dashboards with real roles and permissions." },
      { title: "Search groundwork done", body: "Metadata, structured data, sitemap, Search Console and Business Profile setup." },
      { title: "Everything in your name", body: "Domain, hosting, database and repository. You are never locked in." },
    ],
    proof: ["cgpe-connect", "observable-machine", "ai-pulse"],
    faqs: [
      {
        q: "What does a website cost for a Surat business?",
        a: `From ${site.rateFrom}, fixed after a free call. A credibility site with a contact form is near that. A searchable product catalogue, or anything with logins and roles, is higher. You get the number before any work starts.`,
      },
      {
        q: "Will you come to our office in Surat?",
        a: `Yes. I am in ${CITY}, about an hour away, and I come to Surat for scoping meetings and launches at no extra charge. The rest of the work runs remotely, which is how it should be — you are paying for the build, not for travel.`,
      },
      {
        q: "Can our staff update the product catalogue themselves?",
        a: "Yes, and this should be non-negotiable. A catalogue only a developer can update becomes stale within six months. I build the admin side so your own office staff can add, edit and remove items without touching code.",
      },
      {
        q: "How long does it take?",
        a: "One to four weeks for most sites. Photographs and product data from your side are almost always the thing that decides which end of that range you land on.",
      },
      {
        q: "We already have a site. Should we fix it or start again?",
        a: "I will look at it and give you a straight answer. Sometimes the existing site is sound and the problem is search setup and speed, which is far cheaper to fix. Sometimes it was built in a way that makes every future change expensive, and rebuilding is cheaper within a year. It depends on the code, not on a sales preference.",
      },
      {
        q: "Do you handle Google Business Profile and local search?",
        a: "Yes, and for a Surat business it is often worth more than the website itself. The map results at the top of a local search are driven by your Business Profile, not by your site. I will set it up, connect it to your site and show you how to ask customers for reviews.",
      },
    ],
  },
];

export function getServicePage(slug: string) {
  return servicePages.find((p) => p.slug === slug);
}

export const serviceOnly = servicePages.filter((p) => p.kind === "service");
export const hireOnly = servicePages.filter((p) => p.kind === "hire");

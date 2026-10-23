import {
  Activity,
  FileText,
  FolderKanban,
  HeartPulse,
  Image as ImageIcon,
  Inbox,
  Radio,
  Users,
  type LucideIcon,
} from "lucide-react";

export type PageId =
  | "overview"
  | "feed"
  | "audience"
  | "leads"
  | "projects"
  | "writing"
  | "media"
  | "status";

export type NavItem = { id: PageId; label: string; icon: LucideIcon };

/**
 * Four groups, each with a one-line statement of what it answers.
 *
 * The subtitle is the point: the old panel was five unlabelled tabs and you had
 * to open one to remember what it held. A group that cannot be described in a
 * line does not deserve to be a group.
 */
export type NavGroup = { id: string; title: string; subtitle: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    id: "telemetry",
    title: "Telemetry",
    subtitle: "Who is here, from where, and why",
    items: [
      { id: "overview", label: "Overview", icon: Activity },
      { id: "feed", label: "Live feed", icon: Radio },
      { id: "audience", label: "Visitors", icon: Users },
    ],
  },
  {
    id: "pipeline",
    title: "Pipeline",
    subtitle: "Enquiries and who sent them",
    items: [{ id: "leads", label: "Leads", icon: Inbox }],
  },
  {
    id: "content",
    title: "Content",
    subtitle: "What the site says",
    items: [
      { id: "projects", label: "Projects", icon: FolderKanban },
      { id: "writing", label: "Writing", icon: FileText },
      { id: "media", label: "Media", icon: ImageIcon },
    ],
  },
  {
    id: "system",
    title: "System",
    subtitle: "Health, indexing and deploys",
    items: [{ id: "status", label: "Status", icon: HeartPulse }],
  },
];

export const ALL_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);

export const PAGE_TITLE: Record<PageId, { eyebrow: string; title: string; blurb: string }> = {
  overview: { eyebrow: "Live telemetry", title: "Overview", blurb: "Traffic, sources and what the numbers actually mean." },
  feed: { eyebrow: "Event stream", title: "Live feed", blurb: "Every pageview as it lands, newest first." },
  audience: { eyebrow: "Consented journeys", title: "Visitors", blurb: "Who arrived, how, and what their visit suggests — every claim labelled." },
  leads: { eyebrow: "CRM-lite", title: "Leads", blurb: "Enquiries from the contact form." },
  projects: { eyebrow: "Case studies", title: "Projects", blurb: "The work shown on /work." },
  writing: { eyebrow: "Site copy", title: "Writing", blurb: "Headlines and section content." },
  media: { eyebrow: "Assets", title: "Media", blurb: "Images uploaded to the site." },
  status: { eyebrow: "Operations", title: "Status", blurb: "Database, indexing and deploy health." },
};

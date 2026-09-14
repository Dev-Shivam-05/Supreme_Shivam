import { site } from "@/lib/site";

/** Renders a JSON-LD script. Server component — safe to embed in pages. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here (no user input).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const abs = (path: string) => `${site.url}${path}`;

export const PERSON_ID = `${site.url}/#person`;
export const WEBSITE_ID = `${site.url}/#website`;

/** Build-time constants — bump PROFILE_MODIFIED when the identity copy changes. */
const PROFILE_CREATED = "2026-07-12T00:00:00+05:30";
const PROFILE_MODIFIED = "2026-09-14T00:00:00+05:30";

/**
 * The Person entity. This is the node that makes Google treat the site, the
 * LinkedIn profile, the GitHub account, the X account and the photograph as one
 * human rather than five unrelated pages — `sameAs` is the explicit claim that
 * they are the same person, so every URL in it must be live and actually his.
 * A sameAs pointing at a dead or wrong profile is worse than omitting it.
 */
const personNode = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: site.name,
  // every way a person might search for him → all resolve to this one entity
  alternateName: [site.handle, "S.D. Bhadoriya", "S.D.Bhadoriya"],
  givenName: site.firstName,
  familyName: site.lastName,
  description:
    "AI Engineer at Aaziko Global LLP. Writes the spec, directs AI coding agents, reviews and tests what they build.",
  url: site.url,
  mainEntityOfPage: site.url,
  image: [
    {
      "@type": "ImageObject",
      url: abs(site.images.avatar),
      width: 1000,
      height: 1000,
      caption: site.images.alt,
    },
    {
      "@type": "ImageObject",
      url: abs(site.images.portrait),
      width: 576,
      height: 1024,
      caption: site.images.alt,
    },
  ],
  jobTitle: site.role,
  email: `mailto:${site.email}`,
  worksFor: { "@type": "Organization", name: site.company },
  address: {
    "@type": "PostalAddress",
    addressLocality: site.address.locality,
    addressRegion: site.address.region,
    addressCountry: site.address.country,
  },
  nationality: { "@type": "Country", name: "India" },
  alumniOf: { "@type": "CollegeOrUniversity", name: site.university },
  knowsAbout: [
    "AI coding agents",
    "Specification-driven development",
    "Web development",
    "Mobile app development",
    "Next.js",
    "React",
    "React Native",
    "TypeScript",
    "Node.js",
    "MongoDB",
    "Python",
    "GitHub Actions",
    "System architecture",
    "Web performance",
  ],
  // Only public accounts that resolve and are actually his. Instagram stays out:
  // the handle linked from GitHub (`__https.https`) could not be verified, and a
  // sameAs pointing at a wrong profile is worse than omitting it.
  sameAs: [site.social.github, site.social.linkedin, site.social.x, site.social.wakatime],
};

/**
 * The services he sells, as a ProfessionalService node per page.
 *
 * `provider` points at the same @id as the Person, which is what ties the
 * service listings to him as one entity rather than to an unrelated business.
 * `telephone` is omitted entirely when no number is set — an empty string there
 * is a schema error, not a blank field.
 */
export function professionalServiceLd(service: {
  slug: string;
  schemaName: string;
  title: string;
  description: string;
  priceFrom?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${site.url}${service.slug}#service`,
    name: service.schemaName,
    description: service.description,
    image: abs(site.images.avatar),
    url: `${site.url}${service.slug}`,
    ...(site.phone ? { telephone: site.phone } : {}),
    email: `mailto:${site.email}`,
    priceRange: service.priceFrom ?? site.rateFrom,
    areaServed: [
      ...site.areaServed.map((name) => ({ "@type": "City", name })),
      { "@type": "State", name: site.address.region },
      { "@type": "Country", name: "India" },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
    provider: { "@id": PERSON_ID },
  };
}

/** FAQPage for the question block at the foot of each service page. */
export function faqPageLd(slug: string, faqs: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${site.url}${slug}#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}


/** `alternateName` is what lets Google render "Shivam Bhadoriya" as the site name. */
export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: site.name,
  alternateName: ["Shivam Bhadoriya Portfolio", `${site.name} — ${site.role}`],
  description: site.tagline,
  url: site.url,
  inLanguage: "en-IN",
  publisher: { "@id": PERSON_ID },
  about: { "@id": PERSON_ID },
};

/**
 * A ProfilePage wrapper — signals to Google that the page *is* about this person.
 *
 * `mainEntity` embeds the whole Person node rather than referencing its @id.
 * Google does merge every JSON-LD block on a page into one graph, so a bare
 * reference usually resolves — but the Rich Results Test is stricter about
 * cross-<script> references than the crawler is, and a ProfilePage whose
 * mainEntity does not resolve reports as an error. The Person node is deduped
 * against the one in the layout by its identical @id.
 */
export const profilePageLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${site.url}/#profilepage`,
  url: site.url,
  name: site.title,
  dateCreated: PROFILE_CREATED,
  dateModified: PROFILE_MODIFIED,
  isPartOf: { "@id": WEBSITE_ID },
  mainEntity: personNode,
  about: { "@id": PERSON_ID },
};

/** One written post. Author and publisher both point at the Person node. */
export function blogPostingLd(post: {
  slug: string;
  title: string;
  summary: string;
  published: string;
  updated?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${site.url}/writing/${post.slug}#post`,
    headline: post.title,
    description: post.summary,
    url: `${site.url}/writing/${post.slug}`,
    mainEntityOfPage: `${site.url}/writing/${post.slug}`,
    datePublished: post.published,
    dateModified: post.updated ?? post.published,
    inLanguage: "en-IN",
    image: abs(site.images.og),
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
  };
}

/** Person + WebSite as one graph — emitted from the root layout on every route. */
export const siteGraphLd = {
  "@context": "https://schema.org",
  "@graph": [personNode, { ...websiteLd, "@context": undefined }],
};

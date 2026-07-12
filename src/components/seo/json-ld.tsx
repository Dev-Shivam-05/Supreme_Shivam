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

export const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${site.url}/#person`,
  name: site.name,
  // every way a person might search for him → all resolve to this one entity
  alternateName: ["S.D. Bhadoriya", "S.D.Bhadoriya", site.handle],
  url: site.url,
  image: `${site.url}/opengraph-image`,
  jobTitle: "Full-Stack Developer (MERN)",
  description: site.tagline,
  email: site.email,
  address: { "@type": "PostalAddress", addressCountry: "IN" },
  nationality: { "@type": "Country", name: "India" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "VidhyaDeep University" },
  worksFor: { "@type": "Organization", name: "Freelance & Open Source" },
  sameAs: [site.social.github, site.social.linkedin],
  knowsAbout: [
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Express.js",
    "MongoDB",
    "Mongoose",
    "Socket.io",
    "REST APIs",
    "Full-Stack Development",
    "MERN Stack",
    "Web Performance",
    "Realtime Systems",
  ],
};

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  name: `${site.name} — Portfolio`,
  alternateName: "Shivam Bhadoriya Portfolio",
  description: site.tagline,
  url: site.url,
  inLanguage: "en",
  publisher: { "@id": `${site.url}/#person` },
};

/** A ProfilePage wrapper — signals to Google that the site *is* about this person. */
export const profilePageLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: site.url,
  mainEntity: { "@id": `${site.url}/#person` },
  about: { "@id": `${site.url}/#person` },
};

import { PageHeader } from "@/components/layout/page-header";
import { WorkGallery } from "@/components/work/work-gallery";
import { WorkArchive } from "@/components/work/work-archive";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMeta } from "@/lib/seo";
import { getProjects } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata = pageMeta({
  title: "Work",
  description:
    "Selected engineering work by Shivam Bhadoriya — case studies with architecture, trade-offs and measured outcomes.",
  path: "/work",
});

export default async function WorkPage() {
  const projects = await getProjects();
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Portfolio Projects",
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      description: p.summary,
      url: `${site.url}/work/${p.slug}`,
    })),
  };

  return (
    <>
      <JsonLd data={itemListLd} />
      <PageHeader
        index="01"
        label="The Grid"
        title="Selected"
        accent="work."
        description="Selected builds. Hover a card to preview it, then open the full case study — the problem, the architecture, the trade-offs, and the numbers that came out the other side."
      />
      <WorkGallery projects={projects} />
      <div className="container-x">
        <div className="hud tick mb-2">Full index</div>
      </div>
      <WorkArchive projects={projects} />
    </>
  );
}

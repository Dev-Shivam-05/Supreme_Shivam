import { PageHeader } from "@/components/layout/page-header";
import { About } from "@/components/sections/about";
import { Timeline } from "@/components/sections/timeline";
import { Values } from "@/components/sections/values";
import { Approach } from "@/components/sections/approach";
import { JsonLd, profilePageLd } from "@/components/seo/json-ld";
import { pageMeta } from "@/lib/seo";
import { getSettings } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata = pageMeta({
  title: "About",
  description:
    "Shivam Bhadoriya is an AI Engineer at Aaziko Global LLP in Ahmedabad. He writes the spec, directs the coding agents, and reviews and tests what they build.",
  path: "/about",
  image: site.images.avatar,
});

export default async function AboutPage() {
  const content = await getSettings();
  return (
    <>
      <JsonLd data={profilePageLd} />
      <PageHeader
        index="02"
        label="Off the grid"
        title="The engineer behind"
        accent="the work."
        description={`${site.name} — ${site.role} at ${site.company}, based in ${site.address.locality}. Here is how the work actually runs now, what it used to be, and the road between the two.`}
      />
      <About paragraphs={content.aboutParagraphs} />
      <Timeline />
      <Values />
      <Approach />
    </>
  );
}

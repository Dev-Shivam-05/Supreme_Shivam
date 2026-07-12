import { PageHeader } from "@/components/layout/page-header";
import { About } from "@/components/sections/about";
import { Timeline } from "@/components/sections/timeline";
import { Values } from "@/components/sections/values";
import { Approach } from "@/components/sections/approach";
import { pageMeta } from "@/lib/seo";
import { getSettings } from "@/lib/content";

export const metadata = pageMeta({
  title: "About",
  description:
    "Shivam Bhadoriya — a full-stack engineer who cares as much about the query plan as the pixel. How I think, what I optimise for, and where I've been.",
  path: "/about",
});

export default async function AboutPage() {
  const content = await getSettings();
  return (
    <>
      <PageHeader
        index="02"
        label="Off the grid"
        title="The engineer behind"
        accent="the work."
        description="I build the parts reviewers can inspect — not just the surface. Here's how I think about the craft, and the road that got me here."
      />
      <About paragraphs={content.aboutParagraphs} />
      <Timeline />
      <Values />
      <Approach />
    </>
  );
}

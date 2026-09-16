import { Hero } from "@/components/hero/hero";
import { Marquee } from "@/components/sections/marquee";
import { Stats } from "@/components/sections/stats";
import { Services } from "@/components/sections/services";
import { Statement } from "@/components/sections/statement";
import { FeaturedWork } from "@/components/sections/featured-work";
import { Process } from "@/components/sections/process";
import { GithubProof } from "@/components/sections/github-proof";
import { Gateway } from "@/components/sections/gateway";
import { JsonLd, profilePageLd } from "@/components/seo/json-ld";
import { getProjects, getSettings, toPublicContent } from "@/lib/content";

export default async function Home() {
  const [projects, content] = await Promise.all([getProjects(), getSettings()]);
  // Archived work keeps its case study and its archive row, but never fronts the site.
  const featured = projects.filter((p) => !p.archived);
  return (
    <>
      {/* The Person + WebSite graph lives in the root layout — this page adds the
          ProfilePage wrapper that says the page itself is about him. */}
      <JsonLd data={profilePageLd} />
      <Hero content={toPublicContent(content)} />
      <Marquee />
      <Stats />
      <Services />
      <Statement />
      <FeaturedWork projects={featured} />
      <Process />
      <GithubProof />
      <Gateway />
    </>
  );
}

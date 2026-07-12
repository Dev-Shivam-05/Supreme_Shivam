import { Hero } from "@/components/hero/hero";
import { Marquee } from "@/components/sections/marquee";
import { Stats } from "@/components/sections/stats";
import { Services } from "@/components/sections/services";
import { Statement } from "@/components/sections/statement";
import { FeaturedWork } from "@/components/sections/featured-work";
import { Process } from "@/components/sections/process";
import { GithubProof } from "@/components/sections/github-proof";
import { Gateway } from "@/components/sections/gateway";
import { JsonLd, personLd, websiteLd, profilePageLd } from "@/components/seo/json-ld";
import { getProjects, getSettings } from "@/lib/content";

export default async function Home() {
  const [projects, content] = await Promise.all([getProjects(), getSettings()]);
  return (
    <>
      <JsonLd data={personLd} />
      <JsonLd data={websiteLd} />
      <JsonLd data={profilePageLd} />
      <Hero content={content} />
      <Marquee />
      <Stats />
      <Services />
      <Statement />
      <FeaturedWork projects={projects} />
      <Process />
      <GithubProof />
      <Gateway />
    </>
  );
}

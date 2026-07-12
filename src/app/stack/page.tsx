import { PageHeader } from "@/components/layout/page-header";
import { Capabilities } from "@/components/sections/capabilities";
import { Proficiency } from "@/components/sections/proficiency";
import { Marquee } from "@/components/sections/marquee";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Stack",
  description:
    "The tools Shivam Bhadoriya builds with — frontend, backend, data and platform. React, TypeScript, Node, Express, MongoDB, PostgreSQL and more.",
  path: "/stack",
});

export default function StackPage() {
  return (
    <>
      <PageHeader
        index="03"
        label="Under the hood"
        title="The tools I build"
        accent="with."
        description="Not a wishlist — the stack I actually ship with, grouped by where it lives in the system, with an honest read on depth."
      />
      <Capabilities />
      <Proficiency />
      <div className="py-6">
        <Marquee />
      </div>
    </>
  );
}

import { LegalPageView } from "@/components/legal/legal-page";
import { pageMeta } from "@/lib/seo";
import { termsSections } from "@/lib/legal";

export const metadata = pageMeta({
  title: "Terms",
  description:
    "Terms for using this site, and how the prices and timelines quoted on the service pages relate to an actual project quote.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPageView
      index="09"
      label="The small print"
      title="Terms of"
      accent="use."
      description="What the prices on the service pages mean, what an enquiry does and does not commit either of us to, and what you can do with what is published here."
      sections={termsSections}
    />
  );
}

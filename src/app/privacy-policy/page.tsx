import { LegalPageView } from "@/components/legal/legal-page";
import { pageMeta } from "@/lib/seo";
import { privacySections } from "@/lib/legal";

export const metadata = pageMeta({
  title: "Privacy Policy",
  description:
    "What this site collects, why, who else sees it and how long it is kept. No cookies unless you opt in, no trackers, no analytics vendors — written from what the code actually does.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPageView
      index="08"
      label="The small print"
      title="Privacy,"
      accent="in plain words."
      description="No cookies unless you say yes, and no banner in your way. Here is exactly what this site collects, why it collects it, and how to make me delete it."
      sections={privacySections}
    />
  );
}

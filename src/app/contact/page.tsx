import { PageHeader } from "@/components/layout/page-header";
import { Contact } from "@/components/sections/contact";
import { Faq } from "@/components/sections/faq";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Contact",
  description:
    "Get in touch with Shivam Bhadoriya — available for full-time and freelance full-stack work. Replies within 24 hours.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageHeader
        index="05"
        label="Pit wall"
        title="Ready to"
        accent="build?"
        description="Tell me about the problem. I reply within 24 hours — no gatekeeping, no fluff."
      />
      <Contact />
      <Faq />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageView } from "@/components/services/service-page";
import { JsonLd, faqPageLd, professionalServiceLd } from "@/components/seo/json-ld";
import { getProjects } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { getServicePage, hireOnly } from "@/lib/services";
import { site } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return hireOnly.map((p) => ({ slug: p.slug.replace("/hire/", "") }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(`/hire/${slug}`);
  if (!page) return {};
  return pageMeta({ title: page.title, description: page.description, path: page.slug });
}

export default async function HireRoute({ params }: Params) {
  const { slug } = await params;
  const page = getServicePage(`/hire/${slug}`);
  if (!page) notFound();

  const projects = await getProjects();
  const proof = page.proof
    .map((s) => projects.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      { "@type": "ListItem", position: 2, name: "Services", item: `${site.url}/services` },
      { "@type": "ListItem", position: 3, name: page.title, item: `${site.url}${page.slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={professionalServiceLd(page)} />
      <JsonLd data={faqPageLd(page.slug, page.faqs)} />
      <JsonLd data={breadcrumbLd} />
      <ServicePageView page={page} proof={proof} />
    </>
  );
}

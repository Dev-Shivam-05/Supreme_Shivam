import { PageHeader } from "@/components/layout/page-header";
import { StatsDashboard } from "@/components/stats/stats-dashboard";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Stats",
  description:
    "Live traffic for this site, powered by a self-built analytics pipeline — beacon → API → MongoDB → rollups.",
  path: "/stats",
});

export default function StatsPage() {
  return (
    <>
      <PageHeader
        index="06"
        label="Live telemetry"
        title="This site, in"
        accent="real time."
        description="Public, self-built analytics — not Google Analytics. A beacon feeds an API that writes to MongoDB and rolls up into the charts below."
      />
      <StatsDashboard />
    </>
  );
}

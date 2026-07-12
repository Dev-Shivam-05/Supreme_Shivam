import { ArrowUpRight } from "lucide-react";
import { getGithub } from "@/lib/github";
import { site } from "@/lib/site";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export async function GithubProof() {
  const gh = await getGithub(site.handle);

  return (
    <section className="border-y border-border bg-bg-elev">
      <div className="container-x py-24 md:py-32">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="hud tick mb-6">
              <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-signal align-middle" />
              Live from GitHub
            </p>
            <h2 className="font-poster display-2 leading-[0.85]">
              Not a claim —
              <br />
              <span className="text-accent">a live feed.</span>
            </h2>
          </div>
          <a
            href={site.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="sweep group inline-flex items-center gap-2 border border-border px-5 py-3 text-sm text-fg-muted transition-colors"
          >
            @{site.handle}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>

        {gh ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
            {/* counters */}
            <div className="grid min-w-0 grid-cols-3 gap-4 lg:grid-cols-1">
              {[
                { v: gh.publicRepos, l: "Public repos" },
                { v: gh.stars, l: "Stars earned" },
                { v: gh.followers, l: "Followers" },
              ].map((s) => (
                <div key={s.l} className="border border-border bg-bg p-6">
                  <div className="font-poster text-4xl text-fg md:text-5xl">{s.v}</div>
                  <div className="hud mt-2">{s.l}</div>
                </div>
              ))}
            </div>

            {/* languages */}
            <div className="min-w-0 border border-border bg-bg p-6">
              <div className="hud mb-5">Top languages</div>
              <div className="space-y-3">
                {gh.topLangs.map((lang) => {
                  const max = gh.topLangs[0]?.count || 1;
                  return (
                    <div key={lang.name}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-fg">{lang.name}</span>
                        <span className="font-mono text-xs text-fg-faint">{lang.count}</span>
                      </div>
                      <div className="h-1.5 w-full bg-border">
                        <div className="h-1.5 bg-accent" style={{ width: `${(lang.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* recent activity */}
            <div className="min-w-0 border border-border bg-bg p-6">
              <div className="hud mb-5">Recent pushes</div>
              <div className="divide-y divide-border">
                {gh.recent.map((r) => (
                  <a
                    key={r.name}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-mono text-sm text-fg group-hover:text-accent">{r.name}</div>
                      {r.desc && <div className="truncate text-xs text-fg-muted">{r.desc}</div>}
                    </div>
                    <div className="shrink-0 text-right">
                      {r.lang && <div className="hud">{r.lang}</div>}
                      <div className="font-mono text-[0.65rem] text-fg-faint">{timeAgo(r.updated)}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="brackets border border-border bg-bg p-10 text-center">
            <p className="text-fg-muted">
              GitHub is rate-limiting the live feed right now — it refreshes hourly.{" "}
              <a href={site.social.github} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                See it directly on @{site.handle} ↗
              </a>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

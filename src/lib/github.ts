/**
 * Live GitHub data — fetched server-side, cached (ISR). No token needed for
 * public data; unauthenticated calls are rate-limited so we cache for an hour
 * and fail soft (return null) so the UI degrades gracefully.
 */

type GithubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
};

type GithubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  html_url: string;
  fork: boolean;
};

export type GithubData = {
  login: string;
  name: string;
  followers: number;
  publicRepos: number;
  stars: number;
  topLangs: { name: string; count: number }[];
  recent: { name: string; desc: string; lang: string; stars: number; updated: string; url: string }[];
  url: string;
};

export async function getGithub(username: string): Promise<GithubData | null> {
  const headers = {
    "User-Agent": "shivam-portfolio",
    Accept: "application/vnd.github+json",
  };
  try {
    const [uRes, rRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers, next: { revalidate: 3600 } }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, {
        headers,
        next: { revalidate: 3600 },
      }),
    ]);
    if (!uRes.ok) return null;
    const u = (await uRes.json()) as GithubUser;
    const repos = (rRes.ok ? await rRes.json() : []) as GithubRepo[];

    const langs = new Map<string, number>();
    let stars = 0;
    for (const r of repos) {
      if (r.language) langs.set(r.language, (langs.get(r.language) ?? 0) + 1);
      stars += r.stargazers_count ?? 0;
    }
    const topLangs = [...langs.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const recent = repos
      .filter((r) => !r.fork)
      .slice(0, 4)
      .map((r) => ({
        name: r.name,
        desc: r.description ?? "",
        lang: r.language ?? "",
        stars: r.stargazers_count ?? 0,
        updated: r.pushed_at,
        url: r.html_url,
      }));

    return {
      login: u.login,
      name: u.name ?? u.login,
      followers: u.followers,
      publicRepos: u.public_repos,
      stars,
      topLangs,
      recent,
      url: u.html_url,
    };
  } catch {
    return null;
  }
}

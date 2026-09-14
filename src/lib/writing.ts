/**
 * Written posts.
 *
 * The site had no text content beyond project blurbs, which is the main reason
 * there was almost nothing for a person query to rank against. These four are
 * the starting set. When a post is also published to LinkedIn, the canonical
 * should point here, not there.
 *
 * Every figure below comes from a document Shivam wrote — nothing is estimated.
 */

export type PostBlock = { h?: string; p: string[] };

export type Post = {
  slug: string;
  title: string;
  /** Also the meta description — keep under ~160 characters. */
  summary: string;
  /** ISO-8601 with the +05:30 offset. Feeds datePublished in the JSON-LD. */
  published: string;
  updated?: string;
  readingMinutes: number;
  tags: string[];
  body: PostBlock[];
};

export const posts: Post[] = [
  {
    slug: "the-month-ai-wrote-99-percent-of-my-code",
    title: "The month AI wrote 99.77% of my code",
    summary:
      "In October 2025 AI wrote none of my line changes. In August 2026 it wrote 99.77% of them. The engineering did not get easier — it moved.",
    published: "2026-09-14T09:00:00+05:30",
    readingMinutes: 4,
    tags: ["AI agents", "Practice"],
    body: [
      {
        p: [
          "I keep a simple measure of my own work: what share of the lines I changed in a month were written by an AI agent rather than typed by me. In October 2025 that number was 0%. In August 2026 it was 99.77%.",
          "The reaction people expect is that the job got easier. It did not. It moved.",
        ],
      },
      {
        h: "What actually got harder",
        p: [
          "When I wrote every line myself, a vague requirement produced slow progress. I would stall, notice I did not understand the problem, and go and ask. The stalling was a feature — it was the system catching an under-specified request before it became code.",
          "An agent does not stall. Give it a vague requirement and it returns something confident, well-formatted, consistently styled, and wrong, in about ninety seconds. The error has not gone away; it has just arrived faster and wearing better clothes. So the cost of being unclear went up, not down.",
        ],
      },
      {
        h: "Where the hours went instead",
        p: [
          "The hours I no longer spend typing go into four things: writing the specification, deciding the architecture, writing or verifying the tests, and reviewing the diff.",
          "Specification is the biggest of the four. Before anything is generated I write down the exact behaviour, the field names, the status values, and what 'done' means — the acceptance criteria that decide whether the result ships. If a number, a colour, a timing or a status value is not written down somewhere, it does not get invented; it gets asked about.",
          "Review is the second biggest, and it is the one that cannot be delegated. I read every diff. An agent that produces a thousand plausible lines an hour is only useful if someone is capable of telling which of them are wrong.",
        ],
      },
      {
        h: "The 0.23%",
        p: [
          "The interesting part of that statistic is not the 99.77%. It is the remainder. A small fraction of the lines still have to be mine — the ones where the trade-off is genuinely a judgement call, where a shortcut would be invisible now and expensive in six months, or where the agent has confidently solved the wrong problem.",
          "Knowing which lines those are is the skill. Nothing about the last year has made it less valuable.",
        ],
      },
    ],
  },
  {
    slug: "the-spec-is-the-deliverable",
    title: "The spec is the deliverable now",
    summary:
      "If an agent writes the implementation, the specification stops being paperwork. It becomes the part of the work with your name on it.",
    published: "2026-09-14T09:00:00+05:30",
    readingMinutes: 4,
    tags: ["Spec-driven development", "Process"],
    body: [
      {
        p: [
          "Specifications used to be the thing you wrote afterwards, for somebody else, if there was time. That stopped being true the moment implementation became cheap.",
        ],
      },
      {
        h: "Cheap implementation changes what is scarce",
        p: [
          "When writing the code was the expensive step, it made sense to start coding early and discover the requirements on the way. The code was where you did your thinking, and the thinking was slow enough that mistakes surfaced before they multiplied.",
          "When implementation takes minutes, the expensive step is deciding what should exist. A specification is not documentation of that decision. It is the decision.",
        ],
      },
      {
        h: "What goes in one",
        p: [
          "The rule I work to is that nothing important should be inferable only from tone. Exact values, not adjectives. If a brief says 'modern' or 'clean' or 'premium' or 'you decide', that is not a requirement, it is a placeholder — and the fastest way to turn it into one is to propose exact numbers in a table and get a single word back.",
          "So: the field names, the status values, the timings, the colours, the error text, the empty state, the loading state, the acceptance criteria. Written down before generation starts, in one place, in English.",
        ],
      },
      {
        h: "Small phases beat big ones",
        p: [
          "The other half of the practice is scope. An agent will happily produce a forty-file change, and a forty-file change cannot be reviewed honestly. I keep a phase small enough that I can read all of it and mean it when I say it is correct. If the work grows past that, it becomes the next phase rather than a bigger one.",
          "The discipline is not about distrusting the tool. It is that review is the only place the quality is actually decided, and review does not scale by wishing.",
        ],
      },
      {
        h: "The honest test",
        p: [
          "A specification is good if someone who was not in the conversation can build the thing from it and you would accept the result. That is a high bar, and it is a useful one, because these days the thing building from it was definitively not in the conversation.",
        ],
      },
    ],
  },
  {
    slug: "ai-pulse-a-channel-that-publishes-itself",
    title: "AI-PULSE: a YouTube channel that publishes itself",
    summary:
      "One video and one Short about a trending AI tool, every day, unattended — running entirely on GitHub Actions with no server and no bill.",
    published: "2026-09-14T09:00:00+05:30",
    readingMinutes: 3,
    tags: ["Automation", "GitHub Actions"],
    body: [
      {
        p: [
          "AI-PULSE publishes a long-form video and a Short about a trending AI tool every day. Nobody presses go. There is no server, no cron box, and no monthly bill.",
        ],
      },
      {
        h: "Daily is a discipline problem, not a creative one",
        p: [
          "Anyone can make one video. The hard part of a daily channel is the thousandth day, and the reason most stop is that the format costs an hour a day of human attention. So the design goal was never 'make a good video' — it was 'remove the human from the loop without lowering the floor'.",
        ],
      },
      {
        h: "It runs inside CI",
        p: [
          "The whole pipeline is a scheduled GitHub Actions workflow. On a cron trigger it selects the AI tool trending that day, assembles the long-form cut and the Short from the same source material, and publishes both through the YouTube Data API.",
          "Running it inside CI minutes rather than on a box is the decision that makes it sustainable. There is nothing to keep alive, nothing to patch, nothing to pay for, and the run history is the audit log.",
        ],
      },
      {
        h: "Tests gate the run",
        p: [
          "The failure mode of an unattended publisher is not that it stops. It is that it keeps going and publishes something broken. So the pipeline has its own tests, and they run before the publish step. A bad run shows up as a red CI run and no upload, which is the correct outcome — silence is cheaper than a wrong video.",
        ],
      },
      {
        h: "What it proves",
        p: [
          "It is a small system, but it is the shape of most of the work I care about now: define the behaviour precisely, let the machine do the repetitive part, and put a test in front of the step that is expensive to get wrong.",
        ],
      },
    ],
  },
  {
    slug: "why-i-unpinned-my-contribution-art-generator",
    title: "Why I unpinned my contribution-art generator",
    summary:
      "It was a real piece of engineering that made my GitHub graph look busier than my work was. Both of those things are true, and only one of them matters to a reviewer.",
    published: "2026-09-14T09:00:00+05:30",
    readingMinutes: 3,
    tags: ["Open source", "Career"],
    body: [
      {
        p: [
          "I built a tool that paints patterns onto a GitHub contribution graph. It models a design grid as a versioned schema, maps it to backdated commit workflows, and triggers the whole thing in under two minutes. As a piece of engineering it is fine.",
          "It was also pinned to the top of my GitHub profile for a year, and I have taken it down.",
        ],
      },
      {
        h: "What a reviewer sees",
        p: [
          "A green contribution graph is supposed to be evidence. The moment you ship a tool whose output is a green contribution graph, you have not just built something clever — you have told every reviewer that your own graph is not evidence any more.",
          "That is a bad trade. It costs me the credibility of a real signal to keep a novelty project on the shelf, and no hiring manager reads it the generous way.",
        ],
      },
      {
        h: "Keeping it honest",
        p: [
          "I have not deleted it, and I have not hidden it. It still has its case study on this site and it still has a row in the work archive, labelled as archived. Pretending it never existed would be the same kind of dishonesty in the other direction.",
          "What it no longer does is front the portfolio. Featured work should be the things I want to be judged on, and this is not one of them.",
        ],
      },
      {
        h: "The general rule",
        p: [
          "Consistency is worth showing. A streak is not the point; showing up and shipping is. But the proof has to be something a sceptical reader can check — a live pipeline, a merged change, a number that came out the other side of a real system. Anything that only looks like proof is worse than nothing, because it teaches people to discount the rest.",
        ],
      },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Newest first — the order the index renders in. */
export const postsByDate = [...posts].sort((a, b) => b.published.localeCompare(a.published));

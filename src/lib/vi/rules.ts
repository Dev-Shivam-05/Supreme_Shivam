/**
 * Insight rules — spec §6. Every rule is unvalidated, abstains unless its
 * whole condition holds, and never produces a probability. The first is the
 * reference rule (`development_interest_v0`); the other three copy its shape.
 *
 * A rule may only cite events that are actually in the support list, and the
 * permitted next action never initiates contact (examples.json
 * `permitted_next_action`: "no outbound contact").
 */
import type { Rule, RuleInput, StoredEvent } from "./engine.ts";

const NO_OUTREACH = "Offer an optional project-brief form; do not initiate outreach";

function pageViewsOfType(input: RuleInput, types: string[]) {
  return input.events.filter(
    (e) => e.eventName === "page_view" && types.includes(input.contents[e.properties.content_id]?.type ?? ""),
  );
}

function ctaClicks(input: RuleInput, ids: string[]) {
  return input.events.filter((e) => e.eventName === "cta_click" && ids.includes(e.properties.cta_id));
}

const distinctContent = (es: StoredEvent[]) => new Set(es.map((e) => e.properties.content_id));

/**
 * reference.py `infer`: at least two DISTINCT case studies and a project CTA.
 * `test_repeated_same_case_not_two_cases` — the same case twice is one case.
 */
export function developmentInterestRule(projectCtas: string[]): Rule {
  return {
    version: "development_interest_v0",
    alternatives: ["portfolio research", "peer review", "recruiter evaluation"],
    unknowns: ["budget", "authority", "urgency", "identity", "external searches"],
    nextAction: NO_OUTREACH,
    evaluate(input) {
      const cases = pageViewsOfType(input, ["case_study"]);
      const distinct = distinctContent(cases);
      const ctas = ctaClicks(input, projectCtas);
      if (distinct.size < 2 || ctas.length === 0) return null;
      return { hypothesis: "Possible interest in development work", support: [...cases, ...ctas] };
    },
  };
}

export function serviceEvaluationRule(contactCtas: string[], titles: Record<string, string>): Rule {
  return {
    version: "service_evaluation_v0",
    alternatives: ["competitor research", "price comparison", "student research"],
    unknowns: ["budget", "authority", "timeline", "identity", "organisation"],
    nextAction: "Make the starting price and timeline easy to find; do not initiate outreach",
    evaluate(input) {
      const pages = pageViewsOfType(input, ["service", "hire"]);
      const ctas = ctaClicks(input, contactCtas);
      if (pages.length === 0 || ctas.length === 0) return null;
      const names = [...distinctContent(pages)].map((id) => titles[id] ?? id);
      return {
        hypothesis: `Possible evaluation of a specific service: ${names.join(", ")}`,
        support: [...pages, ...ctas],
      };
    },
  };
}

export function candidateEvaluationRule(profileCtas: string[]): Rule {
  return {
    version: "candidate_evaluation_v0",
    alternatives: ["peer curiosity", "client due diligence", "recruiter sourcing"],
    unknowns: ["employer", "role", "authority", "identity"],
    nextAction: "Keep the CV-relevant pages current; do not initiate outreach",
    evaluate(input) {
      const about = pageViewsOfType(input, ["about"]);
      const depth = pageViewsOfType(input, ["stack", "case_study"]);
      const ctas = ctaClicks(input, profileCtas);
      if (about.length === 0 || depth.length === 0 || ctas.length === 0) return null;
      return {
        hypothesis: "Possible evaluation of Shivam as a candidate or collaborator",
        support: [...about, ...depth, ...ctas],
      };
    },
  };
}

export function readerInterestRule(topics: Record<string, string>): Rule {
  return {
    version: "reader_interest_v0",
    alternatives: ["arrived from a shared link", "research for their own writing"],
    unknowns: ["identity", "organisation", "purpose"],
    nextAction: "Link related writing from each article; do not initiate outreach",
    evaluate(input) {
      const articles = pageViewsOfType(input, ["article"]);
      const distinct = distinctContent(articles);
      if (distinct.size < 2) return null;
      const subjects = [...new Set([...distinct].map((id) => topics[id] ?? "general"))];
      return {
        hypothesis: `Possible sustained interest in the writing (${subjects.join(", ").replace(/_/g, " ")})`,
        support: articles,
      };
    },
  };
}

/**
 * The production engine configuration: real sources, the site catalog and the
 * four rules. Pure, so the test suite runs exactly this configuration.
 */
import type { EngineConfig } from "./engine.ts";
import { ALLOWED_VALUES, CONTENT, EVENT_PROPERTIES } from "./catalog.ts";
import { SOURCES } from "./policy.ts";
import { candidateEvaluationRule, developmentInterestRule, readerInterestRule, serviceEvaluationRule } from "./rules.ts";

/** CTAs that mean "I want to start something". */
export const PROJECT_CTAS = ["start_project", "enquiry_submitted"];
/** CTAs that open a conversation by any channel. */
export const CONTACT_CTAS = ["start_project", "email", "copy_email", "phone", "enquiry_submitted"];
/** CTAs that look Shivam up as a professional. */
export const PROFILE_CTAS = ["social_linkedin", "social_github"];

const TITLES = Object.fromEntries(Object.entries(CONTENT).map(([id, c]) => [id, c.title]));
const TOPICS = Object.fromEntries(Object.entries(CONTENT).map(([id, c]) => [id, c.topic]));

export function buildProdConfig(scopeHash: EngineConfig["scopeHash"]): EngineConfig {
  return {
    sources: SOURCES,
    properties: EVENT_PROPERTIES,
    allowedValues: ALLOWED_VALUES,
    contents: CONTENT,
    rules: [
      developmentInterestRule(PROJECT_CTAS),
      serviceEvaluationRule(CONTACT_CTAS, TITLES),
      candidateEvaluationRule(PROFILE_CTAS),
      readerInterestRule(TOPICS),
    ],
    scopeHash,
  };
}

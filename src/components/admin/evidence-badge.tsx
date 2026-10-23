"use client";

import type { EvidenceStatus } from "@/lib/vi/policy";
import { cn } from "@/lib/utils";

/**
 * README "Core semantics": every claim carries exactly one of six labels. The
 * badge is how the admin page keeps that promise visually — each label has one
 * look and one definition, and nothing on the Visitors page states a claim
 * without one beside it.
 *
 * Text stays on --fg / --fg-muted / --fg-faint / --chart-2 so it clears 4.5:1
 * in both themes; lime appears only as an outline, because lime text on the
 * light ground would not.
 */
const STYLE: Record<EvidenceStatus, string> = {
  observed: "border-accent text-fg",
  self_reported: "border-chart-2 text-chart-2",
  verified_within_scope: "border-fg text-fg",
  inferred: "border-dashed border-fg-muted text-fg-muted",
  unknown: "border-border text-fg-faint",
  not_applicable: "border-border text-fg-faint line-through",
};

export const EVIDENCE_DEFINITION: Record<EvidenceStatus, string> = {
  observed: "Observed: recorded directly by this site's server when it happened.",
  self_reported: "Self-reported: the visitor typed or chose this. Not checked.",
  verified_within_scope: "Verified within scope: checked, but only for the scope named — not beyond it.",
  inferred: "Inferred: derived by a rule or a registry lookup. Unvalidated; no confidence number.",
  unknown: "Unknown: not known, and not guessed.",
  not_applicable: "Not applicable: deliberately not collected or not meaningful here.",
};

export function EvidenceBadge({ status, className }: { status: EvidenceStatus; className?: string }) {
  return (
    <span
      title={EVIDENCE_DEFINITION[status]}
      className={cn(
        "inline-flex shrink-0 items-center border px-1.5 py-0.5 font-mono text-[0.6rem] uppercase leading-none tracking-wider",
        STYLE[status] ?? STYLE.unknown,
        className,
      )}
    >
      {/* The exact label, so the badge and the stored value never disagree. */}
      {status.replace(/_/g, " ")}
    </span>
  );
}

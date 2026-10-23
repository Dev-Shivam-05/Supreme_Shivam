"""Synthetic, in-memory design reference; NOT a network service or production SDK.

Transport authentication, consent UI, webhook signature checks, cryptography,
persistent transactions, and actual provider deletion are intentionally absent.
Context and Proof objects MUST be produced by trusted server adapters, never by
copying fields from a browser payload. All test data is synthetic.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import json
from typing import Any, Callable
from uuid import UUID

WINDOW = timedelta(days=15)
FINALIZATION = timedelta(days=7)
LATE = timedelta(hours=48)
CATALOG = {
    "case_store": {"type": "case_study", "topic": "development"},
    "case_booking": {"type": "case_study", "topic": "development"},
    "about": {"type": "about", "topic": "general"},
}
PROPERTIES = {
    "page_view": {"content_id"},
    "cta_click": {"cta_id"},
    "download_requested": {"asset_id"},
    "search_submitted": {"topic"},
    "booking_confirmed": {"booking_state"},
}
ALLOWED_VALUES = {
    "content_id": set(CATALOG), "cta_id": {"project_brief", "hire", "collaborate"},
    "asset_id": {"cv", "service_overview"},
    "topic": {"development", "hiring", "collaboration", "other"},
    "booking_state": {"confirmed"},
}

class Rejected(ValueError):
    """A code-only rejection: do not include raw payloads in logs."""


def aware(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        raise Rejected("timezone_required")
    return value.astimezone(timezone.utc)


@dataclass(frozen=True)
class Context:
    site_id: str
    source_id: str
    epoch_id: str
    session_id: str
    grant_id: str


@dataclass
class Grant:
    site_id: str
    epoch_id: str
    starts_at: datetime
    expires_at: datetime
    purposes: frozenset[str]
    sources: frozenset[str]
    revoked_at: datetime | None = None


@dataclass(frozen=True)
class Proof:
    """A verified workflow assertion registered by a trusted server adapter."""
    proof_id: str
    site_id: str
    grant_id: str
    session_id: str
    contact_id: str
    event_ids: frozenset[str]
    kind: str
    expires_at: datetime


@dataclass
class Engine:
    sources: dict[tuple[str, str], str] = field(default_factory=dict)
    grants: dict[str, Grant] = field(default_factory=dict)
    windows: dict[tuple[str, str], dict[str, Any]] = field(default_factory=dict)
    events: dict[tuple[str, str, str], dict[str, Any]] = field(default_factory=dict)
    sessions: dict[tuple[str, str], str] = field(default_factory=dict)
    proofs: dict[str, Proof] = field(default_factory=dict)
    links: dict[str, dict[str, Any]] = field(default_factory=dict)
    insights: dict[tuple[str, str], dict[str, Any]] = field(default_factory=dict)
    exports: list[dict[str, str]] = field(default_factory=list)
    deletion_jobs: dict[tuple[str, str, str], dict[str, Any]] = field(default_factory=dict)
    tombstones: set[tuple[str, str]] = field(default_factory=set)

    def _grant(self, c: Context, now: datetime, purpose: str) -> Grant:
        now = aware(now)
        g = self.grants.get(c.grant_id)
        if (g is None or g.site_id != c.site_id or g.epoch_id != c.epoch_id
            or g.revoked_at is not None or not (g.starts_at <= now < g.expires_at)
            or purpose not in g.purposes or c.source_id not in g.sources
            or (c.site_id, c.epoch_id) in self.tombstones):
            raise Rejected("permission_denied")
        return g

    def ingest(self, raw: dict[str, Any], c: Context, received_at: datetime) -> str:
        received_at = aware(received_at)
        kind = self.sources.get((c.site_id, c.source_id))
        if kind not in {"browser", "provider"}:
            raise Rejected("source_not_authorized")
        g = self._grant(c, received_at, "journey")
        allowed = {"schema_version", "event_id", "event_name", "properties", "occurred_at"}
        if set(raw) - allowed or raw.get("schema_version") != "1.0":
            raise Rejected("schema_invalid")
        if len(json.dumps(raw, default=str).encode()) > 8192:
            raise Rejected("payload_too_large")
        try:
            event_id = str(UUID(raw["event_id"]))
        except (KeyError, TypeError, ValueError, AttributeError):
            raise Rejected("event_id_invalid") from None
        name = raw.get("event_name")
        props = raw.get("properties")
        if name not in PROPERTIES or not isinstance(props, dict) or set(props) != PROPERTIES[name]:
            raise Rejected("properties_invalid")
        if any(not isinstance(v, str) or v not in ALLOWED_VALUES[k] for k, v in props.items()):
            raise Rejected("property_value_not_allowlisted")
        if (kind == "provider") != (name == "booking_confirmed"):
            raise Rejected("event_source_mismatch")
        # Browser time never authorizes historical collection or backdating.
        effective_at = received_at
        if kind == "provider":
            try:
                effective_at = aware(datetime.fromisoformat(raw["occurred_at"].replace("Z", "+00:00")))
            except (KeyError, ValueError, AttributeError):
                raise Rejected("provider_time_invalid") from None
            if not (timedelta(0) <= received_at - effective_at <= LATE):
                raise Rejected("provider_time_out_of_bounds")
        if not (g.starts_at <= effective_at < g.expires_at):
            raise Rejected("no_permission_at_occurrence")
        if self.sessions.get((c.site_id, c.session_id), c.epoch_id) != c.epoch_id:
            raise Rejected("session_epoch_conflict")
        # Fingerprint only the event envelope for idempotency, not the visitor.
        canonical = {"name": name, "props": props, "epoch": c.epoch_id, "session": c.session_id,
                     "provider_time": effective_at.isoformat() if kind == "provider" else None}
        digest = sha256(json.dumps(canonical, sort_keys=True).encode()).hexdigest()
        key = (c.site_id, c.source_id, event_id)
        prior = self.events.get(key)
        if prior:
            if prior["payload_digest"] != digest:
                raise Rejected("idempotency_conflict")
            return "duplicate"
        wkey = (c.site_id, c.epoch_id)
        w = self.windows.get(wkey)
        if w is None:
            if kind != "browser" or name != "page_view":
                raise Rejected("first_event_must_be_eligible_page_view")
            w = {"starts_at": received_at, "ends_at": received_at + WINDOW,
                 "accept_until": received_at + WINDOW + LATE,
                 "expires_at": received_at + WINDOW + FINALIZATION, "state": "active"}
        if not (w["starts_at"] <= effective_at < w["ends_at"]) or received_at >= w["accept_until"]:
            raise Rejected("outside_observation_window")
        self.windows[wkey] = w
        self.sessions[(c.site_id, c.session_id)] = c.epoch_id
        self.events[key] = {"event_id": event_id, "site_id": c.site_id, "source_id": c.source_id,
                           "epoch_id": c.epoch_id, "session_id": c.session_id, "grant_id": c.grant_id,
                           "schema_version": "1.0", "event_name": name, "properties": dict(props),
                           "occurred_at": effective_at, "received_at": received_at,
                           "processed_at": received_at, "expires_at": w["expires_at"],
                           "payload_digest": digest, "evidence_status": "observed"}
        return "accepted"

    def link_session_to_contact(self, c: Context, proof_id: str, now: datetime) -> dict[str, Any]:
        self._grant(c, now, "linking")
        p = self.proofs.get(proof_id)
        if (p is None or p.kind not in {"explicit_contact_link", "authenticated_subject"}
            or p.site_id != c.site_id or p.grant_id != c.grant_id or p.session_id != c.session_id
            or aware(now) >= p.expires_at or not p.event_ids):
            raise Rejected("explicit_scoped_proof_required")
        eligible = {e["event_id"] for e in self.events.values()
                    if e["site_id"] == c.site_id and e["epoch_id"] == c.epoch_id
                    and e["session_id"] == c.session_id and now < e["expires_at"]}
        if not p.event_ids <= eligible:
            raise Rejected("proof_event_scope_mismatch")
        self.links[p.proof_id] = {"site_id": c.site_id, "epoch_id": c.epoch_id,
                                  "session_id": c.session_id, "contact_id": p.contact_id,
                                  "event_ids": sorted(p.event_ids), "proof_id": p.proof_id,
                                  "valid_from": aware(now), "valid_until": min(p.expires_at, self.windows[(c.site_id, c.epoch_id)]["expires_at"]),
                                  "revoked_at": None}
        return self.links[p.proof_id]

    def reverse_link(self, proof_id: str, now: datetime) -> None:
        self.links[proof_id]["revoked_at"] = aware(now)
        # Production must invalidate all contact-level materializations too.

    def infer(self, site_id: str, epoch_id: str, now: datetime) -> dict[str, Any] | None:
        now = aware(now)
        wkey = (site_id, epoch_id)
        self.insights.pop(wkey, None)
        if wkey in self.tombstones:
            return None
        es = [e for e in self.events.values() if e["site_id"] == site_id and e["epoch_id"] == epoch_id
              and e["occurred_at"] <= now < e["expires_at"]
              and self.grants[e["grant_id"]].revoked_at is None
              and now < self.grants[e["grant_id"]].expires_at]
        cases = {e["properties"]["content_id"] for e in es if e["event_name"] == "page_view"
                 and CATALOG[e["properties"]["content_id"]]["type"] == "case_study"}
        ctas = [e for e in es if e["event_name"] == "cta_click" and e["properties"]["cta_id"] == "project_brief"]
        if len(cases) < 2 or not ctas:
            return None
        support = [e for e in es if (e["event_name"] == "page_view" and e["properties"]["content_id"] in cases)
                   or e in ctas]
        result = {"rule_version": "development_interest_v0", "entity_scope": "browser_epoch",
                  "entity_id": epoch_id, "status": "inferred", "confidence": None,
                  "hypothesis": "Possible interest in development work",
                  "evidence_ids": [e["event_id"] for e in support],
                  "alternatives": ["portfolio research", "peer review", "recruiter evaluation"],
                  "unknowns": ["budget", "authority", "urgency", "identity", "external searches"],
                  "next_action": "Offer an optional project-brief form; do not initiate outreach",
                  "created_at": now, "expires_at": min(e["expires_at"] for e in support)}
        self.insights[wkey] = result
        return result

    def withdraw(self, c: Context, now: datetime) -> None:
        """Simulated local erasure plus durable-outbox semantics (memory only here)."""
        now = aware(now)
        g = self.grants.get(c.grant_id)
        if not g or (g.site_id, g.epoch_id) != (c.site_id, c.epoch_id):
            raise Rejected("withdrawal_scope_invalid")
        g.revoked_at = now
        self._erase_epoch(c.site_id, c.epoch_id, now, "withdrawn")

    def _erase_epoch(self, site_id: str, epoch_id: str, now: datetime, state: str) -> None:
        wkey = (site_id, epoch_id)
        self.tombstones.add(wkey)
        if wkey in self.windows:
            self.windows[wkey]["state"] = state
        self.events = {k: e for k, e in self.events.items()
                       if (e["site_id"], e["epoch_id"]) != wkey}
        self.insights.pop(wkey, None)
        scoped_grants = {gid for gid, g in self.grants.items() if (g.site_id, g.epoch_id) == wkey}
        self.proofs = {k: p for k, p in self.proofs.items() if p.grant_id not in scoped_grants or p.site_id != site_id}
        self.links = {k: v for k, v in self.links.items() if (v["site_id"], v["epoch_id"]) != wkey}
        self.sessions = {k: v for k, v in self.sessions.items() if (k[0], v) != wkey}
        for x in self.exports:
            if (x["site_id"], x["epoch_id"]) == wkey:
                key = (site_id, x["destination"], x["remote_ref"])
                self.deletion_jobs.setdefault(key, {"state": "pending", "attempts": 0, "requested_at": now})
        # Deliberately does NOT traverse shared organization/contact nodes.
        # A production erasure controller removes encrypted mappings after ack.

    def expire(self, now: datetime) -> None:
        now = aware(now)
        for (site, epoch), w in list(self.windows.items()):
            if now >= w["expires_at"] and w["state"] not in {"expired", "withdrawn"}:
                self._erase_epoch(site, epoch, now, "expired")
            elif now >= w["ends_at"] and w["state"] == "active":
                w["state"] = "closed"

    def run_deletion_jobs(self, adapter: Callable[[tuple[str, str, str]], bool]) -> None:
        """A true return means VERIFIED deletion, not merely HTTP acceptance."""
        for key, job in self.deletion_jobs.items():
            if job["state"] == "completed":
                continue
            job["attempts"] += 1
            try:
                verified = adapter(key)
            except Exception:
                verified = False
            job["state"] = "completed" if verified else "pending"

/**
 * In-memory `Store` — the same role as reference.py's dicts. Used by the test
 * suite so every reference invariant runs against the production engine code.
 * Not used at runtime.
 */
import {
  ERASING_ACTIONS,
  type DeletionJob,
  type ExportRecord,
  type Grant,
  type Insight,
  type Link,
  type ObservationWindow,
  type Proof,
  type StoredEvent,
  type Store,
  type Tombstone,
} from "./engine.ts";

const clone = <T>(v: T): T => structuredClone(v);

export class MemoryStore implements Store {
  grants = new Map<string, Grant>();
  tombstones: Tombstone[] = [];
  windows = new Map<string, ObservationWindow>();
  sessions = new Map<string, string>();
  events = new Map<string, StoredEvent>();
  proofs = new Map<string, Proof>();
  links = new Map<string, Link>();
  insights = new Map<string, Insight[]>();
  exports: ExportRecord[] = [];
  deletionJobs = new Map<string, DeletionJob>();

  private k = (...parts: string[]) => parts.join("\u0000");

  async getGrant(id: string) {
    const g = this.grants.get(id);
    return g ? clone(g) : null;
  }
  async saveGrant(g: Grant) {
    this.grants.set(g.grantId, clone(g));
  }
  async isTombstoned(siteId: string, scopeHmac: string) {
    return this.tombstones.some(
      (t) => t.siteId === siteId && t.scopeHmac === scopeHmac && ERASING_ACTIONS.includes(t.action),
    );
  }
  async addTombstone(t: Tombstone) {
    this.tombstones.push(clone(t));
  }
  async getWindow(siteId: string, epochId: string) {
    const w = this.windows.get(this.k(siteId, epochId));
    return w ? clone(w) : null;
  }
  async getOrCreateWindow(w: ObservationWindow) {
    const key = this.k(w.siteId, w.epochId);
    if (!this.windows.has(key)) this.windows.set(key, clone(w));
    return clone(this.windows.get(key)!);
  }
  async saveWindow(w: ObservationWindow) {
    this.windows.set(this.k(w.siteId, w.epochId), clone(w));
  }
  async listOpenWindows() {
    return [...this.windows.values()].filter((w) => w.state === "active" || w.state === "closed").map(clone);
  }
  async getSessionEpoch(siteId: string, sessionId: string) {
    return this.sessions.get(this.k(siteId, sessionId)) ?? null;
  }
  async setSessionEpoch(siteId: string, sessionId: string, epochId: string) {
    this.sessions.set(this.k(siteId, sessionId), epochId);
  }
  async getEvent(siteId: string, sourceId: string, sourceEventId: string) {
    const e = this.events.get(this.k(siteId, sourceId, sourceEventId));
    return e ? clone(e) : null;
  }
  async insertEvent(e: StoredEvent) {
    const key = this.k(e.siteId, e.sourceId, e.sourceEventId);
    if (this.events.has(key)) return "duplicate" as const;
    this.events.set(key, clone(e));
    return "inserted" as const;
  }
  async listEvents(siteId: string, epochId: string) {
    return [...this.events.values()].filter((e) => e.siteId === siteId && e.epochId === epochId).map(clone);
  }
  async countEvents(siteId: string, epochId: string) {
    return (await this.listEvents(siteId, epochId)).length;
  }
  async countSessions(siteId: string, epochId: string) {
    let n = 0;
    for (const [k, v] of this.sessions) if (k.startsWith(siteId + "\u0000") && v === epochId) n++;
    return n;
  }
  async getProof(id: string) {
    const p = this.proofs.get(id);
    return p ? clone(p) : null;
  }
  async saveProof(p: Proof) {
    this.proofs.set(p.proofId, clone(p));
  }
  async getLink(id: string) {
    const l = this.links.get(id);
    return l ? clone(l) : null;
  }
  async saveLink(l: Link) {
    this.links.set(l.linkId, clone(l));
  }
  async replaceInsights(siteId: string, epochId: string, list: Insight[]) {
    const key = this.k(siteId, epochId);
    if (list.length === 0) this.insights.delete(key);
    else this.insights.set(key, clone(list));
  }
  async eraseEpochData(siteId: string, epochId: string, grantIds: string[]) {
    for (const [k, e] of this.events) if (e.siteId === siteId && e.epochId === epochId) this.events.delete(k);
    this.insights.delete(this.k(siteId, epochId));
    for (const [k, p] of this.proofs) if (p.siteId === siteId && grantIds.includes(p.grantId)) this.proofs.delete(k);
    for (const [k, l] of this.links) if (l.siteId === siteId && l.epochId === epochId) this.links.delete(k);
    for (const [k, v] of this.sessions) if (k.startsWith(siteId + "\u0000") && v === epochId) this.sessions.delete(k);
  }
  async grantIdsForEpoch(siteId: string, epochId: string) {
    return [...this.grants.values()].filter((g) => g.siteId === siteId && g.epochId === epochId).map((g) => g.grantId);
  }
  async epochsWithData(siteId: string) {
    const ids = new Set<string>();
    for (const e of this.events.values()) if (e.siteId === siteId) ids.add(e.epochId);
    for (const l of this.links.values()) if (l.siteId === siteId) ids.add(l.epochId);
    for (const [k, v] of this.sessions) if (k.startsWith(siteId + "\u0000")) ids.add(v);
    return [...ids];
  }
  async listExports(siteId: string, epochId: string) {
    return this.exports.filter((x) => x.siteId === siteId && x.epochId === epochId).map(clone);
  }
  async upsertDeletionJob(j: DeletionJob) {
    if (!this.deletionJobs.has(j.jobId)) this.deletionJobs.set(j.jobId, clone(j));
  }
  async listDeletionJobs() {
    return [...this.deletionJobs.values()].map(clone);
  }
  async saveDeletionJob(j: DeletionJob) {
    this.deletionJobs.set(j.jobId, clone(j));
  }
}

/**
 * The production `Store`: the engine's storage contract over the `vi_*`
 * collections. Every query names `siteId` (R19). Erasure deletes by epoch and
 * never follows a contact, an organisation or another epoch (R20).
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
import { RETENTION } from "./policy.ts";
import {
  VIDeletionJob,
  VIEvent,
  VIEvidence,
  VIExport,
  VIGrant,
  VIInsight,
  VILink,
  VIProof,
  VISession,
  VITombstone,
  VIWindow,
} from "./models.ts";

type Doc = Record<string, unknown>;
const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

const toGrant = (d: Doc): Grant => ({
  grantId: d._id as string,
  siteId: d.siteId as string,
  epochId: d.epochId as string,
  startsAt: d.startsAt as Date,
  expiresAt: d.validUntil as Date,
  purposes: (d.purposes as Grant["purposes"]) ?? [],
  sources: (d.sources as string[]) ?? [],
  revokedAt: (d.revokedAt as Date) ?? null,
  state: d.state as Grant["state"],
  basis: (d.basis as string) ?? "consent",
  policyVersion: (d.policyVersion as string) ?? "",
  proofRef: (d.proofRef as string) ?? "",
});

const toWindow = (d: Doc): ObservationWindow => ({
  siteId: d.siteId as string,
  windowId: d._id as string,
  epochId: d.epochId as string,
  authorizationId: d.authorizationId as string,
  startsAt: d.startsAt as Date,
  endsAt: d.endsAt as Date,
  acceptUntil: d.acceptUntil as Date,
  expiresAt: d.expiresAt as Date,
  state: d.state as ObservationWindow["state"],
});

export const toEvent = (d: Doc): StoredEvent => {
  const { _id, ...rest } = d;
  void _id;
  return { ...(rest as unknown as StoredEvent), clientReportedAt: (d.clientReportedAt as Date) ?? null };
};

const toProof = (d: Doc): Proof => ({
  proofId: d._id as string,
  siteId: d.siteId as string,
  grantId: d.grantId as string,
  sessionId: d.sessionId as string,
  contactId: d.contactId as string,
  eventIds: (d.eventIds as string[]) ?? [],
  kind: d.kind as string,
  expiresAt: d.expiresAt as Date,
});

export const toLink = (d: Doc): Link => ({
  linkId: d._id as string,
  siteId: d.siteId as string,
  epochId: d.epochId as string,
  sessionId: d.sessionId as string,
  contactId: d.contactId as string,
  eventIds: (d.eventIds as string[]) ?? [],
  proofId: d.proofId as string,
  validFrom: d.validFrom as Date,
  validUntil: d.validUntil as Date,
  revokedAt: (d.revokedAt as Date) ?? null,
  reversalReason: (d.reversalReason as string) ?? null,
});

const toJob = (d: Doc): DeletionJob => ({
  siteId: d.siteId as string,
  jobId: d._id as string,
  destination: d.destination as string,
  remoteRef: d.remoteRef as string,
  scope: d.scope as DeletionJob["scope"],
  state: d.state as DeletionJob["state"],
  attempts: (d.attempts as number) ?? 0,
  requestedAt: d.requestedAt as Date,
  nextAttemptAt: (d.nextAttemptAt as Date) ?? null,
  deadlineAt: d.deadlineAt as Date,
  verifiedAt: (d.verifiedAt as Date) ?? null,
  errorCode: (d.errorCode as string) ?? null,
});

export class MongoStore implements Store {
  async getGrant(grantId: string) {
    const d = await VIGrant.findById(grantId).lean<Doc>();
    return d ? toGrant(d) : null;
  }

  async saveGrant(g: Grant) {
    await VIGrant.updateOne(
      { _id: g.grantId },
      {
        $set: {
          siteId: g.siteId,
          epochId: g.epochId,
          startsAt: g.startsAt,
          validUntil: g.expiresAt,
          purposes: g.purposes,
          sources: g.sources,
          revokedAt: g.revokedAt,
          state: g.state,
          basis: g.basis,
          policyVersion: g.policyVersion,
          proofRef: g.proofRef,
          // The consent record outlives the permission: README "consent/audit 90 days".
          expiresAt: new Date(g.startsAt.getTime() + RETENTION.consentAuditMs),
        },
      },
      { upsert: true },
    );
  }

  async isTombstoned(siteId: string, scopeHmac: string) {
    return (await VITombstone.exists({ siteId, scopeHmac, action: { $in: ERASING_ACTIONS } })) !== null;
  }

  async addTombstone(t: Tombstone) {
    await VITombstone.create({ _id: t.auditId, ...t });
  }

  async getWindow(siteId: string, epochId: string) {
    const d = await VIWindow.findOne({ siteId, epochId }).lean<Doc>();
    return d ? toWindow(d) : null;
  }

  async getOrCreateWindow(w: ObservationWindow) {
    try {
      await VIWindow.create({ _id: w.windowId, ...w });
      return w;
    } catch (err) {
      // Two first page views raced; the unique (siteId, epochId) index picked a winner.
      if (!isDuplicateKey(err)) throw err;
      const existing = await this.getWindow(w.siteId, w.epochId);
      if (!existing) throw err;
      return existing;
    }
  }

  async saveWindow(w: ObservationWindow) {
    await VIWindow.updateOne({ _id: w.windowId }, { $set: { ...w } }, { upsert: true });
  }

  async listOpenWindows() {
    const docs = await VIWindow.find({ state: { $in: ["active", "closed"] } }).lean<Doc[]>();
    return docs.map(toWindow);
  }

  async getSessionEpoch(siteId: string, sessionId: string) {
    const d = await VISession.findById(`${siteId}|${sessionId}`).lean<Doc>();
    return d ? (d.epochId as string) : null;
  }

  async setSessionEpoch(siteId: string, sessionId: string, epochId: string, expiresAt: Date) {
    await VISession.updateOne(
      { _id: `${siteId}|${sessionId}` },
      { $set: { siteId, sessionId, epochId, expiresAt } },
      { upsert: true },
    );
  }

  async getEvent(siteId: string, sourceId: string, sourceEventId: string) {
    const d = await VIEvent.findById(`${siteId}|${sourceId}|${sourceEventId}`).lean<Doc>();
    return d ? toEvent(d) : null;
  }

  async insertEvent(e: StoredEvent) {
    try {
      await VIEvent.create({ _id: `${e.siteId}|${e.sourceId}|${e.sourceEventId}`, ...e });
      return "inserted" as const;
    } catch (err) {
      if (isDuplicateKey(err)) return "duplicate" as const;
      throw err;
    }
  }

  async listEvents(siteId: string, epochId: string) {
    const docs = await VIEvent.find({ siteId, epochId }).sort({ occurredAt: 1 }).lean<Doc[]>();
    return docs.map(toEvent);
  }

  async getProof(proofId: string) {
    const d = await VIProof.findById(proofId).lean<Doc>();
    return d ? toProof(d) : null;
  }

  async saveProof(p: Proof) {
    await VIProof.updateOne({ _id: p.proofId }, { $set: { ...p } }, { upsert: true });
  }

  async getLink(linkId: string) {
    const d = await VILink.findById(linkId).lean<Doc>();
    return d ? toLink(d) : null;
  }

  async saveLink(l: Link) {
    await VILink.updateOne({ _id: l.linkId }, { $set: { ...l, expiresAt: l.validUntil } }, { upsert: true });
  }

  /**
   * One row per (epoch, rule), upserted. infer() runs after every accepted
   * event, so two can overlap; delete-then-insert would let both inserts land
   * and duplicate a hypothesis. Keyed upserts converge whatever the order.
   */
  async replaceInsights(siteId: string, epochId: string, insights: Insight[]) {
    const ids = insights.map((i) => `${epochId}|${i.ruleVersion}`);
    await VIInsight.deleteMany({ siteId, entityId: epochId, _id: { $nin: ids } });
    if (insights.length === 0) return;
    await VIInsight.bulkWrite(
      insights.map((i, n) => ({
        replaceOne: {
          filter: { _id: ids[n] },
          replacement: { _id: ids[n], siteId, entityScope: i.entityScope, entityId: epochId, record: i, expiresAt: i.expiresAt },
          upsert: true,
        },
      })),
    );
  }

  async eraseEpochData(siteId: string, epochId: string, grantIds: string[]) {
    await Promise.all([
      VIEvent.deleteMany({ siteId, epochId }),
      VIInsight.deleteMany({ siteId, entityId: epochId }),
      VILink.deleteMany({ siteId, epochId }),
      VISession.deleteMany({ siteId, epochId }),
      VIEvidence.deleteMany({ siteId, epochId }),
      grantIds.length ? VIProof.deleteMany({ siteId, grantId: { $in: grantIds } }) : Promise.resolve(),
    ]);
  }

  async grantIdsForEpoch(siteId: string, epochId: string) {
    const docs = await VIGrant.find({ siteId, epochId }).select("_id").lean<Doc[]>();
    return docs.map((d) => d._id as string);
  }

  async epochsWithData(siteId: string) {
    const lists = await Promise.all([
      VIEvent.distinct("epochId", { siteId }),
      VILink.distinct("epochId", { siteId }),
      VISession.distinct("epochId", { siteId }),
      VIEvidence.distinct("epochId", { siteId }),
      VIInsight.distinct("entityId", { siteId }),
    ]);
    return [...new Set(lists.flat().map(String))];
  }

  async listExports(siteId: string, epochId: string) {
    const docs = await VIExport.find({ siteId, epochId }).lean<Doc[]>();
    return docs.map(
      (d): ExportRecord => ({
        siteId: d.siteId as string,
        exportId: d._id as string,
        epochId: d.epochId as string,
        destination: d.destination as string,
        remoteRef: d.remoteRef as string,
        exportedAt: d.exportedAt as Date,
        expiresAt: d.expiresAt as Date,
      }),
    );
  }

  async upsertDeletionJob(j: DeletionJob) {
    const { jobId, ...rest } = j;
    await VIDeletionJob.updateOne(
      { _id: jobId },
      { $setOnInsert: { ...rest, purgeAt: new Date(j.deadlineAt.getTime() + RETENTION.deletionJobGraceMs) } },
      { upsert: true },
    );
  }

  async listDeletionJobs() {
    const docs = await VIDeletionJob.find({}).lean<Doc[]>();
    return docs.map(toJob);
  }

  async saveDeletionJob(j: DeletionJob) {
    const { jobId, ...rest } = j;
    await VIDeletionJob.updateOne({ _id: jobId }, { $set: rest });
  }
}

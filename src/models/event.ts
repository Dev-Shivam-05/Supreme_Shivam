import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** One analytics event — a pageview (or custom event) from the beacon. */
const EventSchema = new Schema(
  {
    type: { type: String, default: "pageview", index: true },
    path: { type: String, required: true, index: true },
    referrer: { type: String, default: "" },
    referrerHost: { type: String, default: "direct", index: true },
    utmSource: { type: String, default: "" },
    utmMedium: { type: String, default: "" },
    utmCampaign: { type: String, default: "" },
    country: { type: String, default: "Unknown", index: true },
    device: { type: String, default: "desktop" },
    browser: { type: String, default: "" },
    os: { type: String, default: "" },
    sessionId: { type: String, default: "", index: true },
    /**
     * human | untagged | bot, decided at write time by the same rule the
     * aggregation applies (see lib/analytics.ts). Stored so a future query can
     * filter cheaply; the aggregation still recomputes it, because 257 events
     * were banked before this field existed.
     */
    visitorClass: { type: String, enum: ["human", "untagged", "bot"], default: "human", index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// speeds up time-series rollups
EventSchema.index({ createdAt: -1 });
// auto-expire raw events after 180 days so the collection can't grow unbounded
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export type EventDoc = InferSchemaType<typeof EventSchema>;
export const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

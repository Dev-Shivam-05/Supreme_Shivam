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
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// speeds up time-series rollups
EventSchema.index({ createdAt: -1 });
// auto-expire raw events after 180 days so the collection can't grow unbounded
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export type EventDoc = InferSchemaType<typeof EventSchema>;
export const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

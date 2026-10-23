import mongoose, { Schema, type InferSchemaType } from "mongoose";

const LeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    subject: { type: String, trim: true, maxlength: 200, default: "" },
    message: { type: String, required: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["new", "read", "replied", "archived"],
      default: "new",
      index: true,
    },
    source: { type: String, default: "portfolio" },
    /**
     * A keyed hash (HMAC under a server-only secret, lib/keyed-hash.ts) of the
     * sender's IP, never the address itself. It exists only to recognise a
     * repeat spammer; nothing in the app reads it back. Without the key it
     * cannot be reversed; with it, an IPv4 address could be recovered by brute
     * force — which is why the policy says exactly that.
     */
    ipHash: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    /**
     * Self-reported by the visitor on the contact form and never verified: "an
     * organisation" here is what they typed, not a confirmed affiliation. Stored
     * as part of the enquiry, so it follows the enquiry's 24-month retention
     * (spec D2), not the visitor-intelligence windows.
     */
    enquiringAs: {
      type: String,
      enum: ["", "individual", "organization", "recruiter", "agency", "other"],
      default: "",
    },
    organization: { type: String, trim: true, maxlength: 120, default: "" },
    topic: { type: String, enum: ["", "development", "hiring", "collaboration", "other"], default: "" },
    /**
     * The `vi_links` id when the visitor ticked "link this visit". A pointer
     * only: the journey stays in `vi_*` under its own shorter retention and can
     * be erased or reversed without touching this enquiry (R10).
     */
    visitLinkId: { type: String, default: "" },
  },
  { timestamps: true },
);

/**
 * Enquiries auto-delete after 24 months. The privacy policy states that
 * retention period, so it needs a mechanism behind it rather than a promise.
 */
LeadSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });

export type LeadDoc = InferSchemaType<typeof LeadSchema>;
export const Lead = mongoose.models.Lead || mongoose.model("Lead", LeadSchema);

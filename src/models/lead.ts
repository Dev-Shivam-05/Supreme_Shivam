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
     * A salted hash of the sender's IP, never the address itself. It exists only
     * to recognise a repeat spammer; nothing in the app reads it back, and a
     * hash serves that purpose without retaining an identifier.
     */
    ipHash: { type: String, default: "" },
    userAgent: { type: String, default: "" },
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

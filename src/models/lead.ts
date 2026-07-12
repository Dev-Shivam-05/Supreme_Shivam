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
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true },
);

export type LeadDoc = InferSchemaType<typeof LeadSchema>;
export const Lead = mongoose.models.Lead || mongoose.model("Lead", LeadSchema);

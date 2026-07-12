import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Uploaded images stored directly in Mongo (Buffer). Works with only
 * MONGODB_URI — no S3/Cloudinary needed. Fine for a portfolio's handful of
 * images; swap `data` for an S3 key later if you ever need scale.
 */
const MediaSchema = new Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    filename: { type: String, default: "" },
    alt: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type MediaDoc = InferSchemaType<typeof MediaSchema>;
export const Media = mongoose.models.Media || mongoose.model("Media", MediaSchema);

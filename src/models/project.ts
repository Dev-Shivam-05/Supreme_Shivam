import mongoose, { Schema, type InferSchemaType } from "mongoose";

const MetricSchema = new Schema({ value: String, label: String }, { _id: false });

/** Editable project — CRUD from /admin, read by the public site. */
const ProjectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    index: { type: String, default: "01" },
    title: { type: String, required: true },
    category: { type: String, default: "" },
    year: { type: String, default: "" },
    role: { type: String, default: "" },
    timeline: { type: String, default: "" },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    stack: { type: [String], default: [] },
    metrics: { type: [MetricSchema], default: [] },
    problem: { type: String, default: "" },
    approach: { type: [String], default: [] },
    architecture: { type: [String], default: [] },
    outcomes: { type: [String], default: [] },
    pattern: { type: String, enum: ["grid", "wave", "nodes", "scan", "orbit"], default: "grid" },
    flagship: { type: Boolean, default: false },
    imageUrl: { type: String, default: "" }, // /api/media/:id or an external URL
    repo: { type: String, default: "" },
    live: { type: String, default: "" },
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ProjectDoc = InferSchemaType<typeof ProjectSchema>;
export const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);

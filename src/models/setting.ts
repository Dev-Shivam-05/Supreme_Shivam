import mongoose, { Schema } from "mongoose";

/**
 * Site content overrides — a single document keyed "site". `value` holds any
 * editable text/image fields (hero, about, availability, now, contact…).
 * The public site merges these over the static defaults in lib/site.ts.
 */
const SettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    value: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false },
);

export const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);

const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String },
    content: { type: String, required: true },
    image: { type: String },
    tags: [{ type: String }],
    published: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);

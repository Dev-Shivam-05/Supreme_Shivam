const mongoose = require("mongoose");

const visitorLogSchema = new mongoose.Schema(
  {
    ip: { type: String },
    userAgent: { type: String },
    path: { type: String },
    method: { type: String },
    referrer: { type: String },
    visitedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("VisitorLog", visitorLogSchema);

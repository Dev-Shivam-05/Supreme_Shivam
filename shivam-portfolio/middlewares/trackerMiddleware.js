const VisitorLog = require("../models/VisitorLog");

const trackerMiddleware = (req, res, next) => {
  VisitorLog.create({
    ip: req.ip,
    userAgent: req.get("user-agent"),
    path: req.originalUrl,
    method: req.method,
    referrer: req.get("referer")
  }).catch(() => {});
  next();
};

module.exports = trackerMiddleware;

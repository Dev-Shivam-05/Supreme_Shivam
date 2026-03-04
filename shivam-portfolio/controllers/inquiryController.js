const Inquiry = require("../models/Inquiry");

const submitInquiry = async (req, res) => {
  await Inquiry.create(req.body);
  req.flash("success", "Message sent");
  res.redirect("/contact");
};

module.exports = {
  submitInquiry
};

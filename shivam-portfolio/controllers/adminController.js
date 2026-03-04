const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Project = require("../models/Project");
const Inquiry = require("../models/Inquiry");
const VisitorLog = require("../models/VisitorLog");

const getLogin = (req, res) => {
  res.render("admin/login");
};
const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Check if User Exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Login Failed: User not found");
      req.flash("error", "Invalid Email or Password"); // Store error
      return res.redirect("/admin/login"); // STOP HERE
    }

    // 2. Check Password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("Login Failed: Wrong password");
      req.flash("error", "Invalid Email or Password"); // Store error
      return res.redirect("/admin/login"); // STOP HERE
    }

    // 3. Success - Set Session
    req.session.userId = user._id.toString();
    req.session.isAdmin = true;
    
    console.log("Login Success: Redirecting to Dashboard");
    return res.redirect("/admin/dashboard"); // Redirect to Dashboard
    
  } catch (error) {
    console.error("Login Error:", error);
    req.flash("error", "Server Error");
    return res.redirect("/admin/login");
  }
};

const postLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
};
const getDashboard = async (req, res) => {
  try {
    const [projectCount, inquiryCount, logCount] = await Promise.all([
      Project.countDocuments(),
      Inquiry.countDocuments(),
      VisitorLog.countDocuments(),
    ]);

    // FIX: Removed ".ejs" extension and ensured layout path is correct
    res.render("admin/dashboard", {
      layout: "layouts/admin-layout",
      projectCount: projectCount || 0, // Fallback to 0
      inquiryCount: inquiryCount || 0,
      logCount: logCount || 0,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    // Render with zero stats instead of crashing
    res.render("admin/dashboard", {
      layout: "layouts/admin-layout",
      projectCount: 0,
      inquiryCount: 0,
      logCount: 0,
    });
  }
};

const getProjectsManage = async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  res.render("admin/projects-manage", { projects });
};

const getInquiriesManage = async (req, res) => {
  const inquiries = await Inquiry.find().sort({ createdAt: -1 });
  res.render("admin/inquiries-manage", { inquiries });
};

module.exports = {
  getLogin,
  postLogin,
  postLogout,
  getDashboard,
  getProjectsManage,
  getInquiriesManage,
};

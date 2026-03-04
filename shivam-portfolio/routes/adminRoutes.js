const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

const User = require("../models/User");
const bcrypt = require("bcryptjs");

// TEMPORARY: Create Admin User Route
router.get("/create-admin-secret-key", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash("123456", 12);
    
    // Check if user exists first to prevent duplicates
    const existingUser = await User.findOne({ email: "admin@shivam.com" });
    if (existingUser) {
        return res.send("Admin already exists. Go to Login.");
    }

    await User.create({
      name: "Shivam Bhadoriya", // <--- ADDED THIS (Fixes Validation Error)
      username: "ShivamAdmin",
      email: "admin@shivam.com",
      password: hashedPassword
    });
    
    res.send("<h1>Admin Created Successfully!</h1><a href='/admin/login'>Go to Login</a>");
  } catch (err) {
    res.send("Error: " + err.message);
  }
});


router.get("/login", adminController.getLogin);
router.post("/login", adminController.postLogin);
router.post("/logout", adminController.postLogout);

router.get("/dashboard", adminController.getDashboard);
router.get("/projects", authMiddleware, adminController.getProjectsManage);
router.get("/inquiries", authMiddleware, adminController.getInquiriesManage);

module.exports = router;

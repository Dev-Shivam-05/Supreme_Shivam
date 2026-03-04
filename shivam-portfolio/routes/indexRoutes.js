const express = require("express");
const pageController = require("../controllers/pageController.js");
const inquiryController = require("../controllers/inquiryController.js");

const router = express.Router();

router.get("/", pageController.getHome);
router.get("/about", pageController.getAbout);
router.get("/services", pageController.getServices);
router.get("/contact", pageController.getContact);
router.post("/contact", inquiryController.submitInquiry);

module.exports = router;

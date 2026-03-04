const express = require("express");
const blogController = require("../controllers/blogController");
const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", blogController.getBlogs);
router.get("/:id", blogController.getBlog);
router.post("/", authMiddleware, upload.single("image"), blogController.createBlog);
router.put("/:id", authMiddleware, upload.single("image"), blogController.updateBlog);
router.delete("/:id", authMiddleware, blogController.deleteBlog);

module.exports = router;

const express = require("express");
const projectController = require("../controllers/projectController");
const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProject);
router.post("/", authMiddleware, upload.single("image"), projectController.createProject);
router.put("/:id", authMiddleware, upload.single("image"), projectController.updateProject);
router.delete("/:id", authMiddleware, projectController.deleteProject);

module.exports = router;

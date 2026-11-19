"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/authenticate");
const projectController = require("../controllers/projectController");

const router = express.Router();

router.use(requireAuth);
router.get("/", projectController.renderProjects);
router.post("/", projectController.createProject);
router.get("/:projectId", projectController.getProject);
router.post("/:projectId/update", projectController.updateProject);
router.post("/:projectId/delete", projectController.deleteProject);

module.exports = router;

"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/authenticate");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.use(requireAuth);
router.get("/", taskController.renderTasks);
router.post("/", taskController.createTask);
router.get("/assignees", taskController.getAssignees);
router.get("/:taskId", taskController.renderTaskDetails);
router.post("/:taskId/update", taskController.updateTask);
router.post("/:taskId/status", taskController.changeStatus);
router.post("/:taskId/delete", taskController.deleteTask);

module.exports = router;

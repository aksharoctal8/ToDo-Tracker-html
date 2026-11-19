"use strict";

const express = require("express");
const pageRoutes = require("./pageRoutes");
const healthRoutes = require("./healthRoutes");
const authRoutes = require("./authRoutes");
const taskRoutes = require("./taskRoutes");
const projectRoutes = require("./projectRoutes");
const companyRoutes = require("./companyRoutes");

const router = express.Router();

router.use("/api/health", healthRoutes);
router.use("/", authRoutes);
router.use("/", companyRoutes);
router.use("/tasks", taskRoutes);
router.use("/projects", projectRoutes);
router.use("/", pageRoutes);

module.exports = router;

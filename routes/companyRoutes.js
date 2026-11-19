"use strict";

const express = require("express");
const companyController = require("../controllers/companyController");
const { requireAuth } = require("../middleware/authenticate");

const router = express.Router();

router.use(requireAuth);

router.get("/company/register", companyController.renderCompanySetup);
router.post("/company/register", companyController.createCompany);
router.get("/company", companyController.renderCompanyDashboard);
router.get("/company/members", companyController.renderCompanyMembers);
router.get("/teams", companyController.renderTeams);
router.post("/teams", companyController.createTeam);
router.get("/teams/:teamId", companyController.renderTeamDetail);
router.post("/teams/:teamId/members", companyController.addTeamMember);

module.exports = router;

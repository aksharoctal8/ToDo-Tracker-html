"use strict";

const express = require("express");
const pageController = require("../controllers/pageController");
const validateRequest = require("../middleware/validateRequest");
const { requireAuth } = require("../middleware/authenticate");

const router = express.Router();

router.get("/", pageController.renderHome);
router.get(["/index.html", "/Demo/index.html"], pageController.redirectLegacyEntry);
router.get("/CSS/Style.css", (_request, response) => response.redirect(301, "/css/style.css"));
router.get("/JS/script.js", (_request, response) => response.redirect(301, "/js/app.js"));
router.get("/:page", validateRequest({
    params: {
        page: {
            validate: pageController.isWorkspacePage,
            message: "Page not found.",
            statusCode: 404
        }
    }
}), requireAuth, pageController.renderWorkspace);

module.exports = router;

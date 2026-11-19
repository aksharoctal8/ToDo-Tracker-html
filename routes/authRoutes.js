"use strict";

const express = require("express");
const authController = require("../controllers/authController");
const authenticationRateLimit = require("../middleware/authRateLimit");
const { requireAuth } = require("../middleware/authenticate");
const {
    validateLogin,
    validatePasswordChange,
    validateProfileUpdate,
    validateRegistration
} = require("../middleware/authValidation");

const router = express.Router();

router.get("/login", authController.renderLogin);
router.get("/register", authController.renderRegister);
router.post("/auth/register", authenticationRateLimit, validateRegistration, authController.register);
router.post("/auth/login", authenticationRateLimit, validateLogin, authController.login);
router.post("/auth/logout", requireAuth, authController.logout);
router.post("/auth/profile", requireAuth, validateProfileUpdate, authController.updateProfile);
router.post("/auth/password", requireAuth, validatePasswordChange, authController.changePassword);

module.exports = router;

"use strict";

const crypto = require("node:crypto");
const AppError = require("../utils/AppError");
const env = require("../config/env");

const CSRF_COOKIE_NAME = "taskflow_csrf";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function csrfCookieOptions() {
    return {
        httpOnly: false,
        secure: env.nodeEnv === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
    };
}

function csrfProtection(request, response, next) {
    let csrfToken = request.cookies[CSRF_COOKIE_NAME];
    if (typeof csrfToken !== "string" || !/^[a-f0-9]{64}$/.test(csrfToken)) {
        csrfToken = crypto.randomBytes(32).toString("hex");
        response.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
    }

    response.locals.csrfToken = csrfToken;
    if (SAFE_METHODS.has(request.method)) return next();

    const submittedToken = request.get("X-CSRF-Token") || request.body?.csrfToken;
    if (typeof submittedToken !== "string" || submittedToken.length !== csrfToken.length) {
        return next(new AppError("The security token is missing or invalid. Reload the page and try again.", 403));
    }

    const valid = crypto.timingSafeEqual(
        Buffer.from(submittedToken, "utf8"),
        Buffer.from(csrfToken, "utf8")
    );
    if (!valid) {
        return next(new AppError("The security token is missing or invalid. Reload the page and try again.", 403));
    }

    next();
}

module.exports = csrfProtection;

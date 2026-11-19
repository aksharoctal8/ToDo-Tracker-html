"use strict";

const { rateLimit } = require("express-rate-limit");
const AppError = require("../utils/AppError");

const authenticationRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler(_request, _response, next) {
        next(new AppError("Too many authentication attempts. Please wait before trying again.", 429));
    }
});

module.exports = authenticationRateLimit;

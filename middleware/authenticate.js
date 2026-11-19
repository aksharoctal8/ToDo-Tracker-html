"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");
const {
    TOKEN_AUDIENCE,
    TOKEN_COOKIE_NAME,
    TOKEN_ISSUER,
    clearAuthCookie
} = require("../config/auth");

async function resolveAuthenticatedUser(request, response, next) {
    const token = request.cookies[TOKEN_COOKIE_NAME];
    if (!token) return next();

    try {
        const payload = jwt.verify(token, env.jwtSecret, {
            algorithms: ["HS256"],
            audience: TOKEN_AUDIENCE,
            issuer: TOKEN_ISSUER
        });
        if (typeof payload.sub !== "string" || !Number.isInteger(payload.ver)) {
            clearAuthCookie(response);
            request.invalidAuthToken = true;
            return next();
        }

        const user = await User.findById(payload.sub).select("+tokenVersion");
        if (!user || !user.isActive || user.tokenVersion !== payload.ver) {
            clearAuthCookie(response);
            request.invalidAuthToken = true;
            return next();
        }

        request.user = user;
        response.locals.currentUser = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            clearAuthCookie(response);
            request.invalidAuthToken = true;
            return next();
        }
        next(error);
    }
}

function requireAuth(request, response, next) {
    if (!request.user) {
        const accept = request.get("Accept") || "";
        if (request.accepts("html") && !accept.includes("application/json")) {
            const destination = request.invalidAuthToken ? "/login?expired=1" : "/login";
            return response.redirect(303, destination);
        }
        return response.status(401).json({
            error: {
                status: 401,
                message: request.invalidAuthToken ? "Your session has expired. Please sign in again." : "Authentication is required."
            }
        });
    }

    response.set("Cache-Control", "no-store");
    next();
}

module.exports = { requireAuth, resolveAuthenticatedUser };

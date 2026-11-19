"use strict";

const env = require("./env");

const TOKEN_COOKIE_NAME = "taskflow_token";
const TOKEN_LIFETIME_SECONDS = 60 * 60;
const TOKEN_ISSUER = "taskflow";
const TOKEN_AUDIENCE = "taskflow-web";

function assertAuthConfiguration() {
    if (Buffer.byteLength(env.jwtSecret, "utf8") < 32) {
        throw new Error("JWT_SECRET must be set to a random secret containing at least 32 bytes. Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
    }
}

function authCookieOptions() {
    return {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "strict",
        path: "/",
        maxAge: TOKEN_LIFETIME_SECONDS * 1000
    };
}

function clearAuthCookie(response) {
    response.clearCookie(TOKEN_COOKIE_NAME, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "strict",
        path: "/"
    });
}

module.exports = {
    TOKEN_AUDIENCE,
    TOKEN_COOKIE_NAME,
    TOKEN_ISSUER,
    TOKEN_LIFETIME_SECONDS,
    assertAuthConfiguration,
    authCookieOptions,
    clearAuthCookie
};

"use strict";

const { getPageData } = require("../services/pageDataService");

function errorHandler(error, request, response, _next) {
    let statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    let message = error.message;

    if (error.type === "entity.parse.failed") {
        statusCode = 400;
        message = "Request body contains invalid JSON.";
    } else if (error.name === "ValidationError" || error.name === "CastError") {
        statusCode = 400;
    } else if (error.code === 11000) {
        statusCode = 409;
        message = "A record with that value already exists.";
    }

    if (statusCode >= 500) {
        message = "An unexpected error occurred.";
    }

    const requestPath = request.originalUrl.split("?")[0];
    const authPage = requestPath === "/auth/login" ? "login"
        : requestPath === "/auth/register" ? "register"
            : null;
    if (authPage && statusCode < 500) {
        return response.status(statusCode).render(authPage, {
            ...getPageData(authPage),
            authError: message,
            sessionExpired: false
        });
    }

    const accountPage = requestPath === "/auth/profile" || requestPath === "/auth/password";
    if (accountPage && statusCode < 500 && request.user) {
        return response.status(statusCode).render("profile", {
            ...getPageData("profile", request.user),
            authError: message,
            queryUpdated: false,
            passwordChanged: false
        });
    }

    if (statusCode >= 500) {
        console.error("TaskFlow request failed.", {
            method: request.method,
            path: request.originalUrl,
            error
        });
    }

    if (request.accepts("html")) {
        return response.status(statusCode).render("error", {
            pageTitle: statusCode === 404 ? "Page not found | TaskFlow" : "Something went wrong | TaskFlow",
            statusCode,
            message
        });
    }

    response.status(statusCode).json({
        error: {
            status: statusCode,
            message
        }
    });
}

module.exports = errorHandler;

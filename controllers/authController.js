"use strict";

const authService = require("../services/authService");
const { getPageData } = require("../services/pageDataService");
const {
    TOKEN_COOKIE_NAME,
    authCookieOptions,
    clearAuthCookie
} = require("../config/auth");

function renderLogin(request, response) {
    if (response.locals.currentUser) return response.redirect(303, "/dashboard");
    response.render("login", {
        ...getPageData("login"),
        authError: null,
        sessionExpired: request.query.expired === "1"
    });
}

function renderRegister(_request, response) {
    if (response.locals.currentUser) return response.redirect(303, "/dashboard");
    response.render("register", {
        ...getPageData("register"),
        authError: null
    });
}

async function register(request, response) {
    const { token } = await authService.register({
        name: request.body.name,
        email: request.body.email,
        password: request.body.password
    });
    response.cookie(TOKEN_COOKIE_NAME, token, authCookieOptions());
    response.set("Cache-Control", "no-store");
    response.redirect(303, "/dashboard");
}

async function login(request, response) {
    const { token } = await authService.login({
        email: request.body.email,
        password: request.body.password
    });
    response.cookie(TOKEN_COOKIE_NAME, token, authCookieOptions());
    response.set("Cache-Control", "no-store");
    response.redirect(303, "/dashboard");
}

async function logout(request, response) {
    request.user.tokenVersion += 1;
    await request.user.save();
    clearAuthCookie(response);
    response.redirect(303, "/");
}

async function updateProfile(request, response) {
    request.user.name = request.body.name.trim();
    request.user.email = request.body.email.trim().toLowerCase();
    await request.user.save();
    response.redirect(303, "/profile?updated=1");
}

async function changePassword(request, response) {
    const { token } = await authService.changePassword(request.user, {
        currentPassword: request.body.currentPassword,
        newPassword: request.body.newPassword
    });
    response.cookie(TOKEN_COOKIE_NAME, token, authCookieOptions());
    response.set("Cache-Control", "no-store");
    response.redirect(303, "/profile?passwordChanged=1");
}

module.exports = {
    changePassword,
    login,
    logout,
    register,
    renderLogin,
    renderRegister,
    updateProfile
};

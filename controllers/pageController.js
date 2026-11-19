"use strict";

const { getPageData, getWorkspacePageData } = require("../services/pageDataService");

const workspacePages = new Set([
    "dashboard",
    "tasks",
    "projects",
    "analytics",
    "notifications",
    "profile",
    "settings"
]);

function renderHome(request, response) {
    response.render("home", getPageData("home", request.user));
}

async function renderWorkspace(request, response) {
    const page = request.params.page;
    const pageData = await getWorkspacePageData(page, request.user);
    response.render(page, {
        ...pageData,
        authError: null,
        queryUpdated: page === "profile" && request.query.updated === "1",
        passwordChanged: page === "profile" && request.query.passwordChanged === "1"
    });
}

function isWorkspacePage(page) {
    return workspacePages.has(page);
}

function redirectLegacyEntry(_request, response) {
    response.redirect(301, "/");
}

module.exports = {
    isWorkspacePage,
    redirectLegacyEntry,
    renderHome,
    renderWorkspace
};

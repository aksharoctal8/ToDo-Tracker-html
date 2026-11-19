"use strict";

const projectService = require("../services/projectService");
const { getWorkspacePageData } = require("../services/pageDataService");

async function renderProjects(request, response) {
    const [pageData, projects, memberChoices] = await Promise.all([
        getWorkspacePageData("projects", request.user),
        projectService.listProjects(request.user._id),
        projectService.getMemberChoices(request.user._id)
    ]);
    response.render("projects", {
        ...pageData,
        projects,
        memberChoices: memberChoices.map(member => ({
            id: String(member._id),
            name: member.name,
            email: member.email
        })),
        projectSuccess: request.query.created === "1" ? "Project created."
            : request.query.updated === "1" ? "Project updated."
                : request.query.deleted === "1" ? "Project deleted. Its tasks were kept without a project."
                    : null,
        projectError: null,
        pageTitle: "Projects | TaskFlow"
    });
}

async function getProject(request, response) {
    const project = await projectService.getProject(request.params.projectId, request.user._id);
    if (request.accepts("json") && !request.accepts("html")) {
        return response.json({ project });
    }
    response.redirect(303, "/projects");
}

async function createProject(request, response) {
    await projectService.createProject(request.body, request.user._id);
    response.redirect(303, "/projects?created=1");
}

async function updateProject(request, response) {
    await projectService.updateProject(request.params.projectId, request.body, request.user._id);
    response.redirect(303, "/projects?updated=1");
}

async function deleteProject(request, response) {
    await projectService.deleteProject(request.params.projectId, request.user._id);
    response.redirect(303, "/projects?deleted=1");
}

module.exports = {
    createProject,
    deleteProject,
    getProject,
    renderProjects,
    updateProject
};

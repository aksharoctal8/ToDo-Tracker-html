"use strict";

const taskService = require("../services/taskService");
const { getWorkspacePageData } = require("../services/pageDataService");

async function renderTasks(request, response) {
    const [pageData, taskData] = await Promise.all([
        getWorkspacePageData("tasks", request.user),
        taskService.listTasks(request.user._id, request.query)
    ]);
    response.render("tasks", {
        ...pageData,
        ...taskData,
        pageTitle: "My Tasks | TaskFlow",
        successMessage: request.query.saved === "1" ? "Task created."
            : request.query.updated === "1" ? "Task updated."
                : request.query.deleted === "1" ? "Task deleted."
                    : request.query.statusUpdated === "1" ? "Task status updated."
                        : null,
        authError: null
    });
}

async function renderTaskDetails(request, response) {
    const task = await taskService.getTaskForUser(request.params.taskId, request.user._id);
    const view = taskService.toTaskView(task);
    if (request.accepts("json") && !request.accepts("html")) {
        return response.json({ task: view });
    }
    const [pageData, projects, assignees] = await Promise.all([
        getWorkspacePageData("tasks", request.user),
        taskService.getProjectsForUser(request.user._id),
        taskService.getAssignableUsers(request.user._id, view.projectId)
    ]);
    response.render("task-detail", {
        ...pageData,
        projects,
        assignees,
        task: view,
        canDelete: view.createdBy === String(request.user._id),
        pageTitle: `${view.title} | TaskFlow`,
        authError: null
    });
}

async function getAssignees(request, response) {
    const assignees = await taskService.getAssignableUsers(request.user._id, request.query.projectId || "");
    response.json({ assignees: assignees.map(user => ({ id: String(user._id), name: user.name })) });
}

async function createTask(request, response) {
    await taskService.createTask(request.body, request.user);
    response.redirect(303, "/tasks?saved=1");
}

async function updateTask(request, response) {
    await taskService.updateTask(request.params.taskId, request.body, request.user._id);
    response.redirect(303, "/tasks?updated=1");
}

async function changeStatus(request, response) {
    await taskService.changeStatus(request.params.taskId, request.body.status, request.user._id);
    response.redirect(303, "/tasks?statusUpdated=1");
}

async function deleteTask(request, response) {
    await taskService.deleteTask(request.params.taskId, request.user._id);
    response.redirect(303, "/tasks?deleted=1");
}

module.exports = {
    changeStatus,
    createTask,
    deleteTask,
    getAssignees,
    renderTaskDetails,
    renderTasks,
    updateTask
};

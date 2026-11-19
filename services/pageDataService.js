"use strict";

const taskService = require("./taskService");
const projectService = require("./projectService");

const notifications = [];

function getPageData(currentPage, authenticatedUser = null) {
    const pageUser = authenticatedUser ? {
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        profileImage: authenticatedUser.profileImage || "",
        role: authenticatedUser.role,
        isActive: authenticatedUser.isActive,
        createdAt: authenticatedUser.createdAt,
        updatedAt: authenticatedUser.updatedAt,
        initials: authenticatedUser.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "TF",
        workspaceName: `${authenticatedUser.name}'s workspace`
    } : {
        name: "TaskFlow",
        email: "",
        profileImage: "",
        role: "user",
        isActive: true,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        initials: "TF",
        workspaceName: "Your workspace"
    };

    return {
        currentPage,
        pageTitle: currentPage === "home" ? "TaskFlow - Work, in flow" : `${currentPage[0].toUpperCase()}${currentPage.slice(1)} | TaskFlow`,
        user: pageUser,
        tasks: [],
        projects: [],
        stats: { total: 0, completed: 0, inProgress: 0, pending: 0, cancelled: 0, overdue: 0, completionRate: 0, pendingRate: 0 },
        weeklyCompletion: [],
        notifications,
        unreadNotificationCount: 0
    };
}

async function getWorkspacePageData(currentPage, user) {
    const includeProjects = ["dashboard", "analytics", "projects"].includes(currentPage);
    const includeWeeklyCompletion = ["dashboard", "analytics"].includes(currentPage);
    const [stats, projects, tasks, weeklyCompletion, taskAnalytics] = await Promise.all([
        taskService.getTaskSummary(user._id),
        includeProjects
            ? projectService.getProjectMetrics(user._id)
            : taskService.getProjectsForUser(user._id),
        currentPage === "dashboard" ? taskService.getRecentTasks(user._id) : Promise.resolve([]),
        includeWeeklyCompletion ? taskService.getWeeklyCompletion(user._id) : Promise.resolve([]),
        currentPage === "analytics" ? taskService.getTaskAnalytics(user._id) : Promise.resolve(null)
    ]);
    stats.totalProjects = projects.length;
    stats.activeProjects = projects.filter(project => project.status !== "Completed").length;
    stats.overallCompletionPercentage = stats.completionRate;
    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

    return {
        ...getPageData(currentPage, user),
        stats,
        projects,
        tasks,
        weeklyCompletion,
        taskAnalytics,
        greeting
    };
}

module.exports = { getPageData, getWorkspacePageData };

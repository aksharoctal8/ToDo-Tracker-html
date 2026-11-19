"use strict";

const { getPageData } = require("../services/pageDataService");
const companyService = require("../services/companyService");

async function renderCompanySetup(request, response) {
    const pageData = {
        ...getPageData("company", request.user),
        company: null,
        teams: [],
        teamMembers: [],
        stats: {
            totalTeams: 0,
            totalMembers: 0,
            totalTasks: 0,
            pendingTasks: 0,
            inProgressTasks: 0,
            completedTasks: 0,
            overdueTasks: 0
        }
    };
    response.render("company-register", {
        ...pageData,
        pageTitle: "Company registration | TaskFlow",
        authError: null,
        submissionError: null
    });
}

async function createCompany(request, response) {
    try {
        await companyService.createCompany(request.body, request.user._id);
        response.redirect(303, "/company");
    } catch (error) {
        const pageData = {
            ...getPageData("company", request.user),
            company: null,
            teams: [],
            teamMembers: [],
            stats: {
                totalTeams: 0,
                totalMembers: 0,
                totalTasks: 0,
                pendingTasks: 0,
                inProgressTasks: 0,
                completedTasks: 0,
                overdueTasks: 0
            }
        };
        response.status(error.statusCode || 400).render("company-register", {
            ...pageData,
            pageTitle: "Company registration | TaskFlow",
            authError: null,
            submissionError: error.message
        });
    }
}

async function renderCompanyDashboard(request, response) {
    const dashboardData = await companyService.getCompanyDashboard(request.user._id);
    const pageData = {
        ...getPageData("company", request.user),
        ...dashboardData,
        pageTitle: `${dashboardData.company ? dashboardData.company.name : "Company"} | TaskFlow`,
        authError: null,
        submissionError: null
    };

    if (!dashboardData.company) {
        return response.render("company-register", {
            ...pageData,
            pageTitle: "Company registration | TaskFlow",
            authError: null,
            submissionError: null
        });
    }

    response.render("company", pageData);
}

async function renderTeams(request, response) {
    const company = await companyService.getCompanyForUser(request.user._id);
    const teams = company ? await companyService.getTeamsForCompany(request.user._id) : [];
    const pageData = {
        ...getPageData("company", request.user),
        company,
        teams,
        pageTitle: "Teams | TaskFlow",
        authError: null,
        submissionError: null,
        successMessage: request.query.created === "1" ? "Team created successfully." : null
    };

    response.render("teams", pageData);
}

async function createTeam(request, response) {
    try {
        await companyService.createTeam(request.body, request.user._id);
        response.redirect(303, "/teams?created=1");
    } catch (error) {
        const company = await companyService.getCompanyForUser(request.user._id);
        const teams = company ? await companyService.getTeamsForCompany(request.user._id) : [];
        response.status(error.statusCode || 400).render("teams", {
            ...getPageData("company", request.user),
            company,
            teams,
            pageTitle: "Teams | TaskFlow",
            authError: null,
            submissionError: error.message
        });
    }
}

async function renderTeamDetail(request, response) {
    const teamData = await companyService.getTeam(request.params.teamId, request.user._id);
    const pageData = {
        ...getPageData("company", request.user),
        company: await companyService.getCompanyForUser(request.user._id),
        team: teamData.team,
        members: teamData.members,
        pageTitle: `${teamData.team.name} | TaskFlow`,
        authError: null,
        submissionError: null,
        successMessage: request.query.memberAdded === "1" ? "Team member added." : null
    };
    response.render("team-detail", pageData);
}

async function addTeamMember(request, response) {
    try {
        await companyService.addMemberToTeam({
            teamId: request.params.teamId,
            email: request.body.email,
            role: request.body.role
        }, request.user._id);
        response.redirect(303, `/teams/${request.params.teamId}?memberAdded=1`);
    } catch (error) {
        const teamData = await companyService.getTeam(request.params.teamId, request.user._id);
        response.status(error.statusCode || 400).render("team-detail", {
            ...getPageData("company", request.user),
            company: await companyService.getCompanyForUser(request.user._id),
            team: teamData.team,
            members: teamData.members,
            pageTitle: `${teamData.team.name} | TaskFlow`,
            authError: null,
            submissionError: error.message
        });
    }
}

async function renderCompanyMembers(request, response) {
    const company = await companyService.getCompanyForUser(request.user._id);
    const members = company ? await companyService.getCompanyMembers(request.user._id) : [];
    response.render("company-members", {
        ...getPageData("company", request.user),
        company,
        members,
        pageTitle: "Company members | TaskFlow",
        authError: null,
        submissionError: null
    });
}

module.exports = {
    addTeamMember,
    createCompany,
    createTeam,
    renderCompanyDashboard,
    renderCompanyMembers,
    renderCompanySetup,
    renderTeamDetail,
    renderTeams
};

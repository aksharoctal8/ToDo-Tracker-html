"use strict";

const mongoose = require("mongoose");
const Company = require("../models/Company");
const Team = require("../models/Team");
const TeamMember = require("../models/TeamMember");
const User = require("../models/User");
const Task = require("../models/Task");
const Project = require("../models/Project");
const AppError = require("../utils/AppError");

const VALID_ROLES = new Set(["Company Owner", "Company Admin", "Team Leader", "Team Member"]);

function parseString(value, fieldName, { required = false, maxLength = 500 } = {}) {
    if (value === undefined || value === null) {
        if (required) {
            throw new AppError(`${fieldName} is required.`, 400);
        }
        return "";
    }
    if (typeof value !== "string") {
        throw new AppError(`${fieldName} must be text.`, 400);
    }
    const text = value.trim();
    if (required && !text) {
        throw new AppError(`${fieldName} is required.`, 400);
    }
    if (text.length > maxLength) {
        throw new AppError(`${fieldName} cannot exceed ${maxLength} characters.`, 400);
    }
    return text;
}

function parseCompanyInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AppError("Company details are required.", 400);
    }

    return {
        name: parseString(input.name, "Company name", { required: true, maxLength: 120 }),
        email: parseString(input.email, "Company email", { required: true, maxLength: 254 }),
        phone: parseString(input.phone, "Company phone", { maxLength: 30 }),
        address: parseString(input.address, "Company address", { maxLength: 300 }),
        description: parseString(input.description, "Company description", { maxLength: 1000 }),
        website: parseString(input.website, "Company website", { maxLength: 255 }),
        logo: parseString(input.logo, "Company logo", { maxLength: 2048 })
    };
}

function parseTeamInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AppError("Team details are required.", 400);
    }

    return {
        name: parseString(input.name, "Team name", { required: true, maxLength: 120 }),
        description: parseString(input.description, "Team description", { maxLength: 1000 })
    };
}

function validObjectId(value, fieldName) {
    if (typeof value !== "string" || !mongoose.isValidObjectId(value)) {
        throw new AppError(`Choose a valid ${fieldName}.`, 400);
    }
    return new mongoose.Types.ObjectId(value);
}

async function getCompanyForUser(userId) {
    const user = await User.findById(userId).select("company").populate("company").lean();
    return user && user.company ? user.company : null;
}

async function getCompanyDashboard(userId) {
    const user = await User.findById(userId).select("company").lean();
    if (!user || !user.company) {
        return {
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
    }

    const companyId = user.company;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const [company, teams, teamMembers, taskStats] = await Promise.all([
        Company.findById(companyId).lean(),
        Team.find({ company: companyId }).sort({ name: 1 }).populate("leader", "name email").lean(),
        TeamMember.find({ company: companyId }).populate("user", "name email").populate("team", "name").sort({ createdAt: -1 }).lean(),
        Task.aggregate([
            { $match: { company: companyId } },
            {
                $group: {
                    _id: null,
                    totalTasks: { $sum: 1 },
                    pendingTasks: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                    inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "progress"] }, 1, 0] } },
                    completedTasks: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    overdueTasks: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ["$dueDate", null] },
                                        { $lt: ["$dueDate", today] },
                                        { $ne: ["$status", "completed"] },
                                        { $ne: ["$status", "cancelled"] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ])
    ]);

    const stats = taskStats[0] || {
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        overdueTasks: 0
    };

    return {
        company,
        teams,
        teamMembers,
        stats: {
            totalTeams: teams.length,
            totalMembers: teamMembers.length,
            totalTasks: stats.totalTasks,
            pendingTasks: stats.pendingTasks,
            inProgressTasks: stats.inProgressTasks,
            completedTasks: stats.completedTasks,
            overdueTasks: stats.overdueTasks
        }
    };
}

async function createCompany(input, userId) {
    const user = await User.findById(userId).select("company").lean();
    if (user && user.company) {
        throw new AppError("You already belong to a company. Contact your company admin for changes.", 400);
    }

    const data = parseCompanyInput(input);
    const emailExists = await Company.exists({ email: data.email.toLowerCase() });
    if (emailExists) {
        throw new AppError("This company email is already registered.", 409);
    }

    const company = await Company.create({
        ...data,
        email: data.email.toLowerCase(),
        owner: userId,
        status: "active"
    });

    const updatedUser = await User.findById(userId);
    updatedUser.company = company._id;
    await updatedUser.save();

    await TeamMember.create({
        user: userId,
        team: null,
        company: company._id,
        role: "Company Owner",
        status: "active"
    });

    return company;
}

async function getTeamsForCompany(userId) {
    const company = await getCompanyForUser(userId);
    if (!company) {
        return [];
    }

    const teams = await Team.find({ company: company._id })
        .sort({ name: 1 })
        .populate("leader", "name email")
        .lean();

    return teams.map(team => ({
        ...team,
        id: String(team._id),
        leaderName: team.leader ? team.leader.name : "Unassigned"
    }));
}

async function createTeam(input, userId) {
    const data = parseTeamInput(input);
    const company = await getCompanyForUser(userId);
    if (!company) {
        throw new AppError("Create a company before creating teams.", 400);
    }

    const team = await Team.create({
        name: data.name,
        description: data.description,
        company: company._id,
        leader: userId,
        createdBy: userId,
        status: "active"
    });

    await TeamMember.create({
        user: userId,
        team: team._id,
        company: company._id,
        role: "Team Leader",
        status: "active"
    });

    return team;
}

async function getTeam(teamId, userId) {
    const company = await getCompanyForUser(userId);
    if (!company) {
        throw new AppError("You are not part of a company.", 400);
    }
    const id = validObjectId(teamId, "team");
    const team = await Team.findOne({ _id: id, company: company._id })
        .populate("leader", "name email")
        .populate("createdBy", "name email")
        .lean();

    if (!team) {
        throw new AppError("Team not found or unavailable to your company.", 404);
    }

    const members = await TeamMember.find({ company: company._id, team: id })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .lean();

    return { team, members };
}

async function addMemberToTeam(input, userId) {
    const company = await getCompanyForUser(userId);
    if (!company) {
        throw new AppError("Create a company before adding team members.", 400);
    }

    const teamId = input.teamId ? validObjectId(input.teamId, "team") : null;
    const team = teamId ? await Team.findOne({ _id: teamId, company: company._id }).lean() : null;
    const email = parseString(input.email, "Member email", { required: true, maxLength: 254 });
    const role = VALID_ROLES.has(input.role) ? input.role : "Team Member";

    const memberUser = await User.findOne({ email: email.toLowerCase() }).select("_id company name email").lean();
    if (!memberUser) {
        throw new AppError("No user exists with that email address.", 404);
    }

    if (String(memberUser._id) === String(userId)) {
        throw new AppError("The team leader cannot add themselves as a new member.", 400);
    }

    const existingMembership = await TeamMember.findOne({ user: memberUser._id, company: company._id }).lean();
    if (existingMembership && !team) {
        throw new AppError("That user is already part of your company.", 400);
    }

    if (team && existingMembership && String(existingMembership.team) === String(team._id)) {
        throw new AppError("That user is already a member of this team.", 400);
    }

    if (team && memberUser.company && String(memberUser.company) !== String(company._id)) {
        throw new AppError("That user belongs to a different company.", 400);
    }

    if (!team && memberUser.company && String(memberUser.company) !== String(company._id)) {
        throw new AppError("That user belongs to a different company.", 400);
    }

    if (memberUser.company && String(memberUser.company) !== String(company._id)) {
        throw new AppError("That user belongs to a different company.", 400);
    }

    const memberRecord = await TeamMember.create({
        user: memberUser._id,
        team: team ? team._id : null,
        company: company._id,
        role,
        status: "active"
    });

    if (!memberUser.company) {
        await User.findByIdAndUpdate(memberUser._id, { company: company._id });
    }

    return memberRecord;
}

async function getCompanyMembers(userId) {
    const company = await getCompanyForUser(userId);
    if (!company) {
        return [];
    }

    return TeamMember.find({ company: company._id })
        .populate("user", "name email")
        .populate("team", "name")
        .sort({ createdAt: -1 })
        .lean();
}

module.exports = {
    addMemberToTeam,
    createCompany,
    createTeam,
    getCompanyDashboard,
    getCompanyForUser,
    getCompanyMembers,
    getTeam,
    getTeamsForCompany,
    parseCompanyInput,
    parseTeamInput
};

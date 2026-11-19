"use strict";

const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const STATUSES = new Set(["Planning", "In progress", "Completed"]);

function objectId(value, message) {
    if (typeof value !== "string" || !mongoose.isValidObjectId(value)) {
        throw new AppError(message, 400);
    }
    return new mongoose.Types.ObjectId(value);
}

function parseDate(value, field) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new AppError(`Enter a valid ${field}.`, 400);
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new AppError(`Enter a valid ${field}.`, 400);
    }
    return date;
}

function parseProjectInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AppError("Project details are required.", 400);
    }

    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (input.description !== undefined && input.description !== null && typeof input.description !== "string") {
        throw new AppError("Project description must be text.", 400);
    }
    const description = typeof input.description === "string" ? input.description.trim() : "";
    if (!name || name.length > 120) throw new AppError("Project name is required and must be 120 characters or fewer.", 400);
    if (description.length > 1000) throw new AppError("Project description cannot exceed 1000 characters.", 400);
    if (input.status !== undefined && typeof input.status !== "string") {
        throw new AppError("Choose a valid project status.", 400);
    }
    const status = input.status || "Planning";
    if (!STATUSES.has(status)) throw new AppError("Choose a valid project status.", 400);

    const startDate = parseDate(input.startDate, "start date");
    const dueDate = parseDate(input.dueDate, "due date");
    if (startDate && dueDate && startDate > dueDate) {
        throw new AppError("The project start date cannot be after its due date.", 400);
    }

    let members = input.members === undefined || input.members === null || input.members === ""
        ? []
        : Array.isArray(input.members) ? input.members : [input.members];
    if (members.some(member => typeof member !== "string")) throw new AppError("Choose valid project members.", 400);
    members = [...new Set(members)].filter(Boolean);
    if (members.length > 100) throw new AppError("A project can have up to 100 members.", 400);

    return { name, description, status, startDate, dueDate, memberIds: members };
}

async function validateMembers(memberIds, ownerId) {
    const ids = memberIds.map(memberId => objectId(memberId, "Choose a valid project member."));
    const owner = String(ownerId);
    const withoutOwner = ids.filter(id => String(id) !== owner);
    if (!withoutOwner.length) return [];

    const activeUsers = await User.find({ _id: { $in: withoutOwner }, isActive: true })
        .select("_id")
        .lean();
    if (activeUsers.length !== withoutOwner.length) {
        throw new AppError("One or more selected project members are invalid or inactive.", 400);
    }
    return withoutOwner;
}

async function getMemberChoices(ownerId) {
    return User.find({ _id: { $ne: ownerId }, isActive: true })
        .select("name email")
        .sort({ name: 1 })
        .lean();
}

function projectAccessQuery(projectId, userId) {
    return { _id: projectId, $or: [{ owner: userId }, { members: userId }] };
}

async function listProjects(userId) {
    const projects = await Project.find({ $or: [{ owner: userId }, { members: userId }] })
        .sort({ updatedAt: -1, name: 1 })
        .populate("owner", "name email")
        .populate("members", "name email")
        .lean();
    const projectIds = projects.map(project => project._id);
    const taskCounts = projectIds.length ? await Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
            $group: {
                _id: "$project",
                taskCount: { $sum: 1 },
                completedTaskCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
            }
        }
    ]) : [];
    const countsByProject = new Map(taskCounts.map(row => [String(row._id), row]));

    return projects.map(project => {
        const counts = countsByProject.get(String(project._id)) || { taskCount: 0, completedTaskCount: 0 };
        return toProjectView(project, counts, userId);
    });
}

async function getProjectMetrics(userId) {
    return listProjects(userId);
}

function toProjectView(project, counts = { taskCount: 0, completedTaskCount: 0 }, userId = null) {
    const progress = counts.taskCount ? Math.round(counts.completedTaskCount / counts.taskCount * 100) : 0;
    return {
        id: String(project._id),
        name: project.name,
        description: project.description || "",
        status: project.status,
        startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "",
        dueDate: project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : "",
        ownerId: String(project.owner?._id || project.owner),
        ownerName: project.owner?.name || "",
        members: (project.members || []).map(member => ({
            id: String(member._id || member),
            name: member.name || "",
            email: member.email || ""
        })),
        memberIds: (project.members || []).map(member => String(member._id || member)),
        taskCount: counts.taskCount,
        completedTaskCount: counts.completedTaskCount,
        progress,
        updatedAt: project.updatedAt ? new Date(project.updatedAt).toISOString() : "",
        canManage: userId ? String(project.owner?._id || project.owner) === String(userId) : false
    };
}

async function getProject(projectId, userId) {
    const id = objectId(projectId, "Invalid project identifier.");
    const project = await Project.findOne(projectAccessQuery(id, userId))
        .populate("owner", "name email")
        .populate("members", "name email")
        .lean();
    if (!project) throw new AppError("Project not found.", 404);
    const [counts] = await Task.aggregate([
        { $match: { project: project._id } },
        {
            $group: {
                _id: "$project",
                taskCount: { $sum: 1 },
                completedTaskCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
            }
        }
    ]);
    return toProjectView(project, counts || { taskCount: 0, completedTaskCount: 0 }, userId);
}

async function createProject(input, ownerId) {
    const data = parseProjectInput(input);
    const members = await validateMembers(data.memberIds, ownerId);
    const project = await Project.create({
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        dueDate: data.dueDate,
        owner: ownerId,
        members
    });
    return String(project._id);
}

async function updateProject(projectId, input, ownerId) {
    const id = objectId(projectId, "Invalid project identifier.");
    const project = await Project.findOne({ _id: id, owner: ownerId });
    if (!project) throw new AppError("Project not found or you do not have permission to edit it.", 404);
    const data = parseProjectInput(input);
    const members = await validateMembers(data.memberIds, ownerId);
    Object.assign(project, {
        name: data.name,
        description: data.description,
        status: data.status,
        startDate: data.startDate,
        dueDate: data.dueDate,
        members
    });
    await project.save();
}

async function deleteProject(projectId, ownerId) {
    const id = objectId(projectId, "Invalid project identifier.");
    const project = await Project.findOne({ _id: id, owner: ownerId });
    if (!project) throw new AppError("Project not found or you do not have permission to delete it.", 404);

    await Task.updateMany({ project: id }, { $set: { project: null } });
    await project.deleteOne();
}

module.exports = {
    STATUSES,
    createProject,
    deleteProject,
    getMemberChoices,
    getProject,
    getProjectMetrics,
    listProjects,
    parseProjectInput,
    toProjectView,
    updateProject,
    validateMembers
};

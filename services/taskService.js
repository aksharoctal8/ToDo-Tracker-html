"use strict";

const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const STATUSES = new Set(["pending", "progress", "completed", "cancelled"]);
const PRIORITIES = new Set(["low", "medium", "high", "critical"]);
const SORTS = new Set(["updatedAt", "createdAt", "dueDate", "priority", "title"]);
const PAGE_SIZE = 20;

function visibleTaskQuery(userId) {
    return { $or: [{ createdBy: userId }, { assignedTo: userId }] };
}

function parseTaskInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        throw new AppError("Task details are required.", 400);
    }

    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!title || title.length > 120) throw new AppError("Task title is required and must be 120 characters or fewer.", 400);

    if (input.description !== undefined && input.description !== null && typeof input.description !== "string") {
        throw new AppError("Task description must be text.", 400);
    }
    if (input.category !== undefined && input.category !== null && typeof input.category !== "string") {
        throw new AppError("Task category must be text.", 400);
    }
    if (input.tags !== undefined && input.tags !== null && typeof input.tags !== "string" && !Array.isArray(input.tags)) {
        throw new AppError("Task tags must be text or a list of text values.", 400);
    }
    if (input.projectId !== undefined && input.projectId !== null && input.projectId !== "" && typeof input.projectId !== "string") {
        throw new AppError("Choose a valid project.", 400);
    }
    if (input.assignedTo !== undefined && input.assignedTo !== null && input.assignedTo !== "" && typeof input.assignedTo !== "string") {
        throw new AppError("Choose a valid assignee.", 400);
    }

    const description = typeof input.description === "string" ? input.description.trim() : "";
    const category = typeof input.category === "string" ? input.category.trim() : "";
    if (description.length > 2000) throw new AppError("Task description cannot exceed 2000 characters.", 400);
    if (category.length > 60) throw new AppError("Category cannot exceed 60 characters.", 400);

    const priority = input.priority === undefined || input.priority === null || input.priority === "" ? "medium" : input.priority;
    const status = input.status === undefined || input.status === null || input.status === "" ? "pending" : input.status;
    if (!PRIORITIES.has(priority)) throw new AppError("Choose a valid task priority.", 400);
    if (!STATUSES.has(status)) throw new AppError("Choose a valid task status.", 400);

    let dueDate = null;
    if (input.dueDate !== undefined && input.dueDate !== null && input.dueDate !== "") {
        if (typeof input.dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) {
            throw new AppError("Enter a valid due date.", 400);
        }
        dueDate = new Date(`${input.dueDate}T00:00:00.000Z`);
        if (Number.isNaN(dueDate.getTime()) || dueDate.toISOString().slice(0, 10) !== input.dueDate) {
            throw new AppError("Enter a valid due date.", 400);
        }
    }

    const rawTags = Array.isArray(input.tags) ? input.tags : typeof input.tags === "string" ? input.tags.split(",") : [];
    if (rawTags.some(tag => typeof tag !== "string")) throw new AppError("Every task tag must be text.", 400);
    const tags = rawTags.map(tag => tag.trim()).filter(Boolean);
    if (tags.length > 20 || tags.some(tag => tag.length > 40)) {
        throw new AppError("Tasks can have up to 20 tags, each 40 characters or fewer.", 400);
    }

    return {
        title,
        description,
        category,
        priority,
        status,
        dueDate,
        tags: [...new Set(tags)],
        projectId: input.projectId || "",
        assignedToId: input.assignedTo || ""
    };
}

function validObjectId(value, message) {
    if (typeof value !== "string" || !mongoose.isValidObjectId(value)) throw new AppError(message, 400);
    return new mongoose.Types.ObjectId(value);
}

async function getProjectsForUser(userId) {
    return Project.find({ $or: [{ owner: userId }, { members: userId }] })
        .sort({ name: 1 })
        .select("name description dueDate status owner members")
        .populate("owner", "name email")
        .populate("members", "name email")
        .lean();
}

async function getAssignableUsers(userId, projectId) {
    let allowedIds = [userId];
    if (projectId) {
        const project = await Project.findOne({
            _id: projectId,
            $or: [{ owner: userId }, { members: userId }]
        }).select("owner members").lean();
        if (!project) throw new AppError("That project is not available in your workspace.", 400);
        allowedIds = [...new Set([userId, String(project.owner), ...project.members.map(String)])];
    }
    return User.find({ _id: { $in: allowedIds }, isActive: true })
        .select("name email")
        .sort({ name: 1 })
        .lean();
}

async function validateReferences(data, userId) {
    let project = null;
    if (data.projectId) {
        const projectId = validObjectId(data.projectId, "Choose a valid project.");
        project = await Project.findOne({
            _id: projectId,
            $or: [{ owner: userId }, { members: userId }]
        }).select("owner members").lean();
        if (!project) throw new AppError("That project is not available in your workspace.", 400);
    }

    let assignedTo = null;
    if (data.assignedToId) {
        assignedTo = validObjectId(data.assignedToId, "Choose a valid assignee.");
        const allowedIds = project
            ? [...new Set([String(userId), String(project.owner), ...project.members.map(String)])]
            : [String(userId)];
        if (!allowedIds.includes(String(assignedTo))) {
            throw new AppError("The assignee must be you or a member of the selected project.", 400);
        }
        const activeUser = await User.exists({ _id: assignedTo, isActive: true });
        if (!activeUser) throw new AppError("That assignee is not an active user.", 400);
    }

    return {
        project: project ? project._id : null,
        assignedTo
    };
}

function taskAccessQuery(taskId, userId) {
    return {
        _id: taskId,
        $or: [{ createdBy: userId }, { assignedTo: userId }]
    };
}

async function createTask(input, user) {
    const data = parseTaskInput(input);
    const references = await validateReferences(data, user._id);
    return Task.create({
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate,
        completedAt: data.status === "completed" ? new Date() : null,
        tags: data.tags,
        project: references.project,
        assignedTo: references.assignedTo,
        createdBy: user._id
    });
}

async function getTaskForUser(taskId, userId) {
    const id = validObjectId(taskId, "Invalid task identifier.");
    const task = await Task.findOne(taskAccessQuery(id, userId))
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email");
    if (!task) throw new AppError("Task not found.", 404);
    return task;
}

async function updateTask(taskId, input, userId) {
    const task = await getTaskForUser(taskId, userId);
    const data = parseTaskInput(input);
    const references = await validateReferences(data, userId);
    Object.assign(task, {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate,
        tags: data.tags,
        project: references.project,
        assignedTo: references.assignedTo
    });
    if (data.status === "completed") {
        task.completedAt = task.completedAt || task.updatedAt || new Date();
    } else {
        task.completedAt = null;
    }
    await task.save();
    return task;
}

async function changeStatus(taskId, status, userId) {
    if (typeof status !== "string" || !STATUSES.has(status)) throw new AppError("Choose a valid task status.", 400);
    const id = validObjectId(taskId, "Invalid task identifier.");
    const task = await Task.findOne(taskAccessQuery(id, userId));
    if (!task) throw new AppError("Task not found.", 404);
    task.status = status;
    task.completedAt = status === "completed"
        ? task.completedAt || task.updatedAt || new Date()
        : null;
    await task.save();
    return task;
}

async function deleteTask(taskId, userId) {
    const id = validObjectId(taskId, "Invalid task identifier.");
    const task = await Task.findOneAndDelete({ _id: id, createdBy: userId });
    if (!task) throw new AppError("Task not found or you do not have permission to delete it.", 404);
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function startOfToday() {
    const date = new Date();
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dateString(date) {
    return date ? new Date(date).toISOString().slice(0, 10) : "";
}

function toTaskView(task) {
    const row = task.toObject ? task.toObject() : task;
    return {
        id: String(row._id),
        title: row.title,
        description: row.description || "",
        category: row.category || "",
        priority: row.priority,
        status: row.status,
        dueDate: dateString(row.dueDate),
        dueDateInput: dateString(row.dueDate),
        completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : "",
        tags: row.tags || [],
        projectId: row.project?._id ? String(row.project._id) : row.project ? String(row.project) : "",
        projectName: row.project?.name || "",
        assignedToId: row.assignedTo?._id ? String(row.assignedTo._id) : row.assignedTo ? String(row.assignedTo) : "",
        assignTo: row.assignedTo?.name || "",
        createdBy: row.createdBy?._id ? String(row.createdBy._id) : row.createdBy ? String(row.createdBy) : "",
        overdue: Boolean(row.dueDate && row.dueDate < startOfToday() && !["completed", "cancelled"].includes(row.status)),
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : "",
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : ""
    };
}

function buildTaskQuery(userId, filters = {}) {
    const query = visibleTaskQuery(userId);
    if (STATUSES.has(filters.status)) query.status = filters.status;
    if (PRIORITIES.has(filters.priority)) query.priority = filters.priority;
    if (typeof filters.category === "string" && filters.category.trim()) {
        query.category = filters.category.trim().slice(0, 60);
    }
    if (typeof filters.projectId === "string" && filters.projectId.trim()) {
        query.project = validObjectId(filters.projectId.trim(), "Choose a valid project.");
    }
    if (typeof filters.search === "string" && filters.search.trim()) {
        const pattern = new RegExp(escapeRegex(filters.search.trim().slice(0, 100)), "i");
        query.$and = query.$and || [];
        query.$and.push({ $or: [{ title: pattern }, { description: pattern }, { category: pattern }, { tags: pattern }] });
    }
    const today = startOfToday();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    if (filters.due === "today") query.dueDate = { $gte: today, $lt: tomorrow };
    if (filters.due === "week") query.dueDate = { $gte: today, $lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) };
    if (filters.due === "overdue") {
        query.dueDate = { $lt: today };
        query.$and = query.$and || [];
        query.$and.push({ status: { $nin: ["completed", "cancelled"] } });
    }
    if (filters.due === "none") query.dueDate = null;
    return query;
}

function validateFilters(filters) {
    const allowed = ["search", "status", "priority", "category", "projectId", "due", "sort", "direction", "page"];
    for (const field of allowed) {
        if (filters[field] !== undefined && typeof filters[field] !== "string") {
            throw new AppError(`Invalid task filter: ${field}.`, 400);
        }
    }
    if (filters.status && !STATUSES.has(filters.status)) throw new AppError("Choose a valid task status filter.", 400);
    if (filters.priority && !PRIORITIES.has(filters.priority)) throw new AppError("Choose a valid task priority filter.", 400);
    if (filters.due && !["today", "week", "overdue", "none"].includes(filters.due)) {
        throw new AppError("Choose a valid due-date filter.", 400);
    }
    if (filters.sort && !SORTS.has(filters.sort)) throw new AppError("Choose a valid task sort order.", 400);
    if (filters.direction && !["asc", "desc"].includes(filters.direction)) {
        throw new AppError("Choose a valid sort direction.", 400);
    }
    if (filters.page && (!/^\d+$/.test(filters.page) || Number(filters.page) < 1)) {
        throw new AppError("Choose a valid task page.", 400);
    }
    return filters;
}

async function listTasks(userId, filters = {}) {
    filters = validateFilters(filters);
    const query = buildTaskQuery(userId, filters);
    const total = await Task.countDocuments(query);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const requestedPage = Number.parseInt(filters.page, 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pages) : 1;
    const sortBy = SORTS.has(filters.sort) ? filters.sort : "updatedAt";
    const direction = filters.direction === "asc" ? 1 : -1;
    const sort = sortBy === "priority"
        ? { _priorityOrder: direction, updatedAt: -1 }
        : { [sortBy]: direction, _id: -1 };
    const pipeline = [{ $match: query }];
    if (sortBy === "priority") {
        pipeline.push({
            $addFields: {
                _priorityOrder: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$priority", "critical"] }, then: 4 },
                            { case: { $eq: ["$priority", "high"] }, then: 3 },
                            { case: { $eq: ["$priority", "medium"] }, then: 2 }
                        ],
                        default: 1
                    }
                }
            }
        });
    }
    pipeline.push({ $sort: sort }, { $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE });
    const rows = await Task.aggregate(pipeline);
    const tasks = await Task.populate(rows, [
        { path: "project", select: "name" },
        { path: "assignedTo", select: "name email" }
    ]);
    const categories = await Task.distinct("category", visibleTaskQuery(userId));
    const projects = await getProjectsForUser(userId);
    const assignees = await getAssignableUsers(userId, filters.projectId || "");
    return {
        tasks: tasks.map(toTaskView),
        categories: categories.filter(Boolean).sort((a, b) => a.localeCompare(b)),
        projects,
        assignees,
        pagination: { page, pages, total, pageSize: PAGE_SIZE },
        filters: {
            search: typeof filters.search === "string" ? filters.search.trim().slice(0, 100) : "",
            status: STATUSES.has(filters.status) ? filters.status : "",
            priority: PRIORITIES.has(filters.priority) ? filters.priority : "",
            category: typeof filters.category === "string" ? filters.category.trim().slice(0, 60) : "",
            projectId: typeof filters.projectId === "string" ? filters.projectId.trim() : "",
            due: ["today", "week", "overdue", "none"].includes(filters.due) ? filters.due : "",
            sort: sortBy,
            direction: direction === 1 ? "asc" : "desc"
        }
    };
}

async function getTaskSummary(userId) {
    const today = startOfToday();
    const rows = await Task.aggregate([
        { $match: visibleTaskQuery(userId) },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                inProgress: { $sum: { $cond: [{ $eq: ["$status", "progress"] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                overdue: {
                    $sum: {
                        $cond: [
                            { $and: [{ $lt: ["$dueDate", today] }, { $not: [{ $in: ["$status", ["completed", "cancelled"]] }] }] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
    const result = rows[0] || { total: 0, completed: 0, inProgress: 0, pending: 0, cancelled: 0, overdue: 0 };
    result.completionRate = result.total ? Math.round(result.completed / result.total * 100) : 0;
    result.pendingRate = result.total ? Math.round(result.pending / result.total * 100) : 0;
    return result;
}

async function getTaskAnalytics(userId) {
    const today = startOfToday();
    const [distribution] = await Task.aggregate([
        { $match: visibleTaskQuery(userId) },
        {
            $facet: {
                statuses: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
                priorities: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
                overdueByPriority: [
                    {
                        $match: {
                            dueDate: { $lt: today },
                            status: { $nin: ["completed", "cancelled"] }
                        }
                    },
                    { $group: { _id: "$priority", count: { $sum: 1 } } }
                ]
            }
        }
    ]);

    const countByValue = rows => new Map(rows.map(row => [row._id, row.count]));
    const statusCounts = countByValue(distribution?.statuses || []);
    const priorityCounts = countByValue(distribution?.priorities || []);
    const overdueCounts = countByValue(distribution?.overdueByPriority || []);
    const total = (distribution?.statuses || []).reduce((sum, row) => sum + row.count, 0);
    const toDistribution = (definitions, counts) => definitions.map(([key, label, className]) => {
        const count = counts.get(key) || 0;
        return {
            key,
            label,
            count,
            percentage: total ? Math.round(count / total * 100) : 0,
            className
        };
    });
    const priorities = [
        ["low", "Low", "bar-low"],
        ["medium", "Medium", "bar-medium"],
        ["high", "High", "bar-high"],
        ["critical", "Critical", "bar-critical"]
    ];

    return {
        statuses: toDistribution([
            ["pending", "Pending", "bar-pending"],
            ["progress", "In progress", "bar-progress"],
            ["completed", "Completed", "bar-completed"],
            ["cancelled", "Cancelled", "bar-cancelled"]
        ], statusCounts),
        priorities: toDistribution(priorities, priorityCounts),
        overdueByPriority: priorities.map(([key, label, className]) => ({
            key,
            label,
            count: overdueCounts.get(key) || 0,
            className
        }))
    };
}

async function getRecentTasks(userId, limit = 5) {
    const rows = await Task.find(visibleTaskQuery(userId))
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate("project", "name")
        .populate("assignedTo", "name");
    return rows.map(toTaskView);
}

async function getWeeklyCompletion(userId) {
    const today = startOfToday();
    const start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    const counts = await Task.aggregate([
        {
            $match: {
                $and: [
                    visibleTaskQuery(userId),
                    { status: "completed" },
                    {
                        $or: [
                            { completedAt: { $gte: start, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } },
                            { completedAt: null, updatedAt: { $gte: start, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) } }
                        ]
                    }
                ]
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: { $ifNull: ["$completedAt", "$updatedAt"] },
                        timezone: "UTC"
                    }
                },
                completed: { $sum: 1 }
            }
        }
    ]);
    const byDate = new Map(counts.map(row => [row._id, row.completed]));
    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
        return {
            label: new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(date),
            completed: byDate.get(date.toISOString().slice(0, 10)) || 0
        };
    });
}

module.exports = {
    STATUSES,
    PRIORITIES,
    buildTaskQuery,
    createTask,
    changeStatus,
    deleteTask,
    getAssignableUsers,
    getProjectsForUser,
    getRecentTasks,
    getTaskForUser,
    getTaskAnalytics,
    getTaskSummary,
    getWeeklyCompletion,
    listTasks,
    parseTaskInput,
    toTaskView,
    updateTask,
    validateFilters,
    visibleTaskQuery
};

"use strict";

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Task title is required."],
        trim: true,
        maxlength: [120, "Task title cannot exceed 120 characters."]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, "Task description cannot exceed 2000 characters."]
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null,
        index: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        default: null,
        index: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        default: null,
        index: true
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "medium",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "progress", "completed", "cancelled"],
        default: "pending",
        required: true,
        index: true
    },
    category: {
        type: String,
        trim: true,
        maxlength: [60, "Category cannot exceed 60 characters."]
    },
    dueDate: Date,
    completedAt: {
        type: Date,
        default: null
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [40, "Tags cannot exceed 40 characters."]
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Task creator is required."],
        index: true
    }
}, {
    timestamps: true
});

taskSchema.index({ createdBy: 1, status: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1, completedAt: 1 });

module.exports = mongoose.model("Task", taskSchema);

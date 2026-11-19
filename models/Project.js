"use strict";

const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Project name is required."],
        trim: true,
        maxlength: [120, "Project name cannot exceed 120 characters."]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, "Project description cannot exceed 1000 characters."]
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Project owner is required."],
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
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    status: {
        type: String,
        enum: ["Planning", "In progress", "Completed"],
        default: "Planning",
        required: true
    },
    startDate: Date,
    dueDate: Date
}, {
    timestamps: true
});

projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ members: 1 });

projectSchema.pre("validate", function validateDateRange() {
    if (this.startDate && this.dueDate && this.startDate > this.dueDate) {
        this.invalidate("dueDate", "Project due date cannot be before its start date.");
    }
});

module.exports = mongoose.model("Project", projectSchema);

"use strict";

const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Team name is required."],
        trim: true,
        maxlength: [120, "Team name cannot exceed 120 characters."]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, "Team description cannot exceed 1000 characters."]
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, "Company is required."],
        index: true
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Team leader is required."],
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Creator is required."],
        index: true
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
        required: true
    }
}, {
    timestamps: true
});

teamSchema.index({ company: 1, name: 1 }, { unique: true });
teamSchema.index({ company: 1, leader: 1 });

module.exports = mongoose.model("Team", teamSchema);

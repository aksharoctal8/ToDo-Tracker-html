"use strict";

const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Member user is required."],
        index: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        default: null,
        index: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, "Company is required."],
        index: true
    },
    role: {
        type: String,
        enum: ["Company Owner", "Company Admin", "Team Leader", "Team Member"],
        default: "Team Member",
        required: true
    },
    status: {
        type: String,
        enum: ["active", "pending"],
        default: "active",
        required: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

teamMemberSchema.index({ team: 1, user: 1 }, { unique: true });
teamMemberSchema.index({ company: 1, user: 1 });

module.exports = mongoose.model("TeamMember", teamMemberSchema);

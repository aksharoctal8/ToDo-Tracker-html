"use strict";

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Notification recipient is required."],
        index: true
    },
    title: {
        type: String,
        required: [true, "Notification title is required."],
        trim: true,
        maxlength: [160, "Notification title cannot exceed 160 characters."]
    },
    message: {
        type: String,
        required: [true, "Notification message is required."],
        trim: true,
        maxlength: [1000, "Notification message cannot exceed 1000 characters."]
    },
    type: {
        type: String,
        enum: ["task", "project", "reminder", "system"],
        default: "system",
        required: true
    },
    isRead: {
        type: Boolean,
        default: false,
        required: true
    }
}, {
    timestamps: {
        createdAt: true,
        updatedAt: false
    }
});

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

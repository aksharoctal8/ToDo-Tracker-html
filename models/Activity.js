"use strict";

const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Activity user is required."],
        index: true
    },
    action: {
        type: String,
        enum: ["created", "updated", "deleted", "completed", "assigned"],
        required: [true, "Activity action is required."]
    },
    entityType: {
        type: String,
        enum: ["Task", "Project", "User"],
        required: [true, "Activity entity type is required."]
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "entityType",
        required: [true, "Activity entity ID is required."]
    },
    description: {
        type: String,
        required: [true, "Activity description is required."],
        trim: true,
        maxlength: [1000, "Activity description cannot exceed 1000 characters."]
    }
}, {
    timestamps: {
        createdAt: true,
        updatedAt: false
    }
});

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model("Activity", activitySchema);

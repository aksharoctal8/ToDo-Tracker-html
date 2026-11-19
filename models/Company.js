"use strict";

const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Company name is required."],
        trim: true,
        maxlength: [120, "Company name cannot exceed 120 characters."]
    },
    email: {
        type: String,
        required: [true, "Company email is required."],
        trim: true,
        lowercase: true,
        maxlength: [254, "Company email cannot exceed 254 characters."],
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid company email address."]
    },
    phone: {
        type: String,
        trim: true,
        maxlength: [30, "Company phone cannot exceed 30 characters."]
    },
    address: {
        type: String,
        trim: true,
        maxlength: [300, "Company address cannot exceed 300 characters."]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, "Company description cannot exceed 1000 characters."]
    },
    logo: {
        type: String,
        trim: true,
        maxlength: [2048, "Company logo URL cannot exceed 2048 characters."]
    },
    website: {
        type: String,
        trim: true,
        maxlength: [255, "Website cannot exceed 255 characters."]
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Company owner is required."],
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
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

companySchema.index({ owner: 1 }, { unique: true });
companySchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("Company", companySchema);

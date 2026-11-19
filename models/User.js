"use strict";

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const PASSWORD_SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required."],
        trim: true,
        maxlength: [80, "Name cannot exceed 80 characters."]
    },
    email: {
        type: String,
        required: [true, "Email is required."],
        trim: true,
        lowercase: true,
        maxlength: [254, "Email cannot exceed 254 characters."],
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Password is required."],
        validate: {
            validator(value) {
                return typeof value === "string"
                    && value.length >= 8
                    && Buffer.byteLength(value, "utf8") <= 72;
            },
            message: "Password must be at least 8 characters and no more than 72 UTF-8 bytes."
        },
        select: false
    },
    profileImage: {
        type: String,
        trim: true,
        maxlength: [2048, "Profile image URL cannot exceed 2048 characters."]
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        default: null,
        index: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    tokenVersion: {
        type: Number,
        default: 0,
        select: false
    }
}, {
    timestamps: true
});

userSchema.pre("save", async function hashModifiedPassword() {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, PASSWORD_SALT_ROUNDS);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.set("toJSON", {
    transform(_document, result) {
        delete result.password;
        delete result.tokenVersion;
        delete result.__v;
        return result;
    }
});

module.exports = mongoose.model("User", userSchema);

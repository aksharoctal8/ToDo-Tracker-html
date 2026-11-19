"use strict";

const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");
const {
    TOKEN_AUDIENCE,
    TOKEN_ISSUER,
    TOKEN_LIFETIME_SECONDS
} = require("../config/auth");
const AppError = require("../utils/AppError");

const dummyPasswordHash = bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);

function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage || "",
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

function createAccessToken(user) {
    return jwt.sign(
        { ver: user.tokenVersion || 0 },
        env.jwtSecret,
        {
            algorithm: "HS256",
            audience: TOKEN_AUDIENCE,
            expiresIn: TOKEN_LIFETIME_SECONDS,
            issuer: TOKEN_ISSUER,
            subject: user.id
        }
    );
}

async function register({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.exists({ email: normalizedEmail });
    if (existingUser) {
        throw new AppError("An account with this email already exists.", 409);
    }

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password
    });
    return {
        user: publicUser(user),
        token: createAccessToken(user)
    };
}

async function login({ email, password }) {
    const user = await User.findOne({ email: email.trim().toLowerCase() })
        .select("+password +tokenVersion");
    if (!user) {
        await bcrypt.compare(password, await dummyPasswordHash);
        throw new AppError("Email or password is incorrect.", 401);
    }

    const validPassword = await user.comparePassword(password);
    if (!validPassword || !user.isActive) {
        throw new AppError("Email or password is incorrect.", 401);
    }

    return {
        user: publicUser(user),
        token: createAccessToken(user)
    };
}

async function changePassword(user, { currentPassword, newPassword }) {
    const account = await User.findById(user.id).select("+password +tokenVersion");
    if (!account || !account.isActive) {
        throw new AppError("Your account is no longer available.", 401);
    }
    if (!(await account.comparePassword(currentPassword))) {
        throw new AppError("Your current password is incorrect.", 400);
    }

    account.password = newPassword;
    account.tokenVersion += 1;
    await account.save();
    return {
        user: publicUser(account),
        token: createAccessToken(account)
    };
}

module.exports = {
    changePassword,
    createAccessToken,
    login,
    publicUser,
    register
};

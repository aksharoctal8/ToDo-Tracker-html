"use strict";

const validateRequest = require("./validateRequest");

const emailRule = {
    validate: value => typeof value === "string"
        && value.length <= 254
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    message: "Enter a valid email address."
};
const passwordRule = {
    validate: value => typeof value === "string"
        && value.length >= 8
        && Buffer.byteLength(value, "utf8") <= 72,
    message: "Password must be at least 8 characters and no more than 72 UTF-8 bytes."
};

const validateRegistration = validateRequest({
    body: {
        name: {
            validate: value => typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 80,
            message: "Name must be between 2 and 80 characters."
        },
        email: emailRule,
        password: passwordRule,
        confirmPassword: {
            validate: (value, request) => typeof value === "string" && value === request.body.password,
            message: "Password confirmation does not match."
        }
    }
});

const validateLogin = validateRequest({
    body: {
        email: emailRule,
        password: {
            validate: value => typeof value === "string" && value.length > 0 && Buffer.byteLength(value, "utf8") <= 72,
            message: "Enter a valid password."
        }
    }
});

const validateProfileUpdate = validateRequest({
    body: {
        name: {
            validate: value => typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 80,
            message: "Name must be between 2 and 80 characters."
        },
        email: emailRule
    }
});

const validatePasswordChange = validateRequest({
    body: {
        currentPassword: {
            validate: value => typeof value === "string" && value.length > 0 && Buffer.byteLength(value, "utf8") <= 72,
            message: "Enter your current password."
        },
        newPassword: passwordRule,
        confirmNewPassword: {
            validate: (value, request) => typeof value === "string" && value === request.body.newPassword,
            message: "Password confirmation does not match."
        }
    }
});

module.exports = {
    validateLogin,
    validatePasswordChange,
    validateProfileUpdate,
    validateRegistration
};

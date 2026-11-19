"use strict";

const AppError = require("../utils/AppError");

function validateRequest(schema) {
    return (request, _response, next) => {
        const issues = [];

        for (const [location, fields] of Object.entries(schema)) {
            for (const [field, rule] of Object.entries(fields)) {
                const value = request[location]?.[field];
                if (!rule.validate(value, request)) {
                    issues.push({
                        field,
                        location,
                        message: rule.message
                    });
                    if (rule.statusCode === 404) {
                        return next(new AppError(rule.message, 404));
                    }
                }
            }
        }

        if (issues.length) {
            return next(new AppError(`Invalid request: ${issues.map(issue => `${issue.location}.${issue.field}`).join(", ")}.`, 400));
        }

        next();
    };
}

module.exports = validateRequest;

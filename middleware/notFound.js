"use strict";

const AppError = require("../utils/AppError");

function notFound(request, _response, next) {
    next(new AppError(`Page not found: ${request.originalUrl}`, 404));
}

module.exports = notFound;

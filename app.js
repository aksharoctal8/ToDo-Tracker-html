"use strict";

const path = require("node:path");
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const routes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const csrfProtection = require("./middleware/csrfProtection");
const { resolveAuthenticatedUser } = require("./middleware/authenticate");
const env = require("./config/env");

const app = express();
const projectRoot = path.resolve(__dirname);

app.disable("x-powered-by");
app.set("env", env.nodeEnv);
app.set("view engine", "ejs");
app.set("views", path.join(projectRoot, "views"));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"]
        }
    }
}));
app.use(express.static(path.join(projectRoot, "public"), {
    fallthrough: true,
    index: false
}));
app.use((_request, response, next) => {
    response.set("Cache-Control", "no-store");
    next();
});
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(csrfProtection);
app.use(resolveAuthenticatedUser);
app.use((_request, response, next) => {
    response.locals.currentUser = _request.user || null;
    next();
});
app.use(routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

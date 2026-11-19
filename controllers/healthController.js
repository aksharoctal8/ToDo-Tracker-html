"use strict";

const mongoose = require("mongoose");

function getHealth(_request, response) {
    const databaseReady = mongoose.connection.readyState === 1;
    response.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? "ok" : "unavailable",
        database: databaseReady ? "connected" : "disconnected"
    });
}

module.exports = { getHealth };

"use strict";

const mongoose = require("mongoose");
const env = require("./env");
const AppError = require("../utils/AppError");

async function connectDatabase() {
    if (!env.mongoUri) {
        throw new AppError("MONGODB_URI is not configured. Set the MongoDB connection string in .env.", 500);
    }

    await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 5000
    });
    console.log("Connected to MongoDB.");
}

module.exports = { connectDatabase };

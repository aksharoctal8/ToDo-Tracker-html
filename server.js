"use strict";

const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/database");
const mongoose = require("mongoose");
const { assertAuthConfiguration } = require("./config/auth");

async function startServer() {
    assertAuthConfiguration();
    await connectDatabase();

    const server = await new Promise((resolve, reject) => {
        const instance = app.listen(env.port, () => resolve(instance));
        instance.once("error", reject);
    });

    console.log(`TaskFlow is running at http://localhost:${env.port}`);

    let shuttingDown = false;
    async function shutdown(signal) {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log(`${signal} received. Shutting down TaskFlow.`);
        server.close(async error => {
            if (error) {
                console.error("HTTP server shutdown failed.", error);
                process.exitCode = 1;
            }
            try {
                await mongoose.disconnect();
            } catch (disconnectError) {
                console.error("MongoDB disconnect failed.", disconnectError);
                process.exitCode = 1;
            }
        });
    }

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
}

if (require.main === module) {
    startServer().catch(error => {
        console.error("TaskFlow could not start.", error.message);
        process.exitCode = 1;
    });
}

module.exports = { startServer };

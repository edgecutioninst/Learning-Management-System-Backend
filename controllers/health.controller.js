import db, { getDBStatus } from "../database/db.js"

export const checkHealth = async (req, res) => {
    try {
        const dbStatus = getDBStatus()

        const healthStatus = {
            status: "OK",
            timeStamp: new Date().toISOString(),
            services: {
                database: {
                    status: dbStatus.isConnected ? "HEALTHY" : "UNHEALTHY",
                    details: {
                        ...dbStatus,
                        readyState: getReadyStateText(dbStatus.readyState)
                    }
                },
                server: {
                    status: "HEALTHY",
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage()
                }
            }
        }

        const httpStatus = healthStatus.services.database.status === "HEALTHY" ? 200 : 503

        return res.status(httpStatus).json(healthStatus)

    } catch (error) {
        console.error("Health check failed", error)
        res.status(500).json({
            status: "ERROR", message: error.message, timeStamp: new Date().toISOString()
        })
    }
}

//utility
function getReadyStateText(state) {
    switch (state) {
        case 0: return "disconnected";
        case 1: return "connected";
        case 2: return "connecting";
        case 3: return "disconnecting";

        default: return "unkown";
    }
}
import mongoose from "mongoose";

const MAX_RETRIES = 3 // maximum number of retries before giving up
const RETRY_INTERVAL = 5000 // 5 seconds


class DatabaseConnection {
    constructor() {
        this.retryCount = 0;
        this.isConnected = false;

        // Enable strict query mode
        mongoose.set("strictQuery", true);

        mongoose.connection.on("connected", () => {
            console.log("Database connection established");
            this.isConnected = true;
        })

        mongoose.connection.on("disconnected", () => {
            console.log("Database connection disconnected");
            this.isConnected = false;

            //attempt reconnection:
            this.handleDisconnection();

        })

        mongoose.connection.on("error", () => {
            console.log("Database connection error");
            this.isConnected = false;
        })

        process.on('SIGTERM', this.handleAppTermination.bind(this))

    }

    async connect() {
        try {

            if (!process.env.MONGO_URI) {
                throw new Error("MONGO_URI is not defined");
            }

            // const connectionOptions = {
            //     useNewUrlParser: true,
            //     useUnifiedTopology: true,
            //     maxPoolSize: 10, // Maximum number of connections in the pool
            //     serverSelectionTimeoutMS: 5000, // Maximum time to wait for a connection to be established
            //     socketTimeoutMS: 45000, // Maximum time to wait for a socket to establish a connection
            //     family: 4 // IPv4 address family
            // };

            if (process.env.NODE_ENV === "development") {
                mongoose.set("debug", true);
            }

            await mongoose.connect(process.env.MONGO_URI);
            this.retryCount = 0; // reset retry count on successful connection
        } catch (error) {
            console.error("Database connection error:", error);
            await this.handleConnectionError();
        }
    }

    async handleConnectionError() {
        if (this.retryCount < MAX_RETRIES) {
            this.retryCount++;
            console.log(`Retrying connection attempt ${this.retryCount} in ${RETRY_INTERVAL / 1000} seconds`);
            setTimeout(this.connect, RETRY_INTERVAL);

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve
                }, RETRY_INTERVAL);
            });
            return this.connect();
        } else {
            console.error(`Failed to connect to database after ${MAX_RETRIES} attempts`);
            process.exit(1);
        }
    }

    async handleDisconnection() {
        if (!this.isConnected) {
            console.log(`Reconnecting to database...`);
            this.connect();
        }
    }

    async handleAppTermination() {
        try {

            await mongoose.connection.close();
            console.log("Database connection terminated");
            process.exit(0)

        } catch (error) {
            console.error("Error terminating database connection:", error);
            process.exit(1);
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            name: mongoose.connection.name,
        }
    }

}


//create singleton instance: 

const dbConnection = new DatabaseConnection();
//bind because we want to use it as a function,
// uses dbconnection and not a new instance
export default dbConnection.connect.bind(dbConnection)
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection)


const mongoose = require("mongoose");
const { MONGO_URI } = require("../config/config");

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!MONGO_URI) {
        throw new Error("MONGO_URI is not configured");
    }

    try {
        const connection = await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully");
        return connection;
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        throw error;
    }
};

module.exports = connectDB;

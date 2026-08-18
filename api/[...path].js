// Vercel Function entry point. It exposes the existing Express routes at /api/*.
const app = require("../Backend/app");
const connectDB = require("../Backend/db/db");

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Database initialization failed:", error);
    return res.status(500).json({ success: false, message: "Database connection failed" });
  }
};

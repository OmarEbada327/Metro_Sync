const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const stationRoutes = require("./routes/stationRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({ success: true, status: "ok" });
})

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/stations", stationRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found"});
});

app.use(errorHandler);

module.exports = app;
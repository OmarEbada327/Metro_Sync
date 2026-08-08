const express = require("express");
const { body } = require("express-validator");
const { getStationsController, createStationController } = require("../controllers/stationController");
const { requireAdmin } = require("../middleware/authMiddleware");
const announcementRoutes = require("./announcementRoutes")
const router = express.Router();

const stationValidation = [
    body("name").trim().notEmpty().withMessage("Station name is required"),
    body("line").trim().notEmpty().withMessage("Line is required"),
    body("order").isInt({ min: 1 }).withMessage("Order must be a positive integer"),
];

router.get("/", getStationsController);
router.post("/", requireAdmin, stationValidation, createStationController);

router.use("/:stationId/announcements", announcementRoutes);

module.exports = router;
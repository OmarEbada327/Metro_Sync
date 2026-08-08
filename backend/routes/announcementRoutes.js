const express = require("express");
const { body, param } = require("express-validator");
const { getAnnouncements, createAnnouncements } = require("../controllers/announcementController");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router({ mergeParams: true});

const announcementValidation = [
    param("stationId").isMongoId().withMessage("stationId must be vaild id"),
    body("text").trim().notEmpty().withMessage("Announcement text is required").isLength({ max: 500})
];

router.get("/", getAnnouncements);
router.post("/", requireAdmin, announcementValidation, createAnnouncements);

module.exports = router;
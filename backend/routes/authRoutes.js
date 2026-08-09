const express = require("express");
const rateLimit = require("express-rate-limit")
const { body } = require("express-validator");
const { login } = require("../controllers/authController");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Too many login attempts. Try again later." },
});

const loginValidation = [
    body("email").isEmail().trim().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required")
];

router.post("/login", loginLimiter, loginValidation, login);

module.exports = router;
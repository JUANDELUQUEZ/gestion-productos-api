const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Definir endpoints
router.post("/registro", authController.registro);
router.post("/login", authController.login);

module.exports = router;

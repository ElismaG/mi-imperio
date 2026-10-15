const express = require("express");
const { obtenerResumen } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/resumen", obtenerResumen);

module.exports = router;

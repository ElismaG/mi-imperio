const express = require("express");
const {
  obtenerConfiguracion,
  actualizarConfiguracion,
} = require("../controllers/configuracionController");

const router = express.Router();

router.get("/", obtenerConfiguracion);
router.put("/", actualizarConfiguracion);

module.exports = router;

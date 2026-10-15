const express = require("express");
const {
  crearVenta,
  obtenerVentas,
  buscarPorPin,
  confirmarEntrega,
  historialEntregas,
} = require("../controllers/ventaController");

const router = express.Router();

router.post("/", crearVenta);
router.get("/", obtenerVentas);
router.get("/buscar/:pin", buscarPorPin);
router.post("/:id/confirmar-entrega", confirmarEntrega);
router.get("/historial/entregas", historialEntregas);

module.exports = router;

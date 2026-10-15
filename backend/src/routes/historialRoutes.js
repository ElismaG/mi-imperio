const express = require("express");
const {
  obtenerHistorial,
  obtenerDetalleVenta,
  obtenerEmpleadosFiltro,
  obtenerClientesFiltro,
  exportarCSV,
} = require("../controllers/historialController");

const router = express.Router();

router.get("/", obtenerHistorial);
router.get("/exportar", exportarCSV);
router.get("/filtros/empleados", obtenerEmpleadosFiltro);
router.get("/filtros/clientes", obtenerClientesFiltro);
router.get("/:id/detalle", obtenerDetalleVenta);

module.exports = router;

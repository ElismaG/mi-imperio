const express = require("express");
const {
  obtenerCategorias,
  crearCategoria,
  obtenerGastos,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
  resumenGastos,
} = require("../controllers/gastoController");

const router = express.Router();

// Categorías
router.get("/categorias", obtenerCategorias);
router.post("/categorias", crearCategoria);

// Resumen
router.get("/resumen", resumenGastos);

// Gastos
router.get("/", obtenerGastos);
router.post("/", crearGasto);
router.put("/:id", actualizarGasto);
router.delete("/:id", eliminarGasto);

module.exports = router;

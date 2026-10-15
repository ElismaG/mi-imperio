const express = require("express");
const {
  ventasPorDia,
  ventasPorCategoria,
  productosTop,
  margenes,
  resumenGeneral,
} = require("../controllers/reporteController");

const router = express.Router();

router.get("/ventas-por-dia", ventasPorDia);
router.get("/ventas-por-categoria", ventasPorCategoria);
router.get("/productos-top", productosTop);
router.get("/margenes", margenes);
router.get("/resumen", resumenGeneral);

module.exports = router;

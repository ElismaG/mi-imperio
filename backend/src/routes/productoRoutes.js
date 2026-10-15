const express = require("express");
const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  ajustarStock,
  obtenerAlertas,
} = require("../controllers/productoController");

const router = express.Router();

router.get("/", obtenerProductos);
router.get("/alertas/inventario", obtenerAlertas);
router.get("/:id", obtenerProductoPorId);
router.post("/", crearProducto);
router.put("/:id", actualizarProducto);
router.delete("/:id", eliminarProducto);
router.post("/:id/ajustar-stock", ajustarStock);

module.exports = router;

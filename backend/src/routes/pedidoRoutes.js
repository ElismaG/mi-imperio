const express = require("express");
const {
  crearPedido,
  pedidosPendientes,
  buscarPedidoPorPin,
  cobrarPedido,
  misPedidos,
  pagosPorVerificar,
  verificarPago,
} = require("../controllers/pedidoController");

const router = express.Router();

// ⚠️ ORDEN IMPORTANTE: Las rutas específicas van ANTES de las con :id
router.post("/", crearPedido);
router.get("/mis-pedidos/:cliente_id", misPedidos);
router.get("/pendientes", pedidosPendientes);
router.get("/pagos-por-verificar", pagosPorVerificar);
router.get("/buscar/:pin", buscarPedidoPorPin);
router.post("/:id/cobrar", cobrarPedido);
router.post("/:id/verificar-pago", verificarPago);

module.exports = router;

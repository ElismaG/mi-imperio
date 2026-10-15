const express = require("express");
const {
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  historialCliente,
  registroPublico,
  loginCliente,
  catalogoProductos,
  actualizarMiPerfil,
  cambiarMiPassword,
} = require("../controllers/clienteController");

const router = express.Router();

// 🌐 RUTAS PÚBLICAS (sin autenticación)
router.post("/registro", registroPublico);
router.post("/login", loginCliente);
router.get("/catalogo", catalogoProductos);

// 👤 RUTAS DEL CLIENTE (su propio perfil)
router.put("/:id/mi-perfil", actualizarMiPerfil);
router.put("/:id/mi-password", cambiarMiPassword);

// 🔧 Rutas para empleados
router.get("/", obtenerClientes);
router.get("/:id", obtenerClientePorId);
router.get("/:id/historial", historialCliente);
router.post("/", crearCliente);
router.put("/:id", actualizarCliente);
router.delete("/:id", eliminarCliente);

module.exports = router;

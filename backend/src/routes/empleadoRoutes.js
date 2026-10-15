const express = require("express");
const {
  obtenerEmpleados,
  obtenerRoles,
  crearEmpleado,
  actualizarEmpleado,
  toggleActivo,
  eliminarEmpleado,
} = require("../controllers/empleadoController");

const router = express.Router();

router.get("/", obtenerEmpleados);
router.get("/roles", obtenerRoles);
router.post("/", crearEmpleado);
router.put("/:id", actualizarEmpleado);
router.patch("/:id/toggle-activo", toggleActivo);
router.delete("/:id", eliminarEmpleado);

module.exports = router;

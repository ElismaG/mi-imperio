const express = require("express");
const {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  obtenerAtributos,
  crearAtributo,
  actualizarAtributo,
  eliminarAtributo,
} = require("../controllers/categoriaController");

const router = express.Router();

// Categorías
router.get("/", obtenerCategorias);
router.post("/", crearCategoria);
router.put("/:id", actualizarCategoria);
router.delete("/:id", eliminarCategoria);

// Atributos
router.get("/:categoriaId/atributos", obtenerAtributos);
router.post("/:categoriaId/atributos", crearAtributo);
router.put("/atributos/:id", actualizarAtributo);
router.delete("/atributos/:id", eliminarAtributo);

module.exports = router;

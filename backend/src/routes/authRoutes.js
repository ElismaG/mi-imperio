const express = require("express");
const {
  loginUniversal,
  registrar,
  obtenerPreguntaSeguridad,
  resetearPassword,
  verificarUsername,
} = require("../controllers/authController");

const router = express.Router();

router.post("/login-universal", loginUniversal);
router.post("/registrar", registrar);
router.post("/obtener-pregunta", obtenerPreguntaSeguridad);
router.post("/resetear-password", resetearPassword);
router.get("/verificar-username/:username", verificarUsername);

module.exports = router;

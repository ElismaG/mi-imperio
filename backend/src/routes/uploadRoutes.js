const express = require("express");
const {
  subirImagen,
  subirComprobante,
} = require("../controllers/uploadController");

const router = express.Router();

router.post("/", subirImagen);
router.post("/comprobante", subirComprobante);

module.exports = router;

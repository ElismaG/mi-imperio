const express = require("express");
const {
  listarBackups,
  crearBackupManual,
  restaurarBackup,
} = require("../controllers/backupController");

const router = express.Router();

router.get("/", listarBackups);
router.post("/crear", crearBackupManual);
router.post("/restaurar", restaurarBackup);

module.exports = router;

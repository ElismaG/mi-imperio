const backupService = require("../services/backupService");

// ═══════════════════════════════════════════════════════════
// LISTAR TODOS LOS BACKUPS
// ═══════════════════════════════════════════════════════════
exports.listarBackups = async (req, res) => {
  try {
    const backups = backupService.listarBackups();
    res.json(backups);
  } catch (error) {
    console.error("Error al listar backups:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// CREAR BACKUP MANUAL
// ═══════════════════════════════════════════════════════════
exports.crearBackupManual = async (req, res) => {
  try {
    console.log(
      "💾 Backup manual solicitado por:",
      req.usuario?.email || "Admin",
    );
    const resultado = await backupService.crearBackup();
    res.json({
      mensaje: "✅ Backup creado exitosamente",
      backup: resultado,
    });
  } catch (error) {
    console.error("Error al crear backup:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// RESTAURAR UN BACKUP
// ═══════════════════════════════════════════════════════════
exports.restaurarBackup = async (req, res) => {
  try {
    const { archivo } = req.body;

    if (!archivo) {
      return res
        .status(400)
        .json({ error: "Debes especificar el archivo de backup" });
    }

    const resultado = await backupService.restaurarBackup(archivo);
    res.json(resultado);
  } catch (error) {
    console.error("Error al restaurar backup:", error);
    res.status(500).json({ error: error.message });
  }
};

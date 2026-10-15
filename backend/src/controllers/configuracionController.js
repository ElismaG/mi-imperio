const pool = require("../config/postgresLocal");

// ═══════════════════════════════════════════════════════════
// OBTENER TODA LA CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════
exports.obtenerConfiguracion = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT clave, valor, descripcion FROM configuracion ORDER BY id",
    );

    const config = {};
    result.rows.forEach((row) => {
      config[row.clave] = row.valor;
    });

    res.json(config);
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════
exports.actualizarConfiguracion = async (req, res) => {
  try {
    const configuraciones = req.body;

    if (!configuraciones || Object.keys(configuraciones).length === 0) {
      return res
        .status(400)
        .json({ error: "No hay configuración para actualizar" });
    }

    for (const [clave, valor] of Object.entries(configuraciones)) {
      await pool.query(
        `INSERT INTO configuracion (clave, valor, updated_at) 
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (clave) 
                 DO UPDATE SET valor = $2, updated_at = NOW()`,
        [clave, valor],
      );
    }

    res.json({
      mensaje: "✅ Configuración actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    res.status(500).json({ error: error.message });
  }
};

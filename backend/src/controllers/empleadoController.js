const pool = require("../config/postgresLocal");
const bcrypt = require("bcryptjs");

// ═══════════════════════════════════════════════════════════
// OBTENER TODOS LOS EMPLEADOS
// ═══════════════════════════════════════════════════════════
exports.obtenerEmpleados = async (req, res) => {
  try {
    const query = `
            SELECT 
                u.id,
                u.email,
                u.nombre_completo,
                u.rol_id,
                u.activo,
                u.ultimo_acceso,
                u.created_at,
                r.nombre as rol_nombre
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            ORDER BY u.created_at DESC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// OBTENER TODOS LOS ROLES DISPONIBLES
// ═══════════════════════════════════════════════════════════
exports.obtenerRoles = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM roles ORDER BY nivel_permiso ASC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// CREAR EMPLEADO
// ═══════════════════════════════════════════════════════════
exports.crearEmpleado = async (req, res) => {
  try {
    const { email, password, nombre_completo, rol_id, pin_4digitos } = req.body;

    // Validaciones
    if (!email || !password || !nombre_completo || !rol_id) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }
    if (password.length < 4) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 4 caracteres" });
    }

    // Verificar email único
    const existe = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [email],
    );
    if (existe.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Ya existe un empleado con ese email" });
    }

    // Encriptar contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Insertar
    const query = `
            INSERT INTO usuarios (email, password_hash, nombre_completo, rol_id, pin_4digitos, activo)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id, email, nombre_completo, rol_id, activo
        `;
    const result = await pool.query(query, [
      email,
      password_hash,
      nombre_completo,
      rol_id,
      pin_4digitos || null,
    ]);

    res.status(201).json({
      mensaje: "✅ Empleado creado exitosamente",
      empleado: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear empleado:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR EMPLEADO
// ═══════════════════════════════════════════════════════════
exports.actualizarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nombre_completo, rol_id, pin_4digitos, password } = req.body;

    if (!email || !nombre_completo || !rol_id) {
      return res
        .status(400)
        .json({ error: "Email, nombre y rol son obligatorios" });
    }

    // Verificar que el email no esté en uso por otro usuario
    const existe = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1 AND id != $2",
      [email, id],
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "Ese email ya está en uso" });
    }

    // Si se cambia la contraseña, encriptarla
    let query, values;
    if (password && password.length >= 4) {
      const password_hash = await bcrypt.hash(password, 10);
      query = `
                UPDATE usuarios SET
                    email = $1,
                    nombre_completo = $2,
                    rol_id = $3,
                    pin_4digitos = $4,
                    password_hash = $5
                WHERE id = $6
                RETURNING id, email, nombre_completo, rol_id, activo
            `;
      values = [
        email,
        nombre_completo,
        rol_id,
        pin_4digitos || null,
        password_hash,
        id,
      ];
    } else {
      query = `
                UPDATE usuarios SET
                    email = $1,
                    nombre_completo = $2,
                    rol_id = $3,
                    pin_4digitos = $4
                WHERE id = $5
                RETURNING id, email, nombre_completo, rol_id, activo
            `;
      values = [email, nombre_completo, rol_id, pin_4digitos || null, id];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    res.json({
      mensaje: "✅ Empleado actualizado exitosamente",
      empleado: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar empleado:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ACTIVAR/DESACTIVAR EMPLEADO
// ═══════════════════════════════════════════════════════════
exports.toggleActivo = async (req, res) => {
  try {
    const { id } = req.params;

    // Evitar que el dueño se desactive a sí mismo
    if (parseInt(id) === req.usuario?.id) {
      return res
        .status(400)
        .json({ error: "No puedes desactivar tu propia cuenta" });
    }

    const result = await pool.query(
      `UPDATE usuarios 
             SET activo = NOT activo 
             WHERE id = $1 
             RETURNING id, email, nombre_completo, activo`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    res.json({
      mensaje: result.rows[0].activo
        ? "✅ Empleado activado"
        : "⏸️ Empleado desactivado",
      empleado: result.rows[0],
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR EMPLEADO
// ═══════════════════════════════════════════════════════════
exports.eliminarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;

    // Evitar que el dueño se elimine a sí mismo
    if (parseInt(id) === req.usuario?.id) {
      return res
        .status(400)
        .json({ error: "No puedes eliminar tu propia cuenta" });
    }

    // Verificar si tiene ventas asociadas
    const ventas = await pool.query(
      "SELECT COUNT(*) FROM ventas WHERE usuario_id = $1",
      [id],
    );

    if (parseInt(ventas.rows[0].count) > 0) {
      // Si tiene ventas, solo desactivar (soft delete)
      await pool.query("UPDATE usuarios SET activo = false WHERE id = $1", [
        id,
      ]);
      return res.json({
        mensaje:
          "⚠️ El empleado tiene ventas registradas. Se ha desactivado en lugar de eliminar.",
        desactivado: true,
      });
    }

    // Si no tiene ventas, eliminar
    const result = await pool.query(
      "DELETE FROM usuarios WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    res.json({
      mensaje: "✅ Empleado eliminado exitosamente",
      eliminado: true,
    });
  } catch (error) {
    console.error("Error al eliminar empleado:", error);
    res.status(500).json({ error: error.message });
  }
};

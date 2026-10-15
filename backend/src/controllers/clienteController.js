const pool = require("../config/postgresLocal");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ═══════════════════════════════════════════════════════════
// OBTENER TODOS LOS CLIENTES (empleados)
// ═══════════════════════════════════════════════════════════
exports.obtenerClientes = async (req, res) => {
  try {
    const query = `
            SELECT 
                c.id, c.nombre, c.username, c.email, c.telefono, c.cedula, 
                c.direccion, c.es_vip, c.created_at,
                (SELECT COUNT(*) FROM ventas WHERE cliente_id = c.id OR cliente_app_id = c.id) as total_compras,
                (SELECT COALESCE(SUM(total), 0) FROM ventas WHERE cliente_id = c.id OR cliente_app_id = c.id) as total_gastado
            FROM clientes c
            ORDER BY c.nombre ASC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// OBTENER UN CLIENTE POR ID
// ═══════════════════════════════════════════════════════════
exports.obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, nombre, username, email, telefono, cedula, direccion, es_vip FROM clientes WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// CREAR UN NUEVO CLIENTE (desde el panel de empleados)
// ═══════════════════════════════════════════════════════════
exports.crearCliente = async (req, res) => {
  try {
    const { nombre, email, telefono, cedula, direccion, es_vip } = req.body;

    if (!nombre || !telefono) {
      return res
        .status(400)
        .json({ error: "Nombre y teléfono son obligatorios" });
    }

    const query = `
            INSERT INTO clientes (nombre, email, telefono, cedula, direccion, es_vip)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nombre, username, email, telefono, cedula, direccion, es_vip
        `;
    const result = await pool.query(query, [
      nombre,
      email || null,
      telefono,
      cedula || null,
      direccion || null,
      es_vip || false,
    ]);

    res.status(201).json({
      mensaje: "Cliente creado exitosamente",
      cliente: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear cliente:", error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "Ya existe un cliente con esa cédula" });
    }
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR UN CLIENTE (empleado actualiza)
// ═══════════════════════════════════════════════════════════
exports.actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, cedula, direccion, es_vip } = req.body;

    const query = `
            UPDATE clientes SET
                nombre = $1,
                email = $2,
                telefono = $3,
                cedula = $4,
                direccion = $5,
                es_vip = $6
            WHERE id = $7
            RETURNING id, nombre, username, email, telefono, cedula, direccion, es_vip
        `;
    const result = await pool.query(query, [
      nombre,
      email || null,
      telefono,
      cedula || null,
      direccion || null,
      es_vip || false,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({
      mensaje: "Cliente actualizado exitosamente",
      cliente: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR UN CLIENTE
// ═══════════════════════════════════════════════════════════
exports.eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM clientes WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({
      mensaje: "Cliente eliminado exitosamente",
      cliente: result.rows[0],
    });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// HISTORIAL DE COMPRAS
// ═══════════════════════════════════════════════════════════
exports.historialCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const clienteResult = await pool.query(
      "SELECT id, nombre, username, email, telefono, cedula FROM clientes WHERE id = $1",
      [id],
    );
    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const ventasQuery = `
            SELECT 
                v.id, v.total, v.metodo_pago, v.estado_entrega, v.pin_retiro, v.fecha_venta,
                u.nombre_completo as vendedor,
                (SELECT COUNT(*) FROM detalle_ventas WHERE venta_id = v.id) as total_productos
            FROM ventas v
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.cliente_id = $1 OR v.cliente_app_id = $1
            ORDER BY v.fecha_venta DESC
        `;
    const ventasResult = await pool.query(ventasQuery, [id]);

    const statsQuery = `
            SELECT 
                COUNT(*) as total_compras,
                COALESCE(SUM(total), 0) as total_gastado,
                COALESCE(AVG(total), 0) as promedio_compra
            FROM ventas WHERE cliente_id = $1 OR cliente_app_id = $1
        `;
    const statsResult = await pool.query(statsQuery, [id]);

    res.json({
      cliente: clienteResult.rows[0],
      ventas: ventasResult.rows,
      estadisticas: {
        total_compras: parseInt(statsResult.rows[0].total_compras),
        total_gastado: parseFloat(statsResult.rows[0].total_gastado),
        promedio_compra: parseFloat(
          statsResult.rows[0].promedio_compra,
        ).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// REGISTRO PÚBLICO CON CONTRASEÑA Y PREGUNTA DE SEGURIDAD
// ═══════════════════════════════════════════════════════════
exports.registroPublico = async (req, res) => {
  try {
    const {
      nombre,
      username,
      email,
      telefono,
      cedula,
      direccion,
      password,
      pregunta_seguridad,
      respuesta_seguridad,
    } = req.body;

    // Validaciones
    if (!nombre || !telefono) {
      return res
        .status(400)
        .json({ error: "Nombre y teléfono son obligatorios" });
    }
    if (!email) {
      return res.status(400).json({ error: "El email es obligatorio" });
    }
    if (!username || username.length < 3) {
      return res
        .status(400)
        .json({ error: "El usuario debe tener al menos 3 caracteres" });
    }
    if (!password || password.length < 4) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 4 caracteres" });
    }
    if (!pregunta_seguridad || !respuesta_seguridad) {
      return res
        .status(400)
        .json({
          error: "La pregunta y respuesta de seguridad son obligatorias",
        });
    }

    const usernameLower = username.toLowerCase().trim();

    // Verificar username único
    const existeUser = await pool.query(
      `SELECT id FROM clientes WHERE username = $1
             UNION
             SELECT id FROM usuarios WHERE username = $1`,
      [usernameLower],
    );
    if (existeUser.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Ese nombre de usuario ya está en uso" });
    }

    // Verificar email único
    const existeEmail = await pool.query(
      "SELECT id FROM clientes WHERE email = $1",
      [email],
    );
    if (existeEmail.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Ya existe una cuenta con ese email" });
    }

    // Verificar cédula única
    if (cedula) {
      const existeCedula = await pool.query(
        "SELECT id FROM clientes WHERE cedula = $1",
        [cedula],
      );
      if (existeCedula.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Ya existe una cuenta con esa cédula" });
      }
    }

    // Encriptar contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Insertar
    const query = `
            INSERT INTO clientes (
                nombre, username, email, telefono, cedula, direccion, 
                es_vip, password_hash, pregunta_seguridad, respuesta_seguridad
            )
            VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9)
            RETURNING id, nombre, username, email, telefono
        `;
    const result = await pool.query(query, [
      nombre,
      usernameLower,
      email,
      telefono,
      cedula || null,
      direccion || null,
      password_hash,
      pregunta_seguridad,
      respuesta_seguridad,
    ]);

    res.status(201).json({
      mensaje: "✅ Cuenta creada exitosamente",
      cliente: result.rows[0],
    });
  } catch (error) {
    console.error("Error en registro público:", error);
    res.status(500).json({ error: "Error al crear la cuenta" });
  }
};

// ═══════════════════════════════════════════════════════════
// LOGIN DE CLIENTE
// ═══════════════════════════════════════════════════════════
exports.loginCliente = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email y contraseña son obligatorios" });
    }

    const result = await pool.query(
      "SELECT * FROM clientes WHERE email = $1 OR username = $1",
      [email.toLowerCase()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const cliente = result.rows[0];

    if (!cliente.password_hash) {
      return res
        .status(401)
        .json({ error: "Esta cuenta no tiene contraseña." });
    }

    const valida = await bcrypt.compare(password, cliente.password_hash);
    if (!valida) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { id: cliente.id, username: cliente.username, tipo: "cliente" },
      process.env.JWT_SECRET || "clave_secreta",
      { expiresIn: "30d" },
    );

    res.json({
      tipo: "cliente",
      token,
      cliente: {
        id: cliente.id,
        username: cliente.username,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        cedula: cliente.cedula,
        direccion: cliente.direccion,
        tipo: "cliente",
      },
    });
  } catch (error) {
    console.error("Error en login cliente:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// ═══════════════════════════════════════════════════════════
// CATÁLOGO DE PRODUCTOS PARA CLIENTES
// ═══════════════════════════════════════════════════════════
exports.catalogoProductos = async (req, res) => {
  try {
    const query = `
            SELECT 
                p.id, p.nombre, p.descripcion, p.precio_venta,
                p.stock_actual, p.imagen_principal,
                c.nombre as categoria_nombre,
                c.icono as categoria_icono
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = true AND p.stock_actual > 0
            ORDER BY p.nombre ASC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener catálogo:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 🆕 ACTUALIZAR PERFIL DEL CLIENTE (el mismo cliente)
// ═══════════════════════════════════════════════════════════
exports.actualizarMiPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, username, email, telefono, cedula, direccion } = req.body;

    // Validaciones
    if (!nombre || !telefono) {
      return res
        .status(400)
        .json({ error: "Nombre y teléfono son obligatorios" });
    }

    if (!username || username.length < 3) {
      return res
        .status(400)
        .json({ error: "El usuario debe tener al menos 3 caracteres" });
    }

    const usernameLower = username.toLowerCase().trim();

    // Verificar que el username no esté en uso por OTRO usuario
    const usernameCheck = await pool.query(
      `SELECT id FROM clientes WHERE username = $1 AND id != $2
             UNION
             SELECT id FROM usuarios WHERE username = $1`,
      [usernameLower, id],
    );
    if (usernameCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Ese nombre de usuario ya está en uso" });
    }

    // Verificar email único
    if (email) {
      const emailCheck = await pool.query(
        "SELECT id FROM clientes WHERE email = $1 AND id != $2",
        [email, id],
      );
      if (emailCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Ese email ya está en uso por otra cuenta" });
      }
    }

    // Verificar cédula única
    if (cedula) {
      const cedulaCheck = await pool.query(
        "SELECT id FROM clientes WHERE cedula = $1 AND id != $2",
        [cedula, id],
      );
      if (cedulaCheck.rows.length > 0) {
        return res.status(400).json({ error: "Esa cédula ya está registrada" });
      }
    }

    // Actualizar
    const query = `
            UPDATE clientes SET
                nombre = $1,
                username = $2,
                email = $3,
                telefono = $4,
                cedula = $5,
                direccion = $6
            WHERE id = $7
            RETURNING id, nombre, username, email, telefono, cedula, direccion
        `;
    const result = await pool.query(query, [
      nombre,
      usernameLower,
      email || null,
      telefono,
      cedula || null,
      direccion || null,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({
      mensaje: "✅ Perfil actualizado exitosamente",
      cliente: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// 🆕 CAMBIAR CONTRASEÑA DEL CLIENTE (el mismo)
// ═══════════════════════════════════════════════════════════
exports.cambiarMiPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password_actual, password_nueva } = req.body;

    if (!password_actual || !password_nueva) {
      return res
        .status(400)
        .json({ error: "Debes ingresar la contraseña actual y la nueva" });
    }

    if (password_nueva.length < 4) {
      return res
        .status(400)
        .json({
          error: "La nueva contraseña debe tener al menos 4 caracteres",
        });
    }

    // Verificar cliente
    const cliente = await pool.query(
      "SELECT id, password_hash FROM clientes WHERE id = $1",
      [id],
    );

    if (cliente.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // Verificar contraseña actual
    const valida = await bcrypt.compare(
      password_actual,
      cliente.rows[0].password_hash,
    );
    if (!valida) {
      return res
        .status(401)
        .json({ error: "La contraseña actual es incorrecta" });
    }

    // Encriptar nueva
    const nuevoHash = await bcrypt.hash(password_nueva, 10);

    await pool.query("UPDATE clientes SET password_hash = $1 WHERE id = $2", [
      nuevoHash,
      id,
    ]);

    res.json({ mensaje: "✅ Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ error: error.message });
  }
};

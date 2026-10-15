const pool = require("../config/postgresLocal");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ═══════════════════════════════════════════════════════════
// LOGIN UNIVERSAL (por username O email)
// ═══════════════════════════════════════════════════════════
exports.loginUniversal = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res
        .status(400)
        .json({ error: "Usuario y contraseña son obligatorios" });
    }

    console.log("🔍 Intento de login:", usuario);

    // 1️⃣ BUSCAR EN EMPLEADOS (por username o email)
    const usuarioQuery = `
            SELECT u.*, r.nombre as rol_nombre 
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE (u.username = $1 OR u.email = $1) AND u.activo = true
        `;
    const usuarioResult = await pool.query(usuarioQuery, [
      usuario.toLowerCase(),
    ]);

    if (usuarioResult.rows.length > 0) {
      const user = usuarioResult.rows[0];

      if (user.password_hash) {
        const valida = await bcrypt.compare(password, user.password_hash);
        if (valida) {
          const token = jwt.sign(
            {
              id: user.id,
              username: user.username,
              tipo: "empleado",
              rol: user.rol_nombre,
            },
            process.env.JWT_SECRET || "clave_secreta",
            { expiresIn: "8h" },
          );

          await pool.query(
            "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1",
            [user.id],
          );

          return res.json({
            tipo: "empleado",
            token,
            usuario: {
              id: user.id,
              username: user.username,
              email: user.email,
              nombre_completo: user.nombre_completo,
              rol: user.rol_nombre,
              tema_preferido: user.tema_preferido,
            },
          });
        }
      }
    }

    // 2️⃣ BUSCAR EN CLIENTES
    const clienteQuery = `
            SELECT * FROM clientes 
            WHERE (username = $1 OR email = $1)
        `;
    const clienteResult = await pool.query(clienteQuery, [
      usuario.toLowerCase(),
    ]);

    if (clienteResult.rows.length > 0) {
      const cliente = clienteResult.rows[0];

      if (!cliente.password_hash) {
        return res.status(401).json({
          error: "Esta cuenta no tiene contraseña. Contacta al administrador.",
        });
      }

      const valida = await bcrypt.compare(password, cliente.password_hash);
      if (valida) {
        const token = jwt.sign(
          { id: cliente.id, username: cliente.username, tipo: "cliente" },
          process.env.JWT_SECRET || "clave_secreta",
          { expiresIn: "30d" },
        );

        return res.json({
          tipo: "cliente",
          token,
          cliente: {
            id: cliente.id,
            username: cliente.username,
            nombre: cliente.nombre,
            email: cliente.email,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            tipo: "cliente",
          },
        });
      }
    }

    // 3️⃣ NO ENCONTRADO
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  } catch (error) {
    console.error("Error en login universal:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// ═══════════════════════════════════════════════════════════
// VERIFICAR SI EL USUARIO EXISTE Y DEVOLVER SU PREGUNTA DE SEGURIDAD
// ═══════════════════════════════════════════════════════════
exports.obtenerPreguntaSeguridad = async (req, res) => {
  try {
    const { usuario } = req.body;

    if (!usuario) {
      return res
        .status(400)
        .json({ error: "Debes ingresar tu usuario o email" });
    }

    // Buscar en empleados
    const empResult = await pool.query(
      "SELECT id, nombre_completo, pregunta_seguridad FROM usuarios WHERE (username = $1 OR email = $1) AND activo = true",
      [usuario.toLowerCase()],
    );

    if (empResult.rows.length > 0 && empResult.rows[0].pregunta_seguridad) {
      return res.json({
        tipo: "empleado",
        nombre: empResult.rows[0].nombre_completo,
        pregunta: empResult.rows[0].pregunta_seguridad,
      });
    }

    // Buscar en clientes
    const cliResult = await pool.query(
      "SELECT id, nombre, pregunta_seguridad FROM clientes WHERE username = $1 OR email = $1",
      [usuario.toLowerCase()],
    );

    if (cliResult.rows.length > 0 && cliResult.rows[0].pregunta_seguridad) {
      return res.json({
        tipo: "cliente",
        nombre: cliResult.rows[0].nombre,
        pregunta: cliResult.rows[0].pregunta_seguridad,
      });
    }

    return res.status(404).json({
      error:
        "No encontramos ninguna cuenta con ese usuario, o no tiene pregunta de seguridad configurada. Contacta al administrador.",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error al buscar usuario" });
  }
};

// ═══════════════════════════════════════════════════════════
// RESETEAR CONTRASEÑA (si responde correctamente la pregunta)
// ═══════════════════════════════════════════════════════════
exports.resetearPassword = async (req, res) => {
  try {
    const { usuario, respuesta, nueva_password } = req.body;

    if (!usuario || !respuesta || !nueva_password) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    if (nueva_password.length < 4) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 4 caracteres" });
    }

    const usernameBusqueda = usuario.toLowerCase();
    const respuestaNormalizada = respuesta.toLowerCase().trim();

    // 1️⃣ Buscar en empleados
    const empResult = await pool.query(
      `SELECT id, respuesta_seguridad FROM usuarios 
             WHERE (username = $1 OR email = $1) AND activo = true`,
      [usernameBusqueda],
    );

    if (empResult.rows.length > 0) {
      const user = empResult.rows[0];
      if (
        user.respuesta_seguridad &&
        user.respuesta_seguridad.toLowerCase().trim() === respuestaNormalizada
      ) {
        const password_hash = await bcrypt.hash(nueva_password, 10);
        await pool.query(
          "UPDATE usuarios SET password_hash = $1 WHERE id = $2",
          [password_hash, user.id],
        );

        return res.json({ mensaje: "✅ Contraseña actualizada exitosamente" });
      } else {
        return res
          .status(401)
          .json({ error: "Respuesta de seguridad incorrecta" });
      }
    }

    // 2️⃣ Buscar en clientes
    const cliResult = await pool.query(
      `SELECT id, respuesta_seguridad FROM clientes 
             WHERE username = $1 OR email = $1`,
      [usernameBusqueda],
    );

    if (cliResult.rows.length > 0) {
      const cliente = cliResult.rows[0];
      if (
        cliente.respuesta_seguridad &&
        cliente.respuesta_seguridad.toLowerCase().trim() ===
          respuestaNormalizada
      ) {
        const password_hash = await bcrypt.hash(nueva_password, 10);
        await pool.query(
          "UPDATE clientes SET password_hash = $1 WHERE id = $2",
          [password_hash, cliente.id],
        );

        return res.json({ mensaje: "✅ Contraseña actualizada exitosamente" });
      } else {
        return res
          .status(401)
          .json({ error: "Respuesta de seguridad incorrecta" });
      }
    }

    return res.status(404).json({ error: "Usuario no encontrado" });
  } catch (error) {
    console.error("Error al resetear:", error);
    res.status(500).json({ error: "Error al resetear contraseña" });
  }
};

// ═══════════════════════════════════════════════════════════
// VERIFICAR SI UN USERNAME ESTÁ DISPONIBLE
// ═══════════════════════════════════════════════════════════
exports.verificarUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3) {
      return res
        .status(400)
        .json({ disponible: false, error: "Mínimo 3 caracteres" });
    }

    const empCheck = await pool.query(
      "SELECT id FROM usuarios WHERE username = $1",
      [username.toLowerCase()],
    );

    const cliCheck = await pool.query(
      "SELECT id FROM clientes WHERE username = $1",
      [username.toLowerCase()],
    );

    const disponible = empCheck.rows.length === 0 && cliCheck.rows.length === 0;

    res.json({ disponible });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// REGISTRAR EMPLEADO
// ═══════════════════════════════════════════════════════════
exports.registrar = async (req, res) => {
  try {
    const { email, password, nombre_completo, rol_id } = req.body;

    if (!email || !password || !nombre_completo) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const existente = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [email],
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const usernameGenerado = email.split("@")[0].toLowerCase();

    const result = await pool.query(
      `INSERT INTO usuarios (email, username, password_hash, nombre_completo, rol_id, activo)
             VALUES ($1, $2, $3, $4, $5, true) 
             RETURNING id, email, username, nombre_completo, rol_id`,
      [email, usernameGenerado, password_hash, nombre_completo, rol_id || 3],
    );

    res.status(201).json({
      mensaje: "Usuario creado exitosamente",
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

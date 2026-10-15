const pool = require("../config/postgresLocal");

// ═══════════════════════════════════════════════════════════
// OBTENER TODAS LAS CATEGORÍAS (con conteo de productos)
// ═══════════════════════════════════════════════════════════
exports.obtenerCategorias = async (req, res) => {
  try {
    const query = `
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM productos WHERE categoria_id = c.id AND activo = true) as total_productos,
                (SELECT COUNT(*) FROM atributos_definicion WHERE categoria_id = c.id) as total_atributos
            FROM categorias c
            ORDER BY c.id ASC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// CREAR CATEGORÍA
// ═══════════════════════════════════════════════════════════
exports.crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, icono, color_hex } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    // Verificar nombre único
    const existe = await pool.query(
      "SELECT id FROM categorias WHERE nombre = $1",
      [nombre],
    );
    if (existe.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Ya existe una categoría con ese nombre" });
    }

    const query = `
            INSERT INTO categorias (nombre, descripcion, icono, color_hex, activo)
            VALUES ($1, $2, $3, $4, true)
            RETURNING *
        `;
    const result = await pool.query(query, [
      nombre,
      descripcion || null,
      icono || "fa-box",
      color_hex || "#9B59B6",
    ]);

    res.status(201).json({
      mensaje: "✅ Categoría creada exitosamente",
      categoria: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR CATEGORÍA
// ═══════════════════════════════════════════════════════════
exports.actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, icono, color_hex } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    // Verificar que el nombre no esté en uso por otra categoría
    const existe = await pool.query(
      "SELECT id FROM categorias WHERE nombre = $1 AND id != $2",
      [nombre, id],
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "Ese nombre ya está en uso" });
    }

    const query = `
            UPDATE categorias SET
                nombre = $1,
                descripcion = $2,
                icono = $3,
                color_hex = $4
            WHERE id = $5
            RETURNING *
        `;
    const result = await pool.query(query, [
      nombre,
      descripcion || null,
      icono || "fa-box",
      color_hex || "#9B59B6",
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json({
      mensaje: "✅ Categoría actualizada",
      categoria: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR CATEGORÍA
// ═══════════════════════════════════════════════════════════
exports.eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si tiene productos
    const productos = await pool.query(
      "SELECT COUNT(*) FROM productos WHERE categoria_id = $1",
      [id],
    );

    if (parseInt(productos.rows[0].count) > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: la categoría tiene ${productos.rows[0].count} producto(s). Elimina o cambia de categoría los productos primero.`,
      });
    }

    const result = await pool.query(
      "DELETE FROM categorias WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json({ mensaje: "✅ Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// OBTENER ATRIBUTOS DE UNA CATEGORÍA
// ═══════════════════════════════════════════════════════════
exports.obtenerAtributos = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    const query = `
            SELECT * FROM atributos_definicion
            WHERE categoria_id = $1
            ORDER BY orden_visual ASC, id ASC
        `;
    const result = await pool.query(query, [categoriaId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener atributos:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// CREAR ATRIBUTO
// ═══════════════════════════════════════════════════════════
exports.crearAtributo = async (req, res) => {
  try {
    const { categoriaId } = req.params;
    const {
      nombre_atributo,
      tipo_dato,
      es_obligatorio,
      usa_stock,
      opciones_lista,
      orden_visual,
      visible_en_tpv,
    } = req.body;

    if (!nombre_atributo || !tipo_dato) {
      return res
        .status(400)
        .json({ error: "Nombre y tipo de dato son obligatorios" });
    }

    // Convertir opciones_lista a array si es string
    let opciones = null;
    if (tipo_dato === "lista" && opciones_lista) {
      if (Array.isArray(opciones_lista)) {
        opciones = opciones_lista;
      } else if (typeof opciones_lista === "string") {
        opciones = opciones_lista
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
      }
    }

    const query = `
            INSERT INTO atributos_definicion (
                categoria_id, nombre_atributo, tipo_dato,
                es_obligatorio, usa_stock, opciones_lista,
                orden_visual, visible_en_tpv
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
    const result = await pool.query(query, [
      categoriaId,
      nombre_atributo,
      tipo_dato,
      es_obligatorio || false,
      usa_stock || false,
      opciones,
      orden_visual || 0,
      visible_en_tpv !== false,
    ]);

    res.status(201).json({
      mensaje: "✅ Atributo creado exitosamente",
      atributo: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear atributo:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR ATRIBUTO
// ═══════════════════════════════════════════════════════════
exports.actualizarAtributo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre_atributo,
      tipo_dato,
      es_obligatorio,
      usa_stock,
      opciones_lista,
      orden_visual,
      visible_en_tpv,
    } = req.body;

    let opciones = null;
    if (tipo_dato === "lista" && opciones_lista) {
      if (Array.isArray(opciones_lista)) {
        opciones = opciones_lista;
      } else if (typeof opciones_lista === "string") {
        opciones = opciones_lista
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
      }
    }

    const query = `
            UPDATE atributos_definicion SET
                nombre_atributo = $1,
                tipo_dato = $2,
                es_obligatorio = $3,
                usa_stock = $4,
                opciones_lista = $5,
                orden_visual = $6,
                visible_en_tpv = $7
            WHERE id = $8
            RETURNING *
        `;
    const result = await pool.query(query, [
      nombre_atributo,
      tipo_dato,
      es_obligatorio || false,
      usa_stock || false,
      opciones,
      orden_visual || 0,
      visible_en_tpv !== false,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Atributo no encontrado" });
    }

    res.json({
      mensaje: "✅ Atributo actualizado",
      atributo: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar atributo:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR ATRIBUTO
// ═══════════════════════════════════════════════════════════
exports.eliminarAtributo = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM atributos_definicion WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Atributo no encontrado" });
    }

    res.json({ mensaje: "✅ Atributo eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar atributo:", error);
    res.status(500).json({ error: error.message });
  }
};

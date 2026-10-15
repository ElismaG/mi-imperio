const pool = require("../config/postgresLocal");

// ═══════════════════════════════════════════════════════════
// CATEGORÍAS DE GASTOS
// ═══════════════════════════════════════════════════════════
exports.obtenerCategorias = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM gastos_categorias WHERE activo = true ORDER BY nombre",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, icono, color_hex } = req.body;

    if (!nombre)
      return res.status(400).json({ error: "El nombre es obligatorio" });

    const existe = await pool.query(
      "SELECT id FROM gastos_categorias WHERE nombre = $1",
      [nombre],
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "Ya existe esa categoría" });
    }

    const result = await pool.query(
      `INSERT INTO gastos_categorias (nombre, descripcion, icono, color_hex)
             VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        nombre,
        descripcion || null,
        icono || "fa-receipt",
        color_hex || "#E74C3C",
      ],
    );

    res
      .status(201)
      .json({ mensaje: "✅ Categoría creada", categoria: result.rows[0] });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// GASTOS - CRUD
// ═══════════════════════════════════════════════════════════
exports.obtenerGastos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, categoria_id } = req.query;

    const condiciones = [];
    const valores = [];
    let contador = 1;

    if (fecha_inicio) {
      condiciones.push(`g.fecha_gasto >= $${contador}`);
      valores.push(fecha_inicio);
      contador++;
    }
    if (fecha_fin) {
      condiciones.push(`g.fecha_gasto <= $${contador}`);
      valores.push(fecha_fin);
      contador++;
    }
    if (categoria_id) {
      condiciones.push(`g.categoria_id = $${contador}`);
      valores.push(parseInt(categoria_id));
      contador++;
    }

    const whereClause =
      condiciones.length > 0 ? "WHERE " + condiciones.join(" AND ") : "";

    const query = `
            SELECT 
                g.*,
                gc.nombre as categoria_nombre,
                gc.icono as categoria_icono,
                gc.color_hex as categoria_color,
                u.nombre_completo as registrado_por
            FROM gastos g
            LEFT JOIN gastos_categorias gc ON g.categoria_id = gc.id
            LEFT JOIN usuarios u ON g.usuario_id = u.id
            ${whereClause}
            ORDER BY g.fecha_gasto DESC, g.id DESC
        `;
    const result = await pool.query(query, valores);

    // Calcular total
    const total = result.rows.reduce((sum, g) => sum + parseFloat(g.monto), 0);

    res.json({ gastos: result.rows, total });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.crearGasto = async (req, res) => {
  try {
    const {
      categoria_id,
      descripcion,
      monto,
      fecha_gasto,
      metodo_pago,
      notas,
      comprobante,
    } = req.body;
    const usuario_id = req.usuario?.id || 1;

    if (!categoria_id || !descripcion || !monto) {
      return res
        .status(400)
        .json({ error: "Categoría, descripción y monto son obligatorios" });
    }

    if (parseFloat(monto) <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a 0" });
    }

    const result = await pool.query(
      `INSERT INTO gastos 
             (categoria_id, usuario_id, descripcion, monto, fecha_gasto, metodo_pago, notas, comprobante)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
      [
        categoria_id,
        usuario_id,
        descripcion,
        monto,
        fecha_gasto || new Date(),
        metodo_pago || "efectivo",
        notas || null,
        comprobante || null,
      ],
    );

    res.status(201).json({
      mensaje: "✅ Gasto registrado exitosamente",
      gasto: result.rows[0],
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoria_id,
      descripcion,
      monto,
      fecha_gasto,
      metodo_pago,
      notas,
    } = req.body;

    const result = await pool.query(
      `UPDATE gastos SET
                categoria_id = $1,
                descripcion = $2,
                monto = $3,
                fecha_gasto = $4,
                metodo_pago = $5,
                notas = $6
             WHERE id = $7
             RETURNING *`,
      [categoria_id, descripcion, monto, fecha_gasto, metodo_pago, notas, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    res.json({ mensaje: "✅ Gasto actualizado", gasto: result.rows[0] });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.eliminarGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM gastos WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Gasto no encontrado" });
    }

    res.json({ mensaje: "✅ Gasto eliminado" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// RESUMEN / BALANCE
// ═══════════════════════════════════════════════════════════
exports.resumenGastos = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const condiciones = [];
    const valores = [];
    let contador = 1;

    if (fecha_inicio) {
      condiciones.push(`fecha_gasto >= $${contador}`);
      valores.push(fecha_inicio);
      contador++;
    }
    if (fecha_fin) {
      condiciones.push(`fecha_gasto <= $${contador}`);
      valores.push(fecha_fin);
      contador++;
    }

    const whereClause =
      condiciones.length > 0 ? "WHERE " + condiciones.join(" AND ") : "";

    // Total de gastos
    const totalGastosQuery = `
            SELECT COALESCE(SUM(monto), 0) as total
            FROM gastos ${whereClause}
        `;
    const totalGastos = await pool.query(totalGastosQuery, valores);

    // Gastos por categoría
    const porCategoriaQuery = `
            SELECT 
                gc.nombre, gc.icono, gc.color_hex,
                COALESCE(SUM(g.monto), 0) as total,
                COUNT(g.id) as cantidad
            FROM gastos_categorias gc
            LEFT JOIN gastos g ON g.categoria_id = gc.id ${fecha_inicio || fecha_fin ? `AND ${condiciones.map((c) => "g." + c).join(" AND ")}` : ""}
            WHERE gc.activo = true
            GROUP BY gc.id, gc.nombre, gc.icono, gc.color_hex
            HAVING COALESCE(SUM(g.monto), 0) > 0
            ORDER BY total DESC
        `;
    const porCategoria = await pool.query(porCategoriaQuery, valores);

    // Total de ingresos (ventas)
    const ingresosCondiciones = condiciones.map((c) =>
      c.replace("fecha_gasto", "fecha_venta"),
    );
    const ingresosWhere =
      ingresosCondiciones.length > 0
        ? "WHERE " + ingresosCondiciones.join(" AND ")
        : "";
    const ingresosQuery = `
            SELECT COALESCE(SUM(total), 0) as total
            FROM ventas ${ingresosWhere}
        `;
    const ingresos = await pool.query(ingresosQuery, valores);

    const totalGastosNum = parseFloat(totalGastos.rows[0].total);
    const totalIngresosNum = parseFloat(ingresos.rows[0].total);

    res.json({
      total_gastos: totalGastosNum,
      total_ingresos: totalIngresosNum,
      ganancia_neta: totalIngresosNum - totalGastosNum,
      por_categoria: porCategoria.rows,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

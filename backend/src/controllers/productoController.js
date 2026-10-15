const pool = require("../config/postgresLocal");

// ═══════════════════════════════════════════════════════════
// OBTENER TODOS LOS PRODUCTOS
// ═══════════════════════════════════════════════════════════
exports.obtenerProductos = async (req, res) => {
  try {
    const query = `
            SELECT 
                p.*,
                c.nombre as categoria_nombre
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = true
            ORDER BY p.nombre ASC
        `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({
      error: "Error al obtener productos",
      detalle: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════
// OBTENER UN PRODUCTO POR ID
// ═══════════════════════════════════════════════════════════
exports.obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
            SELECT 
                p.*,
                c.nombre as categoria_nombre
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = $1
        `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// CREAR UN NUEVO PRODUCTO
// ═══════════════════════════════════════════════════════════
exports.crearProducto = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      categoria_id,
      codigo_barras,
      precio_compra,
      precio_venta,
      stock_actual,
      stock_minimo,
      ubicacion_almacen,
      imagen_principal,
    } = req.body;

    const query = `
            INSERT INTO productos (
                nombre, descripcion, categoria_id, codigo_barras,
                precio_compra, precio_venta, stock_actual, stock_minimo,
                ubicacion_almacen, imagen_principal
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

    const result = await pool.query(query, [
      nombre,
      descripcion,
      categoria_id,
      codigo_barras,
      precio_compra,
      precio_venta,
      stock_actual || 0,
      stock_minimo || 5,
      ubicacion_almacen || "General",
      imagen_principal || null,
    ]);

    res.status(201).json({
      mensaje: "Producto creado exitosamente",
      producto: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({
      error: "Error al crear producto",
      detalle: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR UN PRODUCTO
// ═══════════════════════════════════════════════════════════
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      categoria_id,
      codigo_barras,
      precio_compra,
      precio_venta,
      stock_actual,
      stock_minimo,
      ubicacion_almacen,
      imagen_principal,
    } = req.body;

    const query = `
            UPDATE productos SET
                nombre = $1,
                descripcion = $2,
                categoria_id = $3,
                codigo_barras = $4,
                precio_compra = $5,
                precio_venta = $6,
                stock_actual = $7,
                stock_minimo = $8,
                ubicacion_almacen = $9,
                imagen_principal = $10,
                updated_at = NOW()
            WHERE id = $11
            RETURNING *
        `;

    const result = await pool.query(query, [
      nombre,
      descripcion,
      categoria_id,
      codigo_barras,
      precio_compra,
      precio_venta,
      stock_actual,
      stock_minimo,
      ubicacion_almacen,
      imagen_principal,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({
      mensaje: "Producto actualizado exitosamente",
      producto: result.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({
      error: "Error al actualizar producto",
      detalle: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════
// ELIMINAR UN PRODUCTO (soft delete)
// ═══════════════════════════════════════════════════════════
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete: solo marcamos como inactivo
    const query = `UPDATE productos SET activo = false WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({
      mensaje: "Producto eliminado exitosamente",
      producto: result.rows[0],
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({
      error: "Error al eliminar producto",
      detalle: error.message,
    });
  }
};

// ═══════════════════════════════════════════════════════════
// AJUSTAR STOCK (compra, rotura, devolución)
// ═══════════════════════════════════════════════════════════
exports.ajustarStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;
    const usuario_id = req.usuario?.id || 1;

    if (!cantidad || cantidad === 0) {
      return res
        .status(400)
        .json({ error: "La cantidad debe ser distinta de cero" });
    }

    // Obtener producto actual
    const productoQuery = "SELECT * FROM productos WHERE id = $1";
    const productoResult = await pool.query(productoQuery, [id]);

    if (productoResult.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const producto = productoResult.rows[0];
    const stockAnterior = producto.stock_actual;
    const stockNuevo = stockAnterior + parseInt(cantidad);

    if (stockNuevo < 0) {
      return res
        .status(400)
        .json({ error: "No hay suficiente stock para restar esa cantidad" });
    }

    // Actualizar stock
    await pool.query(
      "UPDATE productos SET stock_actual = $1, updated_at = NOW() WHERE id = $2",
      [stockNuevo, id],
    );

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, valor_anterior, valor_nuevo)
             VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        usuario_id,
        "AJUSTE_STOCK",
        "productos",
        id,
        JSON.stringify({ stock: stockAnterior }),
        JSON.stringify({ stock: stockNuevo, motivo }),
      ],
    );

    res.json({
      mensaje: "Stock ajustado exitosamente",
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      diferencia: cantidad,
    });
  } catch (error) {
    console.error("Error al ajustar stock:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// ALERTAS DE INVENTARIO
// ═══════════════════════════════════════════════════════════
exports.obtenerAlertas = async (req, res) => {
  try {
    // 1. Stock bajo
    const stockBajoQuery = `
            SELECT 
                p.id, p.nombre, p.stock_actual, p.stock_minimo,
                p.precio_venta, p.ubicacion_almacen,
                c.nombre as categoria_nombre, c.icono as categoria_icono
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = true AND p.stock_actual > 0 AND p.stock_actual <= p.stock_minimo
            ORDER BY p.stock_actual ASC
        `;
    const stockBajoResult = await pool.query(stockBajoQuery);

    // 2. Agotados
    const agotadosQuery = `
            SELECT 
                p.id, p.nombre, p.stock_actual, p.precio_venta, p.ubicacion_almacen,
                c.nombre as categoria_nombre, c.icono as categoria_icono
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = true AND p.stock_actual = 0
            ORDER BY p.nombre ASC
        `;
    const agotadosResult = await pool.query(agotadosQuery);

    // 3. Por caducar
    const porCaducarQuery = `
            SELECT 
                p.id, p.nombre, p.stock_actual, p.precio_venta, p.ubicacion_almacen,
                c.nombre as categoria_nombre, c.icono as categoria_icono,
                av.valor as fecha_caducidad, ad.nombre_atributo
            FROM productos p
            JOIN atributos_valores av ON av.producto_id = p.id
            JOIN atributos_definicion ad ON av.atributo_id = ad.id
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = true
              AND ad.tipo_dato = 'fecha'
              AND av.valor ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              AND av.valor::date <= CURRENT_DATE + INTERVAL '7 days'
              AND av.valor::date >= CURRENT_DATE
            ORDER BY av.valor ASC
        `;
    const porCaducarResult = await pool.query(porCaducarQuery);

    res.json({
      stock_bajo: stockBajoResult.rows,
      agotados: agotadosResult.rows,
      por_caducar: porCaducarResult.rows,
      total_alertas:
        stockBajoResult.rows.length +
        agotadosResult.rows.length +
        porCaducarResult.rows.length,
    });
  } catch (error) {
    console.error("Error al obtener alertas:", error);
    res.status(500).json({ error: error.message });
  }
};

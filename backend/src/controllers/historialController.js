const pool = require("../config/postgresLocal");

// ═══════════════════════════════════════════════════════════
// OBTENER HISTÓRICO DE VENTAS CON FILTROS
// ═══════════════════════════════════════════════════════════
exports.obtenerHistorial = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      cliente_id,
      usuario_id,
      metodo_pago,
      estado_entrega,
      tipo,
      busqueda,
      limite = 100,
      offset = 0,
    } = req.query;

    // Construir WHERE dinámicamente
    const condiciones = [];
    const valores = [];
    let contador = 1;

    // Filtro por fecha inicio
    if (fecha_inicio) {
      condiciones.push(`v.fecha_venta >= $${contador}`);
      valores.push(fecha_inicio);
      contador++;
    }

    // Filtro por fecha fin (agregar 1 día para incluir todo el día)
    if (fecha_fin) {
      condiciones.push(
        `v.fecha_venta < ($${contador}::date + INTERVAL '1 day')`,
      );
      valores.push(fecha_fin);
      contador++;
    }

    // Filtro por cliente
    if (cliente_id) {
      condiciones.push(
        `(v.cliente_id = $${contador} OR v.cliente_app_id = $${contador})`,
      );
      valores.push(parseInt(cliente_id));
      contador++;
    }

    // Filtro por usuario (empleado)
    if (usuario_id) {
      condiciones.push(`v.usuario_id = $${contador}`);
      valores.push(parseInt(usuario_id));
      contador++;
    }

    // Filtro por método de pago
    if (metodo_pago) {
      condiciones.push(`v.metodo_pago = $${contador}`);
      valores.push(metodo_pago);
      contador++;
    }

    // Filtro por estado de entrega
    if (estado_entrega) {
      condiciones.push(`v.estado_entrega = $${contador}`);
      valores.push(estado_entrega);
      contador++;
    }

    // Filtro por tipo (presencial, pedido)
    if (tipo) {
      condiciones.push(`v.tipo = $${contador}`);
      valores.push(tipo);
      contador++;
    }

    // Búsqueda por ID o PIN
    if (busqueda) {
      condiciones.push(`(
                CAST(v.id AS TEXT) LIKE $${contador} 
                OR v.pin_retiro LIKE $${contador}
            )`);
      valores.push(`%${busqueda}%`);
      contador++;
    }

    const whereClause =
      condiciones.length > 0 ? "WHERE " + condiciones.join(" AND ") : "";

    // Consulta principal
    const query = `
            SELECT 
                v.id,
                v.total,
                v.metodo_pago,
                v.estado_entrega,
                v.estado_pago,
                v.pin_retiro,
                v.fecha_venta,
                v.fecha_entrega,
                v.tipo,
                v.tipo_entrega,
                v.costo_envio,
                v.direccion_entrega,
                COALESCE(c.nombre, ca.nombre) as cliente_nombre,
                COALESCE(c.telefono, ca.telefono) as cliente_telefono,
                u.nombre_completo as vendedor,
                (SELECT COUNT(*) FROM detalle_ventas WHERE venta_id = v.id) as total_productos
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN clientes ca ON v.cliente_app_id = ca.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            ${whereClause}
            ORDER BY v.fecha_venta DESC
            LIMIT $${contador} OFFSET $${contador + 1}
        `;

    valores.push(parseInt(limite), parseInt(offset));

    const result = await pool.query(query, valores);

    // Consulta para el total (sin límite)
    const countQuery = `
            SELECT 
                COUNT(*) as total,
                COALESCE(SUM(v.total), 0) as total_recaudado
            FROM ventas v
            ${whereClause}
        `;
    const countResult = await pool.query(countQuery, valores.slice(0, -2));

    res.json({
      ventas: result.rows,
      total: parseInt(countResult.rows[0].total),
      total_recaudado: parseFloat(countResult.rows[0].total_recaudado),
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// OBTENER DETALLE DE UNA VENTA
// ═══════════════════════════════════════════════════════════
exports.obtenerDetalleVenta = async (req, res) => {
  try {
    const { id } = req.params;

    // Info de la venta
    const ventaQuery = `
            SELECT 
                v.*,
                COALESCE(c.nombre, ca.nombre) as cliente_nombre,
                COALESCE(c.telefono, ca.telefono) as cliente_telefono,
                COALESCE(c.email, ca.email) as cliente_email,
                COALESCE(c.cedula, ca.cedula) as cliente_cedula,
                u.nombre_completo as vendedor
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN clientes ca ON v.cliente_app_id = ca.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.id = $1
        `;
    const ventaResult = await pool.query(ventaQuery, [id]);

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    // Detalles
    const detallesQuery = `
            SELECT 
                dv.*,
                p.nombre as producto_nombre,
                p.imagen_principal as producto_imagen,
                p.codigo_barras as producto_codigo,
                cat.nombre as categoria_nombre
            FROM detalle_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            LEFT JOIN categorias cat ON p.categoria_id = cat.id
            WHERE dv.venta_id = $1
        `;
    const detallesResult = await pool.query(detallesQuery, [id]);

    res.json({
      venta: ventaResult.rows[0],
      productos: detallesResult.rows.map((d) => ({
        id: d.id,
        producto_id: d.producto_id,
        nombre: d.producto_nombre,
        imagen: d.producto_imagen,
        codigo_barras: d.producto_codigo,
        categoria: d.categoria_nombre,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal,
        talla: d.atributos_venta?.talla || null,
        color: d.atributos_venta?.color || null,
      })),
    });
  } catch (error) {
    console.error("Error al obtener detalle:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// OBTENER LISTA DE EMPLEADOS (para el filtro)
// ═══════════════════════════════════════════════════════════
exports.obtenerEmpleadosFiltro = async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT DISTINCT u.id, u.nombre_completo
            FROM usuarios u
            INNER JOIN ventas v ON v.usuario_id = u.id
            ORDER BY u.nombre_completo
        `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// OBTENER LISTA DE CLIENTES (para el filtro)
// ═══════════════════════════════════════════════════════════
exports.obtenerClientesFiltro = async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT DISTINCT c.id, c.nombre
            FROM clientes c
            INNER JOIN ventas v ON (v.cliente_id = c.id OR v.cliente_app_id = c.id)
            ORDER BY c.nombre
        `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// EXPORTAR A CSV
// ═══════════════════════════════════════════════════════════
exports.exportarCSV = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      cliente_id,
      usuario_id,
      metodo_pago,
      estado_entrega,
      tipo,
    } = req.query;

    const condiciones = [];
    const valores = [];
    let contador = 1;

    if (fecha_inicio) {
      condiciones.push(`v.fecha_venta >= $${contador}`);
      valores.push(fecha_inicio);
      contador++;
    }
    if (fecha_fin) {
      condiciones.push(
        `v.fecha_venta < ($${contador}::date + INTERVAL '1 day')`,
      );
      valores.push(fecha_fin);
      contador++;
    }
    if (cliente_id) {
      condiciones.push(
        `(v.cliente_id = $${contador} OR v.cliente_app_id = $${contador})`,
      );
      valores.push(parseInt(cliente_id));
      contador++;
    }
    if (usuario_id) {
      condiciones.push(`v.usuario_id = $${contador}`);
      valores.push(parseInt(usuario_id));
      contador++;
    }
    if (metodo_pago) {
      condiciones.push(`v.metodo_pago = $${contador}`);
      valores.push(metodo_pago);
      contador++;
    }
    if (estado_entrega) {
      condiciones.push(`v.estado_entrega = $${contador}`);
      valores.push(estado_entrega);
      contador++;
    }
    if (tipo) {
      condiciones.push(`v.tipo = $${contador}`);
      valores.push(tipo);
      contador++;
    }

    const whereClause =
      condiciones.length > 0 ? "WHERE " + condiciones.join(" AND ") : "";

    const query = `
            SELECT 
                v.id,
                v.fecha_venta,
                COALESCE(c.nombre, ca.nombre) as cliente,
                u.nombre_completo as vendedor,
                v.total,
                v.metodo_pago,
                v.estado_entrega,
                v.tipo,
                v.tipo_entrega,
                v.pin_retiro
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN clientes ca ON v.cliente_app_id = ca.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            ${whereClause}
            ORDER BY v.fecha_venta DESC
        `;

    const result = await pool.query(query, valores);

    // Generar CSV
    const headers = [
      "ID",
      "Fecha",
      "Cliente",
      "Vendedor",
      "Total",
      "Método Pago",
      "Estado",
      "Tipo",
      "Tipo Entrega",
      "PIN",
    ];
    const rows = result.rows.map((v) => [
      v.id,
      new Date(v.fecha_venta).toLocaleString("es-ES"),
      v.cliente || "Venta directa",
      v.vendedor || "N/A",
      parseFloat(v.total).toFixed(2),
      v.metodo_pago,
      v.estado_entrega,
      v.tipo,
      v.tipo_entrega || "retiro",
      v.pin_retiro || "",
    ]);

    let csv = "\uFEFF"; // BOM para Excel
    csv += headers.join(";") + "\n";
    rows.forEach((row) => {
      csv += row.join(";") + "\n";
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=historial_ventas_${Date.now()}.csv`,
    );
    res.send(csv);
  } catch (error) {
    console.error("Error al exportar CSV:", error);
    res.status(500).json({ error: error.message });
  }
};

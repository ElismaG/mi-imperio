const pool = require("../config/postgresLocal");

// ═══════════════════════════════════════════════════════════
// VENTAS POR DÍA (últimos 30 días por defecto)
// ═══════════════════════════════════════════════════════════
exports.ventasPorDia = async (req, res) => {
  try {
    const { dias = 30 } = req.query;

    const query = `
            SELECT 
                TO_CHAR(DATE(fecha_venta), 'YYYY-MM-DD') as fecha,
                COUNT(*) as cantidad,
                COALESCE(SUM(total), 0) as total
            FROM ventas
            WHERE fecha_venta >= CURRENT_DATE - INTERVAL '${parseInt(dias)} days'
            GROUP BY DATE(fecha_venta)
            ORDER BY DATE(fecha_venta) ASC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en ventasPorDia:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// VENTAS POR CATEGORÍA
// ═══════════════════════════════════════════════════════════
exports.ventasPorCategoria = async (req, res) => {
  try {
    const query = `
            SELECT 
                c.nombre as categoria,
                c.color_hex,
                COUNT(DISTINCT v.id) as total_ventas,
                SUM(dv.cantidad) as total_productos,
                COALESCE(SUM(dv.subtotal), 0) as total_ingresos
            FROM detalle_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            JOIN ventas v ON dv.venta_id = v.id
            WHERE v.fecha_venta >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY c.id, c.nombre, c.color_hex
            ORDER BY total_ingresos DESC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en ventasPorCategoria:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// PRODUCTOS MÁS VENDIDOS (TOP 10)
// ═══════════════════════════════════════════════════════════
exports.productosTop = async (req, res) => {
  try {
    const query = `
            SELECT 
                p.id,
                p.nombre,
                p.imagen_principal,
                c.nombre as categoria,
                SUM(dv.cantidad) as total_vendido,
                COALESCE(SUM(dv.subtotal), 0) as total_ingresos,
                COALESCE(SUM(dv.cantidad * p.precio_compra), 0) as total_costos,
                COALESCE(SUM(dv.subtotal) - SUM(dv.cantidad * p.precio_compra), 0) as ganancia
            FROM detalle_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            JOIN ventas v ON dv.venta_id = v.id
            WHERE v.fecha_venta >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY p.id, p.nombre, p.imagen_principal, c.nombre
            ORDER BY total_vendido DESC
            LIMIT 10
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en productosTop:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// MÁRGENES POR CATEGORÍA
// ═══════════════════════════════════════════════════════════
exports.margenes = async (req, res) => {
  try {
    const query = `
            SELECT 
                c.nombre as categoria,
                COALESCE(SUM(dv.subtotal), 0) as ingresos,
                COALESCE(SUM(dv.cantidad * p.precio_compra), 0) as costos,
                COALESCE(SUM(dv.subtotal) - SUM(dv.cantidad * p.precio_compra), 0) as ganancia,
                CASE 
                    WHEN SUM(dv.subtotal) > 0 
                    THEN ROUND(((SUM(dv.subtotal) - SUM(dv.cantidad * p.precio_compra)) / SUM(dv.subtotal) * 100)::numeric, 2)
                    ELSE 0 
                END as margen_porcentaje
            FROM detalle_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            JOIN ventas v ON dv.venta_id = v.id
            WHERE v.fecha_venta >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY c.id, c.nombre
            ORDER BY ganancia DESC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error en margenes:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// RESUMEN GENERAL
// ═══════════════════════════════════════════════════════════
exports.resumenGeneral = async (req, res) => {
  try {
    // Ingresos y ventas totales (30 días)
    const totalesQuery = `
            SELECT 
                COUNT(*) as total_ventas,
                COALESCE(SUM(total), 0) as total_ingresos
            FROM ventas
            WHERE fecha_venta >= CURRENT_DATE - INTERVAL '30 days'
        `;
    const totales = await pool.query(totalesQuery);

    // Costos y ganancias
    const costosQuery = `
            SELECT 
                COALESCE(SUM(dv.cantidad * p.precio_compra), 0) as total_costos,
                COALESCE(SUM(dv.subtotal) - SUM(dv.cantidad * p.precio_compra), 0) as total_ganancia
            FROM detalle_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            JOIN ventas v ON dv.venta_id = v.id
            WHERE v.fecha_venta >= CURRENT_DATE - INTERVAL '30 days'
        `;
    const costos = await pool.query(costosQuery);

    // Promedio por venta
    const promedio =
      totales.rows[0].total_ventas > 0
        ? (
            parseFloat(totales.rows[0].total_ingresos) /
            parseInt(totales.rows[0].total_ventas)
          ).toFixed(2)
        : 0;

    res.json({
      total_ventas: parseInt(totales.rows[0].total_ventas),
      total_ingresos: parseFloat(totales.rows[0].total_ingresos),
      total_costos: parseFloat(costos.rows[0].total_costos),
      total_ganancia: parseFloat(costos.rows[0].total_ganancia),
      promedio_venta: parseFloat(promedio),
    });
  } catch (error) {
    console.error("Error en resumenGeneral:", error);
    res.status(500).json({ error: error.message });
  }
};

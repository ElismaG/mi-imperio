const pool = require("../config/postgresLocal");

// ═══════════════════════════════════════════════════════════
// OBTENER RESUMEN DEL DASHBOARD
// ═══════════════════════════════════════════════════════════
exports.obtenerResumen = async (req, res) => {
  try {
    // 1. Ventas del día
    const ventasHoyQuery = `
            SELECT 
                COUNT(*) as cantidad,
                COALESCE(SUM(total), 0) as total
            FROM ventas
            WHERE DATE(fecha_venta) = CURRENT_DATE
        `;
    const ventasHoy = await pool.query(ventasHoyQuery);

    // 2. Productos con stock crítico
    const stockCriticoQuery = `
            SELECT COUNT(*) as cantidad
            FROM productos
            WHERE activo = true AND stock_actual <= stock_minimo
        `;
    const stockCritico = await pool.query(stockCriticoQuery);

    // 3. Entregas pendientes
    const entregasPendientesQuery = `
            SELECT COUNT(*) as cantidad
            FROM ventas
            WHERE estado_entrega = 'pendiente'
        `;
    const entregasPendientes = await pool.query(entregasPendientesQuery);

    // 4. Total de productos activos
    const totalProductosQuery = `
            SELECT COUNT(*) as cantidad
            FROM productos
            WHERE activo = true
        `;
    const totalProductos = await pool.query(totalProductosQuery);

    // 5. Ventas de los últimos 7 días
    const ventasSemanaQuery = `
            SELECT 
                TO_CHAR(DATE(fecha_venta), 'DD/MM') as fecha,
                COUNT(*) as cantidad,
                COALESCE(SUM(total), 0) as total
            FROM ventas
            WHERE fecha_venta >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY DATE(fecha_venta)
            ORDER BY DATE(fecha_venta) ASC
        `;
    const ventasSemana = await pool.query(ventasSemanaQuery);

    // 6. Últimas 5 ventas (con cliente del sistema O cliente de la app) ✅ CORREGIDO
    const ultimasVentasQuery = `
            SELECT 
                v.id,
                v.total,
                v.metodo_pago,
                v.estado_entrega,
                v.pin_retiro,
                v.fecha_venta,
                v.tipo,
                v.tipo_entrega,
                COALESCE(c.nombre, ca.nombre) as cliente_nombre,
                u.nombre_completo as vendedor
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN clientes ca ON v.cliente_app_id = ca.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            ORDER BY v.fecha_venta DESC
            LIMIT 5
        `;
    const ultimasVentas = await pool.query(ultimasVentasQuery);

    // 7. Productos más vendidos (top 5)
    const productosTopQuery = `
            SELECT 
                p.nombre,
                SUM(dv.cantidad) as total_vendido,
                SUM(dv.subtotal) as total_ingresos
            FROM detalle_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            JOIN ventas v ON dv.venta_id = v.id
            WHERE v.fecha_venta >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY p.id, p.nombre
            ORDER BY total_vendido DESC
            LIMIT 5
        `;
    const productosTop = await pool.query(productosTopQuery);

    res.json({
      resumen: {
        ventas_hoy: parseInt(ventasHoy.rows[0].cantidad),
        total_hoy: parseFloat(ventasHoy.rows[0].total),
        stock_critico: parseInt(stockCritico.rows[0].cantidad),
        entregas_pendientes: parseInt(entregasPendientes.rows[0].cantidad),
        total_productos: parseInt(totalProductos.rows[0].cantidad),
      },
      ventas_semana: ventasSemana.rows,
      ultimas_ventas: ultimasVentas.rows,
      productos_top: productosTop.rows,
    });
  } catch (error) {
    console.error("❌ Error al obtener resumen:", error);
    res.status(500).json({ error: error.message });
  }
};

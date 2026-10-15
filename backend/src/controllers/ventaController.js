const pool = require("../config/postgresLocal");

// ═══════════════════════════════════════════════════════════
// CREAR UNA NUEVA VENTA
// ═══════════════════════════════════════════════════════════
exports.crearVenta = async (req, res) => {
  const client = await pool.connect();

  try {
    const { cliente_id, productos, metodo_pago, retirar_despues } = req.body;

    const usuario_id = req.usuario?.id || 1;

    // Validaciones
    if (!productos || productos.length === 0) {
      return res
        .status(400)
        .json({ error: "La venta debe tener al menos un producto" });
    }

    if (!metodo_pago) {
      return res
        .status(400)
        .json({ error: "Debe seleccionar un método de pago" });
    }

    await client.query("BEGIN");

    // 1. Calcular total
    let total = 0;
    for (const item of productos) {
      total += item.cantidad * item.precio_unitario;
    }

    // 2. Generar PIN si es necesario
    let pin_retiro = null;
    if (retirar_despues) {
      pin_retiro = String(Math.floor(1000 + Math.random() * 9000));
    }

    // 3. Insertar la venta
    const ventaQuery = `
            INSERT INTO ventas (cliente_id, usuario_id, total, metodo_pago, pin_retiro, estado_entrega)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
    const ventaResult = await client.query(ventaQuery, [
      cliente_id || null,
      usuario_id,
      total,
      metodo_pago,
      pin_retiro,
      retirar_despues ? "pendiente" : "entregado",
    ]);
    const venta = ventaResult.rows[0];

    // 4. Insertar detalle de venta CON talla y color
    for (const item of productos) {
      // Construir objeto de atributos (talla y color)
      const atributos = {};
      if (item.talla) atributos.talla = item.talla;
      if (item.color) atributos.color = item.color;

      await client.query(
        `INSERT INTO detalle_ventas 
                 (venta_id, producto_id, cantidad, precio_unitario, subtotal, atributos_venta)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          venta.id,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
          item.cantidad * item.precio_unitario,
          Object.keys(atributos).length > 0 ? JSON.stringify(atributos) : null,
        ],
      );

      // Descontar stock
      await client.query(
        "UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2",
        [item.cantidad, item.producto_id],
      );
    }

    // 5. Registrar en auditoría
    await client.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, valor_nuevo)
             VALUES ($1, $2, $3, $4, $5)`,
      [
        usuario_id,
        "VENTA",
        "ventas",
        venta.id,
        JSON.stringify({ total, metodo_pago, pin_retiro }),
      ],
    );

    await client.query("COMMIT");

    res.status(201).json({
      mensaje: "✅ Venta realizada exitosamente",
      venta: {
        id: venta.id,
        total: venta.total,
        metodo_pago: venta.metodo_pago,
        pin_retiro: venta.pin_retiro,
        fecha: venta.fecha_venta,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear venta:", error);
    res.status(500).json({
      error: "Error al crear la venta",
      detalle: error.message,
    });
  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════════════════════
// OBTENER TODAS LAS VENTAS
// ═══════════════════════════════════════════════════════════
exports.obtenerVentas = async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                v.*,
                c.nombre as cliente_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            ORDER BY v.fecha_venta DESC
            LIMIT 50
        `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// BUSCAR VENTA/PEDIDO POR PIN (para el almacenista)
// ═══════════════════════════════════════════════════════════
exports.buscarPorPin = async (req, res) => {
    try {
        const { pin } = req.params;

        if (!pin || pin.length !== 4) {
            return res.status(400).json({ error: 'El PIN debe tener 4 dígitos' });
        }

        const ventaQuery = `
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.email as cliente_email,
                c.direccion as cliente_direccion,
                u.nombre_completo as vendedor_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id OR v.cliente_app_id = c.id
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.pin_retiro = $1 AND v.estado_entrega = 'pendiente'
        `;
        const ventaResult = await pool.query(ventaQuery, [pin]);

        if (ventaResult.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró ninguna venta con ese PIN pendiente de entrega' });
        }

        const venta = ventaResult.rows[0];

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
        const detallesResult = await pool.query(detallesQuery, [venta.id]);

        res.json({
            venta: {
                id: venta.id,
                total: venta.total,
                metodo_pago: venta.metodo_pago,
                fecha_venta: venta.fecha_venta,
                estado_entrega: venta.estado_entrega,
                pin_retiro: venta.pin_retiro,
                observaciones: venta.observaciones,
                tipo: venta.tipo || 'presencial',
                // 🆕 Nuevos campos
                tipo_entrega: venta.tipo_entrega || 'retiro',
                costo_envio: venta.costo_envio || 0,
                direccion_entrega: venta.direccion_entrega
            },
            cliente: {
                nombre: venta.cliente_nombre || 'Cliente no registrado',
                telefono: venta.cliente_telefono,
                email: venta.cliente_email,
                direccion: venta.cliente_direccion
            },
            vendedor: venta.vendedor_nombre,
            productos: detallesResult.rows.map(d => ({
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
                color: d.atributos_venta?.color || null
            }))
        });

    } catch (error) {
        console.error('❌ Error al buscar por PIN:', error);
        res.status(500).json({ error: 'Error al buscar la venta' });
    }
};
// ═══════════════════════════════════════════════════════════
// CONFIRMAR ENTREGA (el almacenista confirma que entregó)
// ═══════════════════════════════════════════════════════════
exports.confirmarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.usuario?.id || 1;

    // Verificar que la venta existe y está pendiente
    const ventaQuery =
      "SELECT * FROM ventas WHERE id = $1 AND estado_entrega = $2";
    const ventaResult = await pool.query(ventaQuery, [id, "pendiente"]);

    if (ventaResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Venta no encontrada o ya entregada" });
    }

    // Actualizar estado
    await pool.query(
      `UPDATE ventas 
             SET estado_entrega = 'entregado', fecha_entrega = NOW() 
             WHERE id = $1`,
      [id],
    );

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, valor_nuevo)
             VALUES ($1, $2, $3, $4, $5)`,
      [
        usuario_id,
        "ENTREGA",
        "ventas",
        id,
        JSON.stringify({ estado: "entregado" }),
      ],
    );

    res.json({
      mensaje: "✅ Entrega confirmada exitosamente",
      venta_id: id,
    });
  } catch (error) {
    console.error("❌ Error al confirmar entrega:", error);
    res.status(500).json({ error: "Error al confirmar la entrega" });
  }
};

// ═══════════════════════════════════════════════════════════
// HISTORIAL DE ENTREGAS
// ═══════════════════════════════════════════════════════════
exports.historialEntregas = async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                v.id,
                v.total,
                v.fecha_venta,
                v.fecha_entrega,
                c.nombre as cliente_nombre,
                (SELECT COUNT(*) FROM detalle_ventas WHERE venta_id = v.id) as total_productos
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            WHERE v.estado_entrega = 'entregado'
            ORDER BY v.fecha_entrega DESC
            LIMIT 20
        `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: error.message });
  }
};

const pool = require("../config/postgresLocal");
const emailService = require("../services/emailService");

// ═══════════════════════════════════════════════════════════
// CREAR UN PEDIDO
// ═══════════════════════════════════════════════════════════
exports.crearPedido = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      cliente_id,
      productos,
      tipo_entrega,
      costo_envio,
      direccion_entrega,
      pagar_ahora,
      comprobante_pago,
    } = req.body;

    if (!cliente_id) {
      return res.status(400).json({ error: "Cliente no identificado" });
    }

    if (!productos || productos.length === 0) {
      return res
        .status(400)
        .json({ error: "El pedido debe tener al menos un producto" });
    }

    await client.query("BEGIN");

    let subtotal = 0;
    for (const item of productos) {
      subtotal += item.cantidad * item.precio_unitario;
    }

    const envio = parseFloat(costo_envio) || 0;
    const total = subtotal + envio;
    const pin_retiro = String(Math.floor(1000 + Math.random() * 9000));

    const estado_pago = pagar_ahora ? "en_verificacion" : "pendiente";

    const ventaQuery = `
            INSERT INTO ventas (
                cliente_id, usuario_id, total, metodo_pago, pin_retiro, 
                estado_entrega, tipo, cliente_app_id, tipo_entrega, 
                costo_envio, direccion_entrega, estado_pago, comprobante_pago
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;
    const ventaResult = await client.query(ventaQuery, [
      null,
      1,
      total,
      pagar_ahora ? "transfermovil_app" : "pendiente",
      pin_retiro,
      "pendiente",
      "pedido",
      cliente_id,
      tipo_entrega || "retiro",
      envio,
      direccion_entrega || null,
      estado_pago,
      comprobante_pago || null,
    ]);
    const venta = ventaResult.rows[0];

    for (const item of productos) {
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
    }

    await client.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, valor_nuevo)
             VALUES ($1, $2, $3, $4, $5)`,
      [
        1,
        "PEDIDO_CLIENTE",
        "ventas",
        venta.id,
        JSON.stringify({ total, pin_retiro, estado_pago }),
      ],
    );

    await client.query("COMMIT");

    // Enviar email
    try {
      const clienteQuery = "SELECT nombre, email FROM clientes WHERE id = $1";
      const clienteResult = await pool.query(clienteQuery, [cliente_id]);

      if (clienteResult.rows.length > 0) {
        const clienteData = clienteResult.rows[0];

        if (clienteData.email) {
          const productosConNombre = await Promise.all(
            productos.map(async (p) => {
              const prodResult = await pool.query(
                "SELECT nombre FROM productos WHERE id = $1",
                [p.producto_id],
              );
              return {
                ...p,
                nombre: prodResult.rows[0]?.nombre || "Producto",
              };
            }),
          );

          await emailService.enviarPinPedido({
            email: clienteData.email,
            nombre: clienteData.nombre,
            pin: pin_retiro,
            total: subtotal,
            productos: productosConNombre,
            tipo_entrega: tipo_entrega || "retiro",
            direccion: direccion_entrega,
            costo_envio: envio,
          });
        }
      }
    } catch (emailError) {
      console.error("⚠️ Error al enviar email:", emailError.message);
    }

    res.status(201).json({
      mensaje: "✅ Pedido enviado exitosamente",
      pedido: {
        id: venta.id,
        total: venta.total,
        pin_retiro: venta.pin_retiro,
        estado: venta.estado_entrega,
        tipo_entrega: venta.tipo_entrega,
        costo_envio: venta.costo_envio,
        direccion_entrega: venta.direccion_entrega,
        estado_pago: venta.estado_pago,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear pedido:", error);
    res
      .status(500)
      .json({ error: "Error al crear el pedido", detalle: error.message });
  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════════════════════
// OBTENER PEDIDOS PENDIENTES
// ═══════════════════════════════════════════════════════════
exports.pedidosPendientes = async (req, res) => {
  try {
    const query = `
            SELECT 
                v.id, v.total, v.pin_retiro, v.estado_entrega, v.fecha_venta,
                v.tipo_entrega, v.direccion_entrega, v.estado_pago,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.email as cliente_email,
                (SELECT COUNT(*) FROM detalle_ventas WHERE venta_id = v.id) as total_productos
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_app_id = c.id
            WHERE v.tipo = 'pedido' AND v.estado_entrega = 'pendiente'
            ORDER BY v.fecha_venta DESC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pedidos pendientes:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// BUSCAR PEDIDO POR PIN
// ═══════════════════════════════════════════════════════════
exports.buscarPedidoPorPin = async (req, res) => {
  try {
    const { pin } = req.params;

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ error: "El PIN debe tener 4 dígitos" });
    }

    const ventaQuery = `
            SELECT 
                v.*,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                c.email as cliente_email
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_app_id = c.id
            WHERE v.pin_retiro = $1 AND v.estado_entrega = 'pendiente'
        `;
    const ventaResult = await pool.query(ventaQuery, [pin]);

    if (ventaResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontró ningún pedido con ese PIN" });
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
      pedido: {
        id: venta.id,
        total: venta.total,
        pin_retiro: venta.pin_retiro,
        estado_entrega: venta.estado_entrega,
        fecha_venta: venta.fecha_venta,
        tipo_entrega: venta.tipo_entrega,
        costo_envio: venta.costo_envio,
        direccion_entrega: venta.direccion_entrega,
        estado_pago: venta.estado_pago,
        comprobante_pago: venta.comprobante_pago,
      },
      cliente: {
        nombre: venta.cliente_nombre || "Cliente no registrado",
        telefono: venta.cliente_telefono,
        email: venta.cliente_email,
      },
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
    console.error("Error al buscar pedido por PIN:", error);
    res.status(500).json({ error: error.message });
  }
};
// ═══════════════════════════════════════════════════════════
// COBRAR / ENTREGAR PEDIDO
// ═══════════════════════════════════════════════════════════
exports.cobrarPedido = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { metodo_pago, usuario_id } = req.body;

        await client.query('BEGIN');

        // 1. Buscar el pedido
        const pedidoQuery = 'SELECT * FROM ventas WHERE id = $1 AND estado_entrega = $2';
        const pedidoResult = await client.query(pedidoQuery, [id, 'pendiente']);

        if (pedidoResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Pedido no encontrado o ya entregado' });
        }

        const pedido = pedidoResult.rows[0];

        // 2. Decidir si requiere cobro o si ya está pagado
        let metodoPagoFinal = metodo_pago;
        let yaEstabaPagado = false;

        if (pedido.estado_pago === 'verificado') {
            // Ya fue pagado desde la app
            yaEstabaPagado = true;
            metodoPagoFinal = pedido.metodo_pago || 'transfermovil_app';
        } else if (pedido.estado_pago === 'en_verificacion') {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'El pago aún está en verificación. El cajero debe aprobarlo primero.' 
            });
        } else {
            // Es pago pendiente: requiere método de pago
            if (!metodo_pago) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Debe seleccionar un método de pago' });
            }
        }

        // 3. Actualizar el pedido
        await client.query(
            `UPDATE ventas 
             SET metodo_pago = $1, 
                 estado_entrega = 'entregado',
                 estado_pago = CASE 
                     WHEN estado_pago = 'verificado' THEN 'verificado'
                     ELSE 'pagado_en_entrega'
                 END,
                 fecha_pago = CASE 
                     WHEN estado_pago = 'verificado' THEN fecha_pago
                     ELSE NOW()
                 END,
                 usuario_id = $2,
                 fecha_entrega = NOW()
             WHERE id = $3`,
            [metodoPagoFinal, usuario_id || 1, id]
        );

        // 4. Descontar stock
        const detallesQuery = 'SELECT * FROM detalle_ventas WHERE venta_id = $1';
        const detallesResult = await client.query(detallesQuery, [id]);

        for (const detalle of detallesResult.rows) {
            await client.query(
                'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2',
                [detalle.cantidad, detalle.producto_id]
            );
        }

        // 5. Auditoría
        await client.query(
            `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, valor_nuevo)
             VALUES ($1, $2, $3, $4, $5)`,
            [usuario_id || 1, yaEstabaPagado ? 'ENTREGA_PEDIDO_PAGADO' : 'COBRAR_PEDIDO', 
             'ventas', id, JSON.stringify({ metodo_pago: metodoPagoFinal, ya_estaba_pagado: yaEstabaPagado })]
        );

        await client.query('COMMIT');

        res.json({
            mensaje: yaEstabaPagado 
                ? '✅ Pedido entregado (ya estaba pagado)' 
                : '✅ Pedido cobrado y entregado',
            pedido: {
                id: pedido.id,
                total: pedido.total,
                metodo_pago: metodoPagoFinal,
                estado: 'entregado',
                ya_estaba_pagado: yaEstabaPagado
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error al cobrar pedido:', error);
        res.status(500).json({ error: 'Error al cobrar el pedido', detalle: error.message });
    } finally {
        client.release();
    }
};

// ═══════════════════════════════════════════════════════════
// MIS PEDIDOS (para el cliente)
// ═══════════════════════════════════════════════════════════
exports.misPedidos = async (req, res) => {
  try {
    const { cliente_id } = req.params;

    const query = `
            SELECT 
                v.id, v.total, v.pin_retiro, v.estado_entrega,
                v.fecha_venta, v.tipo_entrega, v.estado_pago,
                (SELECT COUNT(*) FROM detalle_ventas WHERE venta_id = v.id) as total_productos
            FROM ventas v
            WHERE v.cliente_app_id = $1 AND v.tipo = 'pedido'
            ORDER BY v.fecha_venta DESC
        `;
    const result = await pool.query(query, [cliente_id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener mis pedidos:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// LISTAR PAGOS POR VERIFICAR
// ═══════════════════════════════════════════════════════════
exports.pagosPorVerificar = async (req, res) => {
  try {
    const query = `
            SELECT 
                v.id, v.total, v.pin_retiro, v.fecha_venta,
                v.estado_pago, v.comprobante_pago,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                (SELECT COUNT(*) FROM detalle_ventas WHERE venta_id = v.id) as total_productos
            FROM ventas v
            LEFT JOIN clientes c ON v.cliente_app_id = c.id
            WHERE v.estado_pago = 'en_verificacion'
            ORDER BY v.fecha_venta DESC
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// VERIFICAR PAGO (Aprobar o Rechazar)
// ═══════════════════════════════════════════════════════════
exports.verificarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion, usuario_id, motivo } = req.body;

    if (!["aprobar", "rechazar"].includes(accion)) {
      return res.status(400).json({ error: "Acción inválida" });
    }

    const nuevoEstado = accion === "aprobar" ? "verificado" : "rechazado";

    const result = await pool.query(
      `UPDATE ventas 
             SET estado_pago = $1,
                 fecha_pago = NOW(),
                 verificado_por = $2,
                 observaciones = COALESCE($3, observaciones)
             WHERE id = $4 AND estado_pago = 'en_verificacion'
             RETURNING *`,
      [nuevoEstado, usuario_id || 1, motivo || null, id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Pedido no encontrado o ya verificado" });
    }

    await pool.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, valor_nuevo)
             VALUES ($1, $2, $3, $4, $5)`,
      [
        usuario_id || 1,
        `PAGO_${accion.toUpperCase()}`,
        "ventas",
        id,
        JSON.stringify({ estado_pago: nuevoEstado, motivo }),
      ],
    );

    res.json({
      mensaje: `✅ Pago ${accion === "aprobar" ? "aprobado" : "rechazado"} exitosamente`,
      pedido: result.rows[0],
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

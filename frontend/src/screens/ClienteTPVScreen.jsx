// ClienteTPVScreen.jsx - TPV del cliente con diseño corregido
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';
import { getApiUrl } from '../core/utils/apiUrl';

const ClienteTPVScreen = ({ cliente, onVolver }) => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [pedidoExito, setPedidoExito] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [selecciones, setSelecciones] = useState({});

  // Configuración del negocio
  const [config, setConfig] = useState({
    costo_envio: 0,
    envio_habilitado: 'true',
    pago_app_habilitado: 'false',
    texto_instrucciones_pago: '',
    qr_transfermovil: '',
    nombre_negocio: 'Mi Imperio'
  });

  // Entrega
  const [tipoEntrega, setTipoEntrega] = useState('retiro');
  const [direccion, setDireccion] = useState(cliente.direccion || '');

  // Pago
  const [modalPago, setModalPago] = useState(false);
  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [previewComprobante, setPreviewComprobante] = useState(null);

  const { tema, toggleTema } = useThemeStore();
  const esOscuro = tema === 'oscuro';

  const c = esOscuro ? {
    fondo: '#0F1621', card: '#1A2332', cardSecundario: '#0F1621',
    borde: '#2A3547', texto: '#FFFFFF', textoSuave: '#B0BEC5',
    textoMuted: '#8B9BB0', inputBg: '#0F1621', inputBorder: '#2A3547',
    sombra: '0 4px 20px rgba(0,0,0,0.5)'
  } : {
    fondo: '#F8F9FA', card: '#FFFFFF', cardSecundario: '#F9F9F9',
    borde: '#EEEEEE', texto: '#1A2332', textoSuave: '#666666',
    textoMuted: '#999999', inputBg: '#FFFFFF', inputBorder: '#DDDDDD',
    sombra: '0 4px 20px rgba(0,0,0,0.08)'
  };

  useEffect(() => {
    cargarProductos();
    cargarConfiguracion();
  }, []);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const response = await apiClient.get('/clientes/catalogo');
      setProductos(response.data);
      const cats = [...new Set(response.data.map(p => p.categoria_nombre))].filter(Boolean);
      setCategorias(cats);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      const response = await apiClient.get('/configuracion');
      setConfig({
        costo_envio: parseFloat(response.data.costo_envio) || 0,
        envio_habilitado: response.data.envio_habilitado || 'true',
        pago_app_habilitado: response.data.pago_app_habilitado || 'false',
        texto_instrucciones_pago: response.data.texto_instrucciones_pago || '',
        qr_transfermovil: response.data.qr_transfermovil || '',
        nombre_negocio: response.data.nombre_negocio || 'Mi Imperio'
      });
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };

  const envioHabilitado = config.envio_habilitado === 'true';
  const pagoAppHabilitado = config.pago_app_habilitado === 'true';
  const costoEnvio = config.costo_envio;

  useEffect(() => {
    if (!envioHabilitado && tipoEntrega === 'domicilio') {
      setTipoEntrega('retiro');
    }
  }, [envioHabilitado]);

  // ═══════════ CARRITO ═══════════

  const stockReservado = (producto_id) => {
    return carrito.filter(i => i.producto_id === producto_id).reduce((s, i) => s + i.cantidad, 0);
  };

  const stockMostrado = (producto) => {
    return Math.max(0, producto.stock_actual - stockReservado(producto.id));
  };

  const actualizarSeleccion = (producto_id, campo, valor) => {
    setSelecciones(prev => ({
      ...prev,
      [producto_id]: { ...prev[producto_id], [campo]: valor }
    }));
  };

  const obtenerSeleccion = (producto) => {
    const sel = selecciones[producto.id] || {};
    const cat = producto.categoria_nombre;
    return {
      talla: cat === 'Ropa' ? (sel.talla || 'M') : null,
      color: ['Ropa', 'Electrodomésticos', 'Vehículos', 'Juguetes'].includes(cat) ? (sel.color || 'Rojo') : null
    };
  };

  const mostrarTalla = (categoria) => categoria === 'Ropa';
  const mostrarColor = (categoria) => ['Ropa', 'Electrodomésticos', 'Vehículos', 'Juguetes'].includes(categoria);

  const agregarAlCarrito = (producto) => {
    const { talla, color } = obtenerSeleccion(producto);
    const claveUnica = `${producto.id}-${talla || ''}-${color || ''}`;
    const existente = carrito.find(i => i.claveUnica === claveUnica);
    const cantidadEnCarrito = existente ? existente.cantidad : 0;
    const stockDisp = producto.stock_actual;

    if (stockDisp <= 0) {
      setMensaje('❌ Producto agotado');
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    if (cantidadEnCarrito + 1 > stockDisp) {
      setMensaje(`⚠️ Solo hay ${stockDisp} unidad(es)`);
      setTimeout(() => setMensaje(null), 3000);
      return;
    }

    if (existente) {
      setCarrito(carrito.map(i =>
        i.claveUnica === claveUnica ? { ...i, cantidad: i.cantidad + 1 } : i
      ));
    } else {
      setCarrito([...carrito, {
        claveUnica, producto_id: producto.id, nombre: producto.nombre,
        imagen: producto.imagen_principal, precio_unitario: parseFloat(producto.precio_venta),
        cantidad: 1, talla, color, stock_disponible: producto.stock_actual
      }]);
    }
    setMensaje('✅ Agregado al carrito');
    setTimeout(() => setMensaje(null), 1500);
  };

  const cambiarCantidad = (claveUnica, nuevaCantidad) => {
    const item = carrito.find(i => i.claveUnica === claveUnica);
    if (!item) return;
    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter(i => i.claveUnica !== claveUnica));
      return;
    }
    if (nuevaCantidad > item.stock_disponible) {
      setMensaje(`⚠️ Solo hay ${item.stock_disponible} unidad(es)`);
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    setCarrito(carrito.map(i =>
      i.claveUnica === claveUnica ? { ...i, cantidad: nuevaCantidad } : i
    ));
  };

  const eliminarDelCarrito = (claveUnica) => {
    setCarrito(carrito.filter(i => i.claveUnica !== claveUnica));
  };

  const subtotal = carrito.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0);
  const totalFinal = subtotal + (tipoEntrega === 'domicilio' && envioHabilitado ? costoEnvio : 0);

  // ═══════════ MANEJO DE COMPROBANTE ═══════════

  const handleComprobanteChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ La imagen es muy grande (máximo 5MB)');
        return;
      }
      setComprobanteFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewComprobante(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ═══════════ ENVIAR PEDIDO ═══════════

  const enviarPedidoNormal = async () => {
    if (carrito.length === 0) return;
    if (tipoEntrega === 'domicilio' && envioHabilitado && !direccion.trim()) {
      setMensaje('❌ Debes ingresar una dirección para el domicilio');
      setTimeout(() => setMensaje(null), 3000);
      return;
    }

    setEnviando(true);
    try {
      const response = await apiClient.post('/pedidos', {
        cliente_id: cliente.id,
        productos: carrito.map(i => ({
          producto_id: i.producto_id, cantidad: i.cantidad,
          precio_unitario: i.precio_unitario, talla: i.talla, color: i.color
        })),
        tipo_entrega: tipoEntrega,
        costo_envio: tipoEntrega === 'domicilio' && envioHabilitado ? costoEnvio : 0,
        direccion_entrega: tipoEntrega === 'domicilio' && envioHabilitado ? direccion : null,
        pagar_ahora: false
      });
      setPedidoExito(response.data.pedido);
      setCarrito([]);
      setSelecciones({});
      setModalPago(false);
    } catch (error) {
      setMensaje('❌ Error al enviar pedido: ' + (error.response?.data?.error || error.message));
      setTimeout(() => setMensaje(null), 5000);
    } finally {
      setEnviando(false);
    }
  };

  const enviarPedidoConPago = async () => {
    if (!comprobanteFile) {
      alert('❌ Debes subir el comprobante de pago');
      return;
    }

    if (tipoEntrega === 'domicilio' && envioHabilitado && !direccion.trim()) {
      alert('❌ Debes ingresar una dirección para el domicilio');
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('comprobante', comprobanteFile);

      const uploadRes = await apiClient.post('/upload/comprobante', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const comprobanteUrl = uploadRes.data.url;

      const response = await apiClient.post('/pedidos', {
        cliente_id: cliente.id,
        productos: carrito.map(i => ({
          producto_id: i.producto_id, cantidad: i.cantidad,
          precio_unitario: i.precio_unitario, talla: i.talla, color: i.color
        })),
        tipo_entrega: tipoEntrega,
        costo_envio: tipoEntrega === 'domicilio' && envioHabilitado ? costoEnvio : 0,
        direccion_entrega: tipoEntrega === 'domicilio' && envioHabilitado ? direccion : null,
        pagar_ahora: true,
        comprobante_pago: comprobanteUrl
      });

      setPedidoExito({ ...response.data.pedido, pagado: true });
      setCarrito([]);
      setSelecciones({});
      setModalPago(false);
      setComprobanteFile(null);
      setPreviewComprobante(null);

    } catch (error) {
      console.error('Error al enviar pedido con pago:', error);
      setMensaje('❌ Error: ' + (error.response?.data?.error || error.message));
      setTimeout(() => setMensaje(null), 5000);
    } finally {
      setEnviando(false);
    }
  };

  const abrirModalPago = () => {
    if (carrito.length === 0) {
      setMensaje('❌ El carrito está vacío');
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    if (tipoEntrega === 'domicilio' && envioHabilitado && !direccion.trim()) {
      setMensaje('❌ Debes ingresar una dirección para el domicilio');
      setTimeout(() => setMensaje(null), 3000);
      return;
    }
    setModalPago(true);
  };

  const productosFiltrados = productos.filter(p => {
    if (categoriaFiltro !== 'todas' && p.categoria_nombre !== categoriaFiltro) return false;
    if (busqueda) return p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return true;
  });

  const coloresDisponibles = [
    { hex: '#E74C3C', nombre: 'Rojo' },
    { hex: '#3498DB', nombre: 'Azul' },
    { hex: '#2ECC71', nombre: 'Verde' },
    { hex: '#F1C40F', nombre: 'Amarillo' },
    { hex: '#333333', nombre: 'Negro' },
    { hex: '#FFFFFF', nombre: 'Blanco' }
  ];

  // ═══════════ PANTALLA DE ÉXITO ═══════════
  if (pedidoExito) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: c.fondo, padding: '20px'
      }}>
        <div style={{
          backgroundColor: c.card, padding: '50px', borderRadius: '16px',
          boxShadow: c.sombra, maxWidth: '500px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
          <h1 style={{ color: '#27AE60', marginBottom: '15px' }}>¡Pedido enviado!</h1>
          <p style={{ color: c.textoSuave, fontSize: '16px', marginBottom: '20px' }}>
            {pedidoExito.tipo_entrega === 'domicilio'
              ? 'Tu pedido será entregado a domicilio. Muestra este PIN al repartidor:'
              : 'Tu pedido ha sido registrado. Muestra este PIN en la tienda:'}
          </p>

          <div style={{
            backgroundColor: esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED',
            padding: '25px', borderRadius: '16px',
            border: '3px dashed #FF6B00', marginBottom: '20px'
          }}>
            <div style={{ fontSize: '14px', color: c.textoSuave, marginBottom: '10px' }}>
              PIN DE {pedidoExito.tipo_entrega === 'domicilio' ? 'ENTREGA' : 'RETIRO'}
            </div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#FF6B00', letterSpacing: '8px' }}>
              {pedidoExito.pin_retiro}
            </div>
          </div>

          {pedidoExito.pagado && (
            <div style={{
              padding: '15px',
              backgroundColor: esOscuro ? 'rgba(255,184,0,0.15)' : '#FFF9E6',
              borderRadius: '10px', border: '2px solid #FFB800',
              marginBottom: '20px',
              color: esOscuro ? '#ffd966' : '#856404', fontSize: '14px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                ⏳ Pago en verificación
              </div>
              <div style={{ fontSize: '12px' }}>
                Tu comprobante está siendo revisado.
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: c.textoSuave, fontSize: '13px', margin: '5px 0' }}>
              Subtotal: <strong>${(parseFloat(pedidoExito.total) - parseFloat(pedidoExito.costo_envio || 0)).toFixed(2)}</strong>
            </p>
            {pedidoExito.costo_envio > 0 && (
              <p style={{ color: c.textoSuave, fontSize: '13px', margin: '5px 0' }}>
                Envío: <strong>${parseFloat(pedidoExito.costo_envio).toFixed(2)}</strong>
              </p>
            )}
            <p style={{ color: '#FF6B00', fontSize: '20px', margin: '10px 0 0 0', fontWeight: 'bold' }}>
              Total: ${parseFloat(pedidoExito.total).toFixed(2)}
            </p>
          </div>

          <button onClick={onVolver} style={{
            padding: '14px 30px', backgroundColor: '#FF6B00',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
          }}>
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  // ═══════════ PANTALLA PRINCIPAL ═══════════
  return (
    <div style={{ minHeight: '100vh', backgroundColor: c.fondo, transition: 'background-color 0.3s ease' }}>
      
      {/* Barra superior */}
      <div style={{
        backgroundColor: '#1A2332', color: 'white', padding: '15px 30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexWrap: 'wrap', gap: '10px'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>🛒 Hacer Pedido</h2>
          <div style={{ fontSize: '13px', color: '#8B9BB0' }}>Hola, {cliente.nombre}</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={toggleTema} title={esOscuro ? 'Modo claro' : 'Modo oscuro'}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: '28px', padding: '5px', lineHeight: 1
            }}>
            {esOscuro ? '☀️' : '🌙'}
          </button>
          <button onClick={onVolver} style={{
            padding: '10px 20px', backgroundColor: 'transparent',
            color: 'white', border: '2px solid white',
            borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
          }}>
            ← Volver al catálogo
          </button>
        </div>
      </div>

      <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* Panel de productos */}
        <div style={{ flex: 1, minWidth: '400px' }}>
          {mensaje && (
            <div style={{
              padding: '15px', marginBottom: '20px', borderRadius: '12px',
              backgroundColor: mensaje.includes('❌')
                ? (esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da')
                : mensaje.includes('⚠️')
                  ? (esOscuro ? 'rgba(255,184,0,0.2)' : '#fff3cd')
                  : (esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda'),
              color: mensaje.includes('❌')
                ? (esOscuro ? '#ff9999' : '#721c24')
                : mensaje.includes('⚠️')
                  ? (esOscuro ? '#ffd966' : '#856404')
                  : (esOscuro ? '#7de8a8' : '#155724'),
              fontWeight: 'bold'
            }}>
              {mensaje}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="text" placeholder="🔍 Buscar producto..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              style={{
                flex: 1, minWidth: '200px', padding: '12px',
                borderRadius: '10px', border: `2px solid ${c.inputBorder}`,
                fontSize: '15px', backgroundColor: c.inputBg, color: c.texto
              }}
            />
            <button onClick={() => setCategoriaFiltro('todas')}
              style={{
                padding: '12px 20px',
                backgroundColor: categoriaFiltro === 'todas' ? '#2196F3' : c.card,
                color: categoriaFiltro === 'todas' ? 'white' : c.texto,
                border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontWeight: 'bold'
              }}>
              Todas
            </button>
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaFiltro(cat)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: categoriaFiltro === cat ? '#2196F3' : c.card,
                  color: categoriaFiltro === cat ? 'white' : c.texto,
                  border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontWeight: 'bold'
                }}>
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {cargando ? (
              <div style={{ textAlign: 'center', padding: '60px', color: c.textoMuted }}>
                Cargando productos...
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px', color: c.textoMuted,
                backgroundColor: c.card, borderRadius: '16px'
              }}>
                No se encontraron productos
              </div>
            ) : (
              productosFiltrados.map(producto => {
                const stockActual = stockMostrado(producto);
                const agotado = stockActual <= 0;
                const tieneOpciones = !agotado && (mostrarTalla(producto.categoria_nombre) || mostrarColor(producto.categoria_nombre));

                return (
                  <div key={producto.id} style={{
                    padding: '15px',
                    backgroundColor: agotado ? (esOscuro ? '#0A0F16' : '#F8F8F8') : c.card,
                    borderRadius: '16px',
                    border: agotado ? '2px dashed #E74C3C' : `1px solid ${c.borde}`,
                    boxShadow: c.sombra,
                    opacity: agotado ? 0.6 : 1,
                    transition: 'all 0.3s ease'
                  }}>
                    
                    {/* Fila 1: Imagen + Info + Stock */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '15px',
                      marginBottom: tieneOpciones ? '12px' : '0'
                    }}>
                      {/* Imagen */}
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: esOscuro ? '#0F1621' : '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        flexShrink: 0
                      }}>
                        {producto.imagen_principal ? (
                          <img src={`${getApiUrl()}${producto.imagen_principal}`}
                            alt={producto.nombre}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : '📦'}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '11px',
                          color: c.textoSuave,
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          marginBottom: '4px'
                        }}>
                          {producto.categoria_nombre}
                        </div>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: c.texto,
                          lineHeight: '1.3',
                          marginBottom: '6px',
                          wordBreak: 'break-word'
                        }}>
                          {producto.nombre}
                        </div>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#FF6B00'
                        }}>
                          ${producto.precio_venta}
                        </div>
                      </div>

                      {/* Stock badge */}
                      <div style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        backgroundColor: agotado ? '#E74C3C' : stockActual <= 5
                          ? (esOscuro ? 'rgba(255,184,0,0.2)' : '#FFF3CD')
                          : (esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda'),
                        color: agotado ? 'white' : stockActual <= 5
                          ? (esOscuro ? '#ffd966' : '#856404')
                          : (esOscuro ? '#7de8a8' : '#155724'),
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {agotado ? '🚫 Agotado' : stockActual <= 5 ? `⚠️ ${stockActual}` : `Stock: ${stockActual}`}
                      </div>
                    </div>

                    {/* Fila 2: Talla y Color (si aplica) */}
                    {tieneOpciones && (
                      <div style={{
                        display: 'flex',
                        gap: '20px',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: c.cardSecundario,
                        borderRadius: '10px',
                        marginBottom: '12px',
                        border: `1px solid ${c.borde}`
                      }}>
                        
                        {/* Talla */}
                        {mostrarTalla(producto.categoria_nombre) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: c.textoSuave,
                              whiteSpace: 'nowrap'
                            }}>
                              Talla:
                            </span>
                            <select
                              value={selecciones[producto.id]?.talla || 'M'}
                              onChange={(e) => actualizarSeleccion(producto.id, 'talla', e.target.value)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: `2px solid ${c.inputBorder}`,
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                color: c.texto,
                                backgroundColor: c.inputBg,
                                fontSize: '14px'
                              }}>
                              <option value="S">S</option>
                              <option value="M">M</option>
                              <option value="L">L</option>
                              <option value="XL">XL</option>
                            </select>
                          </div>
                        )}

                        {/* Color */}
                        {mostrarColor(producto.categoria_nombre) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: c.textoSuave,
                              whiteSpace: 'nowrap'
                            }}>
                              Color:
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {coloresDisponibles.map(col => {
                                const sel = selecciones[producto.id]?.color === col.nombre;
                                return (
                                  <div
                                    key={col.nombre}
                                    onClick={() => actualizarSeleccion(producto.id, 'color', col.nombre)}
                                    title={col.nombre}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '50%',
                                      backgroundColor: col.hex,
                                      cursor: 'pointer',
                                      border: sel ? '3px solid #FF6B00' : `2px solid ${c.card}`,
                                      boxShadow: sel ? '0 0 0 2px #FF6B00' : `0 0 0 1px ${c.borde}`,
                                      transition: 'all 0.2s',
                                      flexShrink: 0
                                    }} />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fila 3: Botón agregar */}
                    {!agotado ? (
                      <button
                        onClick={() => agregarAlCarrito(producto)}
                        style={{
                          width: '100%',
                          padding: '12px 20px',
                          backgroundColor: '#27AE60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '15px',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#229954';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#27AE60';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}>
                        ➕ Agregar al carrito
                      </button>
                    ) : (
                      <div style={{
                        width: '100%',
                        padding: '12px 20px',
                        backgroundColor: '#E74C3C',
                        color: 'white',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        opacity: 0.7,
                        fontSize: '15px'
                      }}>
                        🚫 Producto Agotado
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel del carrito */}
        <div style={{
          width: '400px', backgroundColor: '#1A2332',
          borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          padding: '20px', height: 'fit-content',
          position: 'sticky', top: '20px', color: 'white'
        }}>
          <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛒 Carrito
            {totalItems > 0 && (
              <span style={{
                backgroundColor: '#FF6B00', color: 'white',
                padding: '2px 12px', borderRadius: '20px', fontSize: '14px'
              }}>
                {totalItems}
              </span>
            )}
          </h2>

          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#5A6B7F' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🛒</div>
              <p>Tu carrito está vacío</p>
              <p style={{ fontSize: '13px' }}>Agrega productos para hacer tu pedido</p>
            </div>
          ) : (
            <>
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                {carrito.map(item => (
                  <div key={item.claveUnica} style={{
                    padding: '12px', backgroundColor: '#0F1621',
                    borderRadius: '10px', marginBottom: '10px',
                    border: '1px solid #2A3547'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#8B9BB0', marginTop: '3px' }}>
                      {item.talla && `Talla: ${item.talla}`}
                      {item.talla && item.color && ' • '}
                      {item.color && `Color: ${item.color}`}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button onClick={() => cambiarCantidad(item.claveUnica, item.cantidad - 1)}
                          style={{
                            width: '24px', height: '24px', border: 'none',
                            borderRadius: '6px', backgroundColor: '#2A3547',
                            color: 'white', cursor: 'pointer', fontWeight: 'bold'
                          }}>−</button>
                        <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                        <button onClick={() => cambiarCantidad(item.claveUnica, item.cantidad + 1)}
                          style={{
                            width: '24px', height: '24px', border: 'none',
                            borderRadius: '6px', backgroundColor: '#2A3547',
                            color: 'white', cursor: 'pointer', fontWeight: 'bold'
                          }}>+</button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <strong style={{ color: '#FF6B00' }}>
                          ${(item.cantidad * item.precio_unitario).toFixed(2)}
                        </strong>
                        <button onClick={() => eliminarDelCarrito(item.claveUnica)}
                          style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer', fontSize: '16px' }}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tipo de entrega */}
              <div style={{
                padding: '15px', backgroundColor: '#0F1621',
                borderRadius: '12px', marginBottom: '15px',
                border: '1px solid #2A3547'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>
                  📍 Tipo de entrega:
                </div>

                {envioHabilitado ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button onClick={() => setTipoEntrega('retiro')}
                      style={{
                        padding: '12px',
                        backgroundColor: tipoEntrega === 'retiro' ? '#FF6B00' : '#1A2332',
                        color: 'white',
                        border: tipoEntrega === 'retiro' ? 'none' : '2px solid #2A3547',
                        borderRadius: '10px', cursor: 'pointer',
                        fontWeight: 'bold', fontSize: '13px'
                      }}>
                      🏪 Retiro
                    </button>
                    <button onClick={() => setTipoEntrega('domicilio')}
                      style={{
                        padding: '12px',
                        backgroundColor: tipoEntrega === 'domicilio' ? '#FF6B00' : '#1A2332',
                        color: 'white',
                        border: tipoEntrega === 'domicilio' ? 'none' : '2px solid #2A3547',
                        borderRadius: '10px', cursor: 'pointer',
                        fontWeight: 'bold', fontSize: '13px'
                      }}>
                      🚚 Domicilio
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '12px', backgroundColor: '#FFB800',
                    color: 'white', borderRadius: '10px',
                    fontWeight: 'bold', fontSize: '13px', textAlign: 'center'
                  }}>
                    🏪 RETIRO EN TIENDA
                  </div>
                )}

                {tipoEntrega === 'domicilio' && envioHabilitado && (
                  <div style={{ marginTop: '12px' }}>
                    <label style={{
                      display: 'block', fontSize: '12px',
                      fontWeight: 'bold', color: '#8B9BB0', marginBottom: '5px'
                    }}>
                      Dirección de entrega:
                    </label>
                    <textarea
                      value={direccion} onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Calle, número, referencia..." rows="2"
                      style={{
                        width: '100%', padding: '10px',
                        borderRadius: '8px', border: '2px solid #2A3547',
                        fontSize: '13px', boxSizing: 'border-box',
                        resize: 'vertical', fontFamily: 'inherit',
                        color: 'white', backgroundColor: '#0F1621'
                      }}
                    />
                    <div style={{
                      marginTop: '8px', fontSize: '12px',
                      color: '#8B9BB0', display: 'flex', justifyContent: 'space-between'
                    }}>
                      <span>Costo de envío:</span>
                      <strong style={{ color: '#FF6B00' }}>${costoEnvio.toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Totales */}
              <div style={{ borderTop: '2px solid #2A3547', paddingTop: '15px' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: '8px', fontSize: '14px', color: '#8B9BB0'
                }}>
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {tipoEntrega === 'domicilio' && envioHabilitado && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: '8px', fontSize: '14px', color: '#8B9BB0'
                  }}>
                    <span>Envío a domicilio:</span>
                    <span>${costoEnvio.toFixed(2)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '22px', fontWeight: 'bold',
                  marginBottom: '15px', paddingTop: '10px',
                  borderTop: '2px solid #FF6B00'
                }}>
                  <span>Total:</span>
                  <span style={{ color: '#FF6B00' }}>${totalFinal.toFixed(2)}</span>
                </div>

                <button onClick={abrirModalPago} disabled={enviando}
                  style={{
                    width: '100%', padding: '16px',
                    backgroundColor: enviando ? '#666' : '#27AE60',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontSize: '16px', fontWeight: 'bold',
                    cursor: enviando ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(39,174,96,0.3)'
                  }}>
                  {enviando ? 'Enviando...' : '📤 ENVIAR PEDIDO'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de pago */}
      {modalPago && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: c.card, padding: '30px', borderRadius: '16px',
            maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0, color: c.texto, marginBottom: '10px' }}>
              💳 ¿Cómo quieres pagar?
            </h2>
            <p style={{ color: c.textoSuave, fontSize: '14px', marginBottom: '20px' }}>
              Total a pagar: <strong style={{ color: '#FF6B00', fontSize: '20px' }}>${totalFinal.toFixed(2)}</strong>
            </p>

            {pagoAppHabilitado && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  padding: '20px', borderRadius: '12px',
                  border: '2px solid #FF6B00',
                  backgroundColor: esOscuro ? 'rgba(255,107,0,0.1)' : '#FFF7ED',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    fontWeight: 'bold', color: '#FF6B00',
                    fontSize: '16px', marginBottom: '10px'
                  }}>
                    💳 Pagar ahora (recomendado)
                  </div>
                  <p style={{ color: c.textoSuave, fontSize: '13px', marginBottom: '15px' }}>
                    {config.texto_instrucciones_pago || 'Escanea el QR, paga y sube el comprobante.'}
                  </p>

                  {config.qr_transfermovil ? (
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                      <img
                        src={`${getApiUrl()}${config.qr_transfermovil}`}
                        alt="QR Transfermóvil"
                        style={{
                          width: '200px', height: '200px',
                          borderRadius: '12px', border: '3px solid #FF6B00',
                          padding: '10px', backgroundColor: 'white'
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      padding: '20px', textAlign: 'center',
                      backgroundColor: c.cardSecundario, borderRadius: '10px',
                      color: c.textoMuted, fontSize: '13px', marginBottom: '15px'
                    }}>
                      ⚠️ El administrador aún no ha configurado el QR
                    </div>
                  )}

                  <div style={{ marginTop: '15px' }}>
                    <label style={{
                      display: 'block', fontWeight: 'bold',
                      marginBottom: '8px', color: c.texto, fontSize: '14px'
                    }}>
                      📸 Sube el comprobante del pago:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleComprobanteChange}
                      style={{
                        width: '100%', padding: '10px',
                        borderRadius: '10px',
                        border: `2px solid ${c.inputBorder}`,
                        fontSize: '13px',
                        backgroundColor: c.inputBg, color: c.texto,
                        boxSizing: 'border-box'
                      }}
                    />

                    {previewComprobante && (
                      <div style={{ marginTop: '10px', textAlign: 'center' }}>
                        <img
                          src={previewComprobante}
                          alt="Comprobante"
                          style={{
                            maxWidth: '100%', maxHeight: '200px',
                            borderRadius: '10px', border: '2px solid #27AE60'
                          }}
                        />
                        <div style={{
                          marginTop: '5px', fontSize: '12px',
                          color: '#27AE60', fontWeight: 'bold'
                        }}>
                          ✅ Imagen lista para enviar
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={enviarPedidoConPago}
                    disabled={enviando || !comprobanteFile}
                    style={{
                      width: '100%', marginTop: '15px', padding: '14px',
                      backgroundColor: enviando || !comprobanteFile ? '#666' : '#FF6B00',
                      color: 'white', border: 'none', borderRadius: '10px',
                      fontWeight: 'bold', fontSize: '15px',
                      cursor: enviando || !comprobanteFile ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {enviando ? '⏳ Enviando...' : '✅ Enviar pedido con pago'}
                  </button>
                </div>
              </div>
            )}

            <div style={{
              padding: '20px', borderRadius: '12px',
              border: `2px solid ${c.borde}`,
              backgroundColor: c.cardSecundario
            }}>
              <div style={{
                fontWeight: 'bold', color: c.texto,
                fontSize: '16px', marginBottom: '10px'
              }}>
                💵 Pagar al recibir
              </div>
              <p style={{ color: c.textoSuave, fontSize: '13px', marginBottom: '15px' }}>
                Realizas el pedido ahora y pagas cuando lo retires o lo recibas en casa.
              </p>

              <button
                onClick={enviarPedidoNormal}
                disabled={enviando}
                style={{
                  width: '100%', padding: '14px',
                  backgroundColor: enviando ? '#666' : '#27AE60',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontWeight: 'bold', fontSize: '15px',
                  cursor: enviando ? 'not-allowed' : 'pointer'
                }}
              >
                {enviando ? '⏳ Enviando...' : '✅ Enviar pedido (pago al recibir)'}
              </button>
            </div>

            <button
              onClick={() => {
                setModalPago(false);
                setComprobanteFile(null);
                setPreviewComprobante(null);
              }}
              disabled={enviando}
              style={{
                width: '100%', marginTop: '15px', padding: '12px',
                backgroundColor: 'transparent',
                color: c.textoSuave,
                border: `2px solid ${c.borde}`,
                borderRadius: '10px', fontWeight: 'bold', fontSize: '14px',
                cursor: enviando ? 'not-allowed' : 'pointer'
              }}
            >
              ← Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteTPVScreen;
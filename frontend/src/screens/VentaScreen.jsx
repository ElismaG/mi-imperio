// VentaScreen.jsx - Punto de Venta con diseño corregido
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import ModalCobro from '../components/tpv/ModalCobro';
import { useThemeStore } from '../core/stores/themeStore';
import { getApiUrl } from '../core/utils/apiUrl';

const VentaScreen = ({ usuario }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [selecciones, setSelecciones] = useState({});

  const { tema } = useThemeStore();
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
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [productosRes, categoriasRes] = await Promise.all([
        apiClient.get('/productos'),
        apiClient.get('/categorias').catch(() => ({ data: [] }))
      ]);
      setProductos(productosRes.data);
      setCategorias(categoriasRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await apiClient.get('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const stockReservado = (producto_id) => {
    return carrito.filter(item => item.producto_id === producto_id).reduce((sum, item) => sum + item.cantidad, 0);
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

  const obtenerSeleccion = (producto_id, categoria_id) => {
    const seleccion = selecciones[producto_id] || {};
    const tallaDisponible = mostrarTalla(categoria_id);
    const colorDisponible = mostrarColor(categoria_id);
    return {
      talla: tallaDisponible ? (seleccion.talla || 'M') : null,
      color: colorDisponible ? (seleccion.color || 'Rojo') : null
    };
  };

  const agregarAlCarrito = (producto, cantidad = 1) => {
    const { talla, color } = obtenerSeleccion(producto.id, producto.categoria_id);
    const claveUnica = `${producto.id}-${talla || ''}-${color || ''}`;
    const existente = carrito.find(item => item.claveUnica === claveUnica);
    const cantidadEnCarrito = existente ? existente.cantidad : 0;
    const stockDisponible = producto.stock_actual;

    if (stockDisponible <= 0) {
      setMensaje(`❌ "${producto.nombre}" está agotado`);
      setTimeout(() => setMensaje(null), 3000);
      return;
    }

    if (cantidadEnCarrito + cantidad > stockDisponible) {
      setMensaje(`⚠️ Solo hay ${stockDisponible} unidad(es) de "${producto.nombre}"`);
      setTimeout(() => setMensaje(null), 3000);
      return;
    }

    if (existente) {
      setCarrito(carrito.map(item =>
        item.claveUnica === claveUnica
          ? { ...item, cantidad: item.cantidad + cantidad }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        claveUnica,
        producto_id: producto.id,
        nombre: producto.nombre,
        imagen: producto.imagen_principal,
        precio_unitario: parseFloat(producto.precio_venta),
        cantidad: cantidad,
        categoria_id: producto.categoria_id,
        stock_disponible: producto.stock_actual,
        talla: talla,
        color: color
      }]);
    }
    setMensaje(`✅ "${producto.nombre}" agregado`);
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
      setMensaje(`⚠️ Solo hay ${item.stock_disponible} unidad(es) de "${item.nombre}"`);
      setTimeout(() => setMensaje(null), 3000);
      return;
    }

    setCarrito(carrito.map(i =>
      i.claveUnica === claveUnica ? { ...i, cantidad: nuevaCantidad } : i
    ));
  };

  const eliminarDelCarrito = (claveUnica) => {
    setCarrito(carrito.filter(item => item.claveUnica !== claveUnica));
  };

  const total = carrito.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  const handleVentaCompletada = (venta) => {
    setMensaje(`✅ Venta #${venta.id} realizada por $${venta.total}${venta.pin_retiro ? ` - PIN: ${venta.pin_retiro}` : ''}`);
    setCarrito([]);
    setSelecciones({});
    cargarProductos();
    setModalCobroAbierto(false);
    setTimeout(() => setMensaje(null), 5000);
  };

  const getCategoriaColor = (categoria_id) => {
    const cat = categorias.find(c => c.id === categoria_id);
    if (!cat) return { bg: '#9B59B6', text: 'white', icono: '📦', nombre: 'Otros' };
    switch (cat.nombre) {
      case 'Comida': return { bg: '#4CAF50', text: 'white', icono: '🍴', nombre: 'Comida' };
      case 'Ropa': return { bg: '#4A90E2', text: 'white', icono: '👕', nombre: 'Ropa' };
      case 'Electrodomésticos': return { bg: '#E67E22', text: 'white', icono: '🔌', nombre: 'Electrodomésticos' };
      case 'Vehículos': return { bg: '#E74C3C', text: 'white', icono: '🚗', nombre: 'Vehículos' };
      case 'Juguetes': return { bg: '#9B59B6', text: 'white', icono: '🧸', nombre: 'Juguetes' };
      case 'Construcción': return { bg: '#F1C40F', text: 'white', icono: '🏗️', nombre: 'Construcción' };
      default: return { bg: '#9B59B6', text: 'white', icono: '📦', nombre: cat.nombre };
    }
  };

  const mostrarTalla = (categoria_id) => {
    const cat = categorias.find(c => c.id === categoria_id);
    return cat?.nombre === 'Ropa';
  };

  const mostrarColor = (categoria_id) => {
    const cat = categorias.find(c => c.id === categoria_id);
    return ['Ropa', 'Electrodomésticos', 'Vehículos', 'Juguetes'].includes(cat?.nombre);
  };

  const coloresDisponibles = [
    { hex: '#E74C3C', nombre: 'Rojo' },
    { hex: '#3498DB', nombre: 'Azul' },
    { hex: '#2ECC71', nombre: 'Verde' },
    { hex: '#F1C40F', nombre: 'Amarillo' },
    { hex: '#333333', nombre: 'Negro' },
    { hex: '#FFFFFF', nombre: 'Blanco' }
  ];

  const productosFiltrados = productos.filter(p => {
    if (categoriaFiltro !== 'todas' && p.categoria_id !== parseInt(categoriaFiltro)) return false;
    if (busqueda) {
      return p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
             (p.codigo_barras && p.codigo_barras.includes(busqueda));
    }
    return true;
  });

  if (cargando) return (
    <div style={{ padding: '60px', textAlign: 'center', color: c.textoSuave, backgroundColor: c.fondo, minHeight: '100vh' }}>
      Cargando productos...
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo }}>

      {/* ═══════ PANEL IZQUIERDO: PRODUCTOS ═══════ */}
      <div style={{ flex: 1, backgroundColor: c.fondo, overflowY: 'auto', padding: '20px' }}>

        {mensaje && (
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '12px',
            backgroundColor: mensaje.includes('✅') ? (esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda') : mensaje.includes('⚠️') ? (esOscuro ? 'rgba(255,184,0,0.2)' : '#fff3cd') : (esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da'),
            color: mensaje.includes('✅') ? (esOscuro ? '#7de8a8' : '#155724') : mensaje.includes('⚠️') ? (esOscuro ? '#ffd966' : '#856404') : (esOscuro ? '#ff9999' : '#721c24'),
            fontWeight: 'bold',
            boxShadow: c.sombra
          }}>
            {mensaje}
          </div>
        )}

        {/* Filtros por categoría */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
          <button
            onClick={() => setCategoriaFiltro('todas')}
            style={{
              padding: '12px 24px',
              borderRadius: '25px',
              border: 'none',
              backgroundColor: categoriaFiltro === 'todas' ? '#2196F3' : c.card,
              color: categoriaFiltro === 'todas' ? 'white' : c.texto,
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: categoriaFiltro === 'todas' ? '0 2px 8px rgba(33,150,243,0.4)' : c.sombra,
              fontSize: '14px'
            }}
          >
            Todos
          </button>
          {categorias.map((cat) => {
            const color = getCategoriaColor(cat.id);
            const activo = categoriaFiltro === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaFiltro(String(cat.id))}
                style={{
                  padding: '12px 24px',
                  borderRadius: '25px',
                  border: 'none',
                  backgroundColor: activo ? color.bg : c.card,
                  color: activo ? 'white' : c.texto,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: activo ? `0 2px 8px ${color.bg}66` : c.sombra,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{color.icono}</span>
                {cat.nombre}
              </button>
            );
          })}
        </div>

        {/* Lista de productos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {productosFiltrados.map((producto) => {
            const color = getCategoriaColor(producto.categoria_id);
            const tallaDisponible = mostrarTalla(producto.categoria_id);
            const colorDisponible = mostrarColor(producto.categoria_id);
            const seleccion = obtenerSeleccion(producto.id, producto.categoria_id);
            const stockActual = stockMostrado(producto);
            const agotado = stockActual <= 0;
            const stockBajo = stockActual > 0 && stockActual <= 5;
            const tieneOpciones = !agotado && (tallaDisponible || colorDisponible);

            return (
              <div
                key={producto.id}
                style={{
                  padding: '15px',
                  backgroundColor: agotado ? (esOscuro ? '#0A0F16' : '#F8F8F8') : c.card,
                  borderRadius: '16px',
                  border: agotado ? '2px dashed #E74C3C' : `1px solid ${c.borde}`,
                  boxShadow: c.sombra,
                  opacity: agotado ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Fila 1: Imagen + Info + Stock */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                  marginBottom: tieneOpciones ? '12px' : '12px'
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
                    flexShrink: 0,
                    filter: agotado ? 'grayscale(100%)' : 'none'
                  }}>
                    {producto.imagen_principal ? (
                      <img
                        src={`${getApiUrl()}${producto.imagen_principal}`}
                        alt={producto.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : '📦'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      backgroundColor: color.bg,
                      color: color.text,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '6px'
                    }}>
                      {color.icono} {color.nombre}
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

                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF6B00' }}>
                      ${producto.precio_venta}
                    </div>
                  </div>

                  {/* Stock badge */}
                  <div style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    backgroundColor:
                      agotado ? '#E74C3C' :
                      stockBajo ? (esOscuro ? 'rgba(255,184,0,0.2)' : '#FFF3CD') :
                      (esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda'),
                    color:
                      agotado ? 'white' :
                      stockBajo ? (esOscuro ? '#ffd966' : '#856404') :
                      (esOscuro ? '#7de8a8' : '#155724'),
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {agotado ? '🚫 Agotado' :
                     stockBajo ? `⚠️ ${stockActual} restantes` :
                     `Stock: ${stockActual}`}
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
                    {tallaDisponible && (
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
                          value={seleccion.talla}
                          onChange={(e) => actualizarSeleccion(producto.id, 'talla', e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: `2px solid ${c.inputBorder}`,
                            fontSize: '14px',
                            backgroundColor: c.inputBg,
                            color: c.texto,
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            outline: 'none'
                          }}
                        >
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                        </select>
                      </div>
                    )}

                    {/* Color */}
                    {colorDisponible && (
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
                          {coloresDisponibles.map((col) => {
                            const seleccionado = seleccion.color === col.nombre;
                            return (
                              <div
                                key={col.nombre}
                                title={col.nombre}
                                onClick={() => actualizarSeleccion(producto.id, 'color', col.nombre)}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
                                  backgroundColor: col.hex,
                                  cursor: 'pointer',
                                  border: seleccionado ? '3px solid #FF6B00' : `2px solid ${c.card}`,
                                  boxShadow: seleccionado ? '0 0 0 2px #FF6B00' : `0 0 0 1px ${c.borde}`,
                                  transition: 'all 0.2s',
                                  position: 'relative',
                                  flexShrink: 0
                                }}
                              >
                                {seleccionado && (
                                  <span style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: col.hex === '#FFFFFF' ? '#333' : 'white',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}>
                                    ✓
                                  </span>
                                )}
                              </div>
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
                    onClick={() => agregarAlCarrito(producto, 1)}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      backgroundColor: '#27AE60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(39,174,96,0.3)',
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
                    }}
                  >
                    ➕ Agregar al carrito
                  </button>
                ) : (
                  <div style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: '#E74C3C',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    opacity: 0.7
                  }}>
                    🚫 Producto Agotado
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {productosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', color: c.textoMuted, marginTop: '60px', fontSize: '16px' }}>
            🔍 No se encontraron productos
          </div>
        )}
      </div>

      {/* ═══════ PANEL DERECHO: CARRITO ═══════ */}
      <div style={{
        width: '420px',
        backgroundColor: '#1A2332',
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        boxShadow: '-4px 0 12px rgba(0,0,0,0.3)'
      }}>

        <div style={{ padding: '20px', borderBottom: '1px solid #2A3547' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🛒 Carrito
              {totalItems > 0 && (
                <span style={{
                  backgroundColor: '#FF6B00',
                  padding: '2px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {totalItems}
                </span>
              )}
            </h2>
            {carrito.length > 0 && (
              <button
                onClick={() => setCarrito([])}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(231, 76, 60, 0.2)',
                  color: '#FF6B6B',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                🗑️ Vaciar
              </button>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px 12px 45px',
                borderRadius: '12px',
                border: '1px solid #2A3547',
                backgroundColor: '#0F1621',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '18px',
              opacity: 0.6
            }}>🔍</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '15px 20px' }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5A6B7F' }}>
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>🛒</div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#8B9BB0' }}>Carrito vacío</div>
              <div style={{ fontSize: '13px' }}>Toca un producto para agregarlo</div>
            </div>
          ) : (
            carrito.map((item) => (
              <div key={item.claveUnica} style={{
                padding: '12px',
                backgroundColor: '#0F1621',
                borderRadius: '12px',
                marginBottom: '10px',
                border: '1px solid #2A3547',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#1A2332',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  {item.imagen ? (
                    <img
                      src={`${getApiUrl()}${item.imagen}`}
                      alt={item.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : '📦'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.nombre}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    {item.talla && (
                      <span style={{
                        backgroundColor: '#2A3547',
                        color: '#8B9BB0',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        Talla: {item.talla}
                      </span>
                    )}
                    {item.color && (
                      <span style={{
                        backgroundColor: '#2A3547',
                        color: '#8B9BB0',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        Color:
                        <span style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: coloresDisponibles.find(c => c.nombre === item.color)?.hex || '#333',
                          border: '1px solid #555'
                        }} />
                        {item.color}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: '#8B9BB0' }}>
                    ${item.precio_unitario.toFixed(2)} c/u
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => cambiarCantidad(item.claveUnica, item.cantidad - 1)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#2A3547',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => cambiarCantidad(item.claveUnica, item.cantidad + 1)}
                    disabled={item.cantidad >= item.stock_disponible}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: item.cantidad >= item.stock_disponible ? '#1A2332' : '#2A3547',
                      color: 'white',
                      cursor: item.cantidad >= item.stock_disponible ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      opacity: item.cantidad >= item.stock_disponible ? 0.5 : 1
                    }}
                  >
                    +
                  </button>
                </div>

                <div style={{ textAlign: 'right', minWidth: '70px' }}>
                  <div style={{ fontWeight: 'bold', color: '#FF6B00', fontSize: '14px' }}>
                    ${(item.cantidad * item.precio_unitario).toFixed(2)}
                  </div>
                  <button
                    onClick={() => eliminarDelCarrito(item.claveUnica)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E74C3C',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: '0',
                      marginTop: '4px'
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{
          padding: '20px',
          borderTop: '1px solid #2A3547',
          backgroundColor: '#0F1621'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <span style={{ fontSize: '16px', color: '#8B9BB0', fontWeight: 'bold' }}>TOTAL</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF6B00' }}>
              ${total.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => carrito.length > 0 && setModalCobroAbierto(true)}
            disabled={carrito.length === 0}
            style={{
              width: '100%',
              padding: '22px',
              backgroundColor: carrito.length === 0 ? '#2A3547' : '#FF6B00',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '22px',
              fontWeight: 'bold',
              cursor: carrito.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: carrito.length === 0 ? 'none' : '0 6px 20px rgba(255,107,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              letterSpacing: '2px'
            }}
            onMouseEnter={(e) => {
              if (carrito.length > 0) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,107,0,0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = carrito.length === 0 ? 'none' : '0 6px 20px rgba(255,107,0,0.4)';
            }}
          >
            <span>💳</span> COBRAR
          </button>
        </div>
      </div>

      {modalCobroAbierto && (
        <ModalCobro
          total={total}
          carrito={carrito}
          usuario={usuario}
          onClose={() => setModalCobroAbierto(false)}
          onVentaCompletada={handleVentaCompletada}
        />
      )}
    </div>
  );
};

export default VentaScreen;
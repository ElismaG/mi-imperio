// PedidosPendientesScreen.jsx - Con verificación de comprobantes de pago
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';
import { getApiUrl } from '../core/utils/apiUrl';

const PedidosPendientesScreen = ({ usuario }) => {
  const [pedidos, setPedidos] = useState([]);
  const [pagosPorVerificar, setPagosPorVerificar] = useState([]);
  const [pin, setPin] = useState('');
  const [pedidoEncontrado, setPedidoEncontrado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tab, setTab] = useState('pendientes'); // 'pendientes' | 'pagos'
  const [modalCobro, setModalCobro] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [comprobanteVer, setComprobanteVer] = useState(null);

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
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    await Promise.all([cargarPedidos(), cargarPagosPorVerificar()]);
  };

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      const response = await apiClient.get('/pedidos/pendientes');
      setPedidos(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarPagosPorVerificar = async () => {
    try {
      const response = await apiClient.get('/pedidos/pagos-por-verificar');
      setPagosPorVerificar(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const buscarPorPin = async () => {
    if (pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos');
      return;
    }
    setError('');
    setPedidoEncontrado(null);

    try {
      const response = await apiClient.get(`/pedidos/buscar/${pin}`);
      setPedidoEncontrado(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontró el pedido');
    }
  };

  const abrirModalCobro = () => {
    setMetodoPago('efectivo');
    setEfectivoRecibido('');
    setPagoConfirmado(false);
    setModalCobro(true);
  };

  const cobrarPedido = async () => {
    if (!pedidoEncontrado) return;

    if (metodoPago === 'efectivo') {
      const recibido = parseFloat(efectivoRecibido);
      const total = parseFloat(pedidoEncontrado.pedido.total);
      if (!recibido || recibido < total) {
        alert('❌ El efectivo recibido debe ser mayor o igual al total');
        return;
      }
    }

    if (metodoPago === 'transfermovil' && !pagoConfirmado) {
      alert('❌ Debes confirmar que el cliente ya pagó por Transfermóvil');
      return;
    }

    setConfirmando(true);
    try {
      await apiClient.post(`/pedidos/${pedidoEncontrado.pedido.id}/cobrar`, {
        metodo_pago: metodoPago,
        usuario_id: usuario?.id || 1
      });
      setMensaje(`✅ Pedido #${pedidoEncontrado.pedido.id} cobrado exitosamente`);
      setPedidoEncontrado(null);
      setPin('');
      setModalCobro(false);
      cargarTodo();
      setTimeout(() => setMensaje(''), 5000);
    } catch (err) {
      setError('Error al cobrar el pedido');
    } finally {
      setConfirmando(false);
    }
  };

  // ═══════════ VERIFICACIÓN DE PAGOS ═══════════

  const aprobarPago = async (pagoId) => {
    if (!window.confirm('¿Aprobar este comprobante de pago?\n\nEl pedido se marcará como PAGADO.')) return;

    try {
      await apiClient.post(`/pedidos/${pagoId}/verificar-pago`, {
        accion: 'aprobar',
        usuario_id: usuario?.id || 1
      });
      setMensaje('✅ Pago aprobado exitosamente');
      setComprobanteVer(null);
      cargarTodo();
      setTimeout(() => setMensaje(''), 5000);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al aprobar pago');
    }
  };

  const rechazarPago = async (pagoId) => {
    const motivo = window.prompt('Motivo del rechazo (opcional):');
    if (motivo === null) return; // Canceló

    if (!window.confirm('¿Rechazar este comprobante?\n\nEl pedido quedará pendiente de pago.')) return;

    try {
      await apiClient.post(`/pedidos/${pagoId}/verificar-pago`, {
        accion: 'rechazar',
        usuario_id: usuario?.id || 1,
        motivo: motivo || 'Comprobante no válido'
      });
      setMensaje('⚠️ Pago rechazado');
      setComprobanteVer(null);
      cargarTodo();
      setTimeout(() => setMensaje(''), 5000);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al rechazar pago');
    }
  };

  const total = pedidoEncontrado ? parseFloat(pedidoEncontrado.pedido.total) : 0;
  const cambio = efectivoRecibido ? parseFloat(efectivoRecibido) - total : 0;

  return (
    <div style={{
      padding: '30px', maxWidth: '1200px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)', transition: 'background-color 0.3s ease'
    }}>
      <h1 style={{ color: c.texto, marginBottom: '20px' }}>📋 Pedidos Pendientes</h1>

      {mensaje && (
        <div style={{
          padding: '15px', marginBottom: '20px', borderRadius: '10px',
          backgroundColor: esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda',
          color: esOscuro ? '#7de8a8' : '#155724', fontWeight: 'bold'
        }}>{mensaje}</div>
      )}

      {error && (
        <div style={{
          padding: '15px', marginBottom: '20px', borderRadius: '10px',
          backgroundColor: esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da',
          color: esOscuro ? '#ff9999' : '#721c24', fontWeight: 'bold'
        }}>{error}</div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '25px',
        borderBottom: `2px solid ${c.borde}`, paddingBottom: '0'
      }}>
        <button
          onClick={() => setTab('pendientes')}
          style={{
            padding: '12px 24px',
            border: 'none', backgroundColor: 'transparent',
            color: tab === 'pendientes' ? '#27AE60' : c.textoSuave,
            fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
            borderBottom: tab === 'pendientes' ? '3px solid #27AE60' : '3px solid transparent',
            marginBottom: '-2px'
          }}
        >
          📋 Pedidos pendientes ({pedidos.length})
        </button>
        <button
          onClick={() => setTab('pagos')}
          style={{
            padding: '12px 24px',
            border: 'none', backgroundColor: 'transparent',
            color: tab === 'pagos' ? '#FFB800' : c.textoSuave,
            fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
            borderBottom: tab === 'pagos' ? '3px solid #FFB800' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          💳 Pagos por verificar
          {pagosPorVerificar.length > 0 && (
            <span style={{
              backgroundColor: '#FFB800', color: 'white',
              padding: '2px 10px', borderRadius: '12px',
              fontSize: '12px', fontWeight: 'bold'
            }}>
              {pagosPorVerificar.length}
            </span>
          )}
        </button>
      </div>

      {/* ═══ TAB: PEDIDOS PENDIENTES ═══ */}
      {tab === 'pendientes' && (
        <>
          <div style={{
            backgroundColor: c.card, padding: '25px', borderRadius: '16px',
            boxShadow: c.sombra, marginBottom: '25px'
          }}>
            <h2 style={{ marginTop: 0, color: c.texto }}>🔑 Buscar pedido por PIN</h2>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text" value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyPress={(e) => e.key === 'Enter' && buscarPorPin()}
                placeholder="• • • •" maxLength="4"
                style={{
                  width: '150px', padding: '18px', fontSize: '28px',
                  textAlign: 'center', letterSpacing: '8px', fontWeight: 'bold',
                  borderRadius: '12px', border: `2px solid ${c.inputBorder}`,
                  backgroundColor: c.inputBg, color: c.texto
                }}
              />
              <button
                onClick={buscarPorPin}
                disabled={pin.length !== 4}
                style={{
                  padding: '18px 35px',
                  backgroundColor: pin.length !== 4 ? '#666' : '#FF6B00',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontSize: '16px', fontWeight: 'bold',
                  cursor: pin.length !== 4 ? 'not-allowed' : 'pointer'
                }}
              >
                🔍 Buscar
              </button>
            </div>
          </div>

          {pedidoEncontrado && (
            <div style={{
              backgroundColor: c.card, padding: '25px', borderRadius: '16px',
              boxShadow: c.sombra, marginBottom: '25px', border: '3px solid #FF6B00'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0, color: c.texto }}>📦 Pedido #{pedidoEncontrado.pedido.id}</h2>
                <div style={{ backgroundColor: '#FF6B00', color: 'white', padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold' }}>
                  PIN: {pedidoEncontrado.pedido.pin_retiro}
                </div>
              </div>

              {/* Estado de pago */}
              {pedidoEncontrado.pedido.estado_pago === 'verificado' && (
                <div style={{
                  padding: '15px', backgroundColor: esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda',
                  color: esOscuro ? '#7de8a8' : '#155724',
                  borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  PAGO YA VERIFICADO - No cobrar de nuevo
                </div>
              )}

              {pedidoEncontrado.pedido.estado_pago === 'en_verificacion' && (
                <div style={{
                  padding: '15px', backgroundColor: esOscuro ? 'rgba(255,184,0,0.2)' : '#FFF9E6',
                  color: esOscuro ? '#ffd966' : '#856404',
                  borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <span style={{ fontSize: '20px' }}>⏳</span>
                  Pago pendiente de verificación
                </div>
              )}

              <div style={{ padding: '15px', backgroundColor: c.cardSecundario, borderRadius: '10px', marginBottom: '20px' }}>
                <strong style={{ color: c.texto }}>{pedidoEncontrado.cliente.nombre}</strong>
                {pedidoEncontrado.cliente.telefono && (
                  <div style={{ fontSize: '14px', color: c.textoSuave, marginTop: '4px' }}>
                    📞 {pedidoEncontrado.cliente.telefono}
                  </div>
                )}
              </div>

              <h3 style={{ color: c.texto }}>Productos:</h3>
              {pedidoEncontrado.productos.map(p => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '12px', backgroundColor: c.cardSecundario,
                  borderRadius: '10px', marginBottom: '10px'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: c.texto }}>{p.nombre}</div>
                    {p.talla && <div style={{ fontSize: '12px', color: '#4A90E2' }}>📏 Talla: {p.talla}</div>}
                    {p.color && <div style={{ fontSize: '12px', color: '#9B59B6' }}>🎨 Color: {p.color}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: c.texto }}>x{p.cantidad}</div>
                    <div style={{ color: '#FF6B00', fontWeight: 'bold' }}>${parseFloat(p.subtotal).toFixed(2)}</div>
                  </div>
                </div>
              ))}

              <div style={{
                display: 'flex', justifyContent: 'space-between', fontSize: '24px',
                fontWeight: 'bold', marginTop: '20px', marginBottom: '20px'
              }}>
                <span style={{ color: c.texto }}>Total:</span>
                <span style={{ color: '#FF6B00' }}>${total.toFixed(2)}</span>
              </div>

              {/* Solo permitir cobro si el pago NO está verificado ya */}
              {pedidoEncontrado.pedido.estado_pago !== 'verificado' ? (
                <button onClick={abrirModalCobro}
                  style={{
                    width: '100%', padding: '18px', backgroundColor: '#27AE60',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(39,174,96,0.3)'
                  }}>
                  💳 COBRAR PEDIDO
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (window.confirm(`¿Marcar el pedido #${pedidoEncontrado.pedido.id} como entregado?`)) {
                      try {
                        await apiClient.post(`/pedidos/${pedidoEncontrado.pedido.id}/cobrar`, {
                          metodo_pago: 'app_verificado',
                          usuario_id: usuario?.id || 1
                        });
                        setMensaje('✅ Pedido entregado');
                        setPedidoEncontrado(null);
                        setPin('');
                        cargarTodo();
                        setTimeout(() => setMensaje(''), 5000);
                      } catch (err) {
                        alert('Error al entregar');
                      }
                    }
                  }}
                  style={{
                    width: '100%', padding: '18px', backgroundColor: '#4A90E2',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(74,144,226,0.3)'
                  }}>
                  📦 MARCAR COMO ENTREGADO (YA PAGADO)
                </button>
              )}
            </div>
          )}

          {/* Lista de pedidos pendientes */}
          <div style={{ backgroundColor: c.card, padding: '25px', borderRadius: '16px', boxShadow: c.sombra }}>
            <h2 style={{ marginTop: 0, color: c.texto }}>
              📋 Todos los pedidos ({pedidos.length})
            </h2>

            {cargando ? (
              <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>Cargando...</div>
            ) : pedidos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>
                No hay pedidos pendientes
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pedidos.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '15px', backgroundColor: c.cardSecundario,
                    borderRadius: '10px', borderLeft: '4px solid #FFB800',
                    flexWrap: 'wrap', gap: '10px'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: c.texto }}>
                        Pedido #{p.id} • {p.cliente_nombre || 'Cliente'}
                      </div>
                      <div style={{ fontSize: '12px', color: c.textoSuave, marginTop: '3px' }}>
                        {p.total_productos} producto(s) • {new Date(p.fecha_venta).toLocaleString('es-ES')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#FF6B00', fontSize: '18px' }}>
                        ${parseFloat(p.total).toFixed(2)}
                      </div>
                      <div style={{
                        fontSize: '12px', backgroundColor: '#FFB800', color: 'white',
                        padding: '3px 10px', borderRadius: '10px',
                        marginTop: '4px', fontWeight: 'bold'
                      }}>
                        PIN: {p.pin_retiro}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ TAB: PAGOS POR VERIFICAR ═══ */}
      {tab === 'pagos' && (
        <div>
          {pagosPorVerificar.length === 0 ? (
            <div style={{
              backgroundColor: c.card, padding: '60px', borderRadius: '16px',
              textAlign: 'center', color: c.textoMuted, boxShadow: c.sombra
            }}>
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>✅</div>
              <h2 style={{ color: '#27AE60', marginTop: 0 }}>No hay pagos por verificar</h2>
              <p>Todos los pagos han sido procesados</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {pagosPorVerificar.map(pago => (
                <div key={pago.id} style={{
                  backgroundColor: c.card, padding: '20px',
                  borderRadius: '16px', boxShadow: c.sombra,
                  borderLeft: '5px solid #FFB800'
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px'
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{
                        fontWeight: 'bold', fontSize: '18px',
                        color: c.texto, marginBottom: '5px'
                      }}>
                        Pedido #{pago.id} • {pago.cliente_nombre}
                      </div>
                      <div style={{ fontSize: '13px', color: c.textoSuave, marginBottom: '8px' }}>
                        📞 {pago.cliente_telefono || 'Sin teléfono'} • {pago.total_productos} producto(s)
                      </div>
                      <div style={{ fontSize: '12px', color: c.textoMuted, marginBottom: '8px' }}>
                        📅 {new Date(pago.fecha_venta).toLocaleString('es-ES')}
                      </div>
                      <div style={{
                        fontSize: '22px', fontWeight: 'bold',
                        color: '#FF6B00', marginBottom: '10px'
                      }}>
                        ${parseFloat(pago.total).toFixed(2)}
                      </div>

                      <div style={{
                        fontSize: '12px', backgroundColor: '#FFB800',
                        color: 'white', padding: '4px 12px',
                        borderRadius: '12px', display: 'inline-block',
                        fontWeight: 'bold', marginBottom: '15px'
                      }}>
                        PIN: {pago.pin_retiro}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setComprobanteVer(pago)}
                          style={{
                            padding: '12px 20px', backgroundColor: '#4A90E2',
                            color: 'white', border: 'none', borderRadius: '10px',
                            fontWeight: 'bold', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          👁️ Ver comprobante
                        </button>
                        <button
                          onClick={() => aprobarPago(pago.id)}
                          style={{
                            padding: '12px 20px', backgroundColor: '#27AE60',
                            color: 'white', border: 'none', borderRadius: '10px',
                            fontWeight: 'bold', cursor: 'pointer'
                          }}
                        >
                          ✅ Aprobar
                        </button>
                        <button
                          onClick={() => rechazarPago(pago.id)}
                          style={{
                            padding: '12px 20px', backgroundColor: '#E74C3C',
                            color: 'white', border: 'none', borderRadius: '10px',
                            fontWeight: 'bold', cursor: 'pointer'
                          }}
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>

                    {pago.comprobante_pago && (
                      <div
                        onClick={() => setComprobanteVer(pago)}
                        style={{
                          width: '120px', height: '120px',
                          borderRadius: '10px', overflow: 'hidden',
                          border: '2px solid #FFB800',
                          cursor: 'pointer', flexShrink: 0,
                          backgroundColor: c.cardSecundario
                        }}
                      >
                        <img
                          src={`${getApiUrl()}${pago.comprobante_pago}`}
                          alt="Comprobante"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.parentElement.innerHTML = '📷'; }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODAL VER COMPROBANTE ═══ */}
      {comprobanteVer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '20px'
        }}
        onClick={() => setComprobanteVer(null)}
        >
          <div style={{
            maxWidth: '90%', maxHeight: '90vh',
            position: 'relative', textAlign: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setComprobanteVer(null)}
              style={{
                position: 'absolute', top: '-15px', right: '-15px',
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: '#E74C3C', color: 'white',
                border: '3px solid white', cursor: 'pointer',
                fontSize: '20px', fontWeight: 'bold', zIndex: 1
              }}
            >
              ✕
            </button>

            <div style={{
              backgroundColor: 'white', padding: '15px',
              borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
              <div style={{
                marginBottom: '10px', padding: '10px',
                backgroundColor: '#FFF7ED', borderRadius: '8px',
                color: '#856404', fontWeight: 'bold', fontSize: '14px'
              }}>
                Pedido #{comprobanteVer.id} • ${parseFloat(comprobanteVer.total).toFixed(2)}
              </div>

              <img
                src={`${getApiUrl()}${comprobanteVer.comprobante_pago}`}
                alt="Comprobante completo"
                style={{
                  maxWidth: '100%', maxHeight: '65vh',
                  borderRadius: '8px', objectFit: 'contain'
                }}
              />

              <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => aprobarPago(comprobanteVer.id)}
                  style={{
                    padding: '12px 24px', backgroundColor: '#27AE60',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontWeight: 'bold', cursor: 'pointer', fontSize: '15px'
                  }}
                >
                  ✅ Aprobar pago
                </button>
                <button
                  onClick={() => rechazarPago(comprobanteVer.id)}
                  style={{
                    padding: '12px 24px', backgroundColor: '#E74C3C',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontWeight: 'bold', cursor: 'pointer', fontSize: '15px'
                  }}
                >
                  ❌ Rechazar pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DE COBRO ═══ */}
      {modalCobro && pedidoEncontrado && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: c.card, padding: '30px', borderRadius: '16px',
            maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0, color: c.texto }}>💳 Cobrar Pedido</h2>
            <p style={{ color: c.textoSuave }}>
              Total: <strong style={{ color: '#FF6B00', fontSize: '24px' }}>${total.toFixed(2)}</strong>
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: c.texto }}>
                Método de pago:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => { setMetodoPago('efectivo'); setPagoConfirmado(false); }}
                  style={{
                    padding: '15px',
                    border: metodoPago === 'efectivo' ? '3px solid #FF6B00' : `1px solid ${c.borde}`,
                    borderRadius: '10px',
                    backgroundColor: metodoPago === 'efectivo'
                      ? (esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED')
                      : c.cardSecundario,
                    cursor: 'pointer', fontSize: '24px'
                  }}
                >
                  💵
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: c.texto }}>Efectivo</div>
                </button>
                <button
                  onClick={() => { setMetodoPago('transfermovil'); setPagoConfirmado(false); }}
                  style={{
                    padding: '15px',
                    border: metodoPago === 'transfermovil' ? '3px solid #FF6B00' : `1px solid ${c.borde}`,
                    borderRadius: '10px',
                    backgroundColor: metodoPago === 'transfermovil'
                      ? (esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED')
                      : c.cardSecundario,
                    cursor: 'pointer', fontSize: '24px'
                  }}
                >
                  📱
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: c.texto }}>Transfermóvil</div>
                </button>
              </div>
            </div>

            {metodoPago === 'efectivo' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: c.texto }}>
                  Paga con:
                </label>
                <input
                  type="number" value={efectivoRecibido}
                  onChange={(e) => setEfectivoRecibido(e.target.value)}
                  placeholder="0.00" autoFocus
                  style={{
                    width: '100%', padding: '12px', fontSize: '20px',
                    borderRadius: '8px', border: `2px solid ${c.inputBorder}`,
                    boxSizing: 'border-box', color: c.texto, backgroundColor: c.inputBg
                  }}
                />
                {efectivoRecibido && parseFloat(efectivoRecibido) >= total && (
                  <div style={{
                    marginTop: '10px', padding: '12px',
                    backgroundColor: esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda',
                    color: esOscuro ? '#7de8a8' : '#155724',
                    borderRadius: '8px', fontWeight: 'bold', fontSize: '18px'
                  }}>
                    💰 Cambio: ${cambio.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {metodoPago === 'transfermovil' && (
              <div style={{
                marginBottom: '20px', textAlign: 'center',
                padding: '20px', backgroundColor: c.cardSecundario,
                borderRadius: '8px', border: '2px solid #FF6B00'
              }}>
                <p style={{ fontWeight: 'bold', fontSize: '16px', color: c.texto }}>
                  📱 Cobra al cliente y confirma
                </p>
                <button
                  onClick={() => setPagoConfirmado(true)}
                  disabled={pagoConfirmado}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: pagoConfirmado ? '#28a745' : '#4A90E2',
                    color: 'white', border: 'none', borderRadius: '8px',
                    fontSize: '15px', fontWeight: 'bold',
                    cursor: pagoConfirmado ? 'default' : 'pointer'
                  }}
                >
                  {pagoConfirmado ? '✅ Cliente ya pagó' : 'Cliente ya pagó'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setModalCobro(false)}
                disabled={confirmando}
                style={{
                  flex: 1, padding: '14px', backgroundColor: '#E74C3C',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontWeight: 'bold', cursor: 'pointer'
                }}
              >Cancelar</button>
              <button
                onClick={cobrarPedido}
                disabled={confirmando || (metodoPago === 'transfermovil' && !pagoConfirmado)}
                style={{
                  flex: 2, padding: '14px',
                  backgroundColor: confirmando || (metodoPago === 'transfermovil' && !pagoConfirmado) ? '#666' : '#27AE60',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: confirmando || (metodoPago === 'transfermovil' && !pagoConfirmado) ? 'not-allowed' : 'pointer'
                }}
              >
                {confirmando ? 'Procesando...' : '✅ Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosPendientesScreen;
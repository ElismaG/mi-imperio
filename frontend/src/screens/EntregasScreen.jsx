// EntregasScreen.jsx - Módulo de entregas con detección de pago desde app
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { getApiUrl } from '../core/utils/apiUrl';
import { useThemeStore } from '../core/stores/themeStore';
import qrTransfermovil from '../assets/qr_transfermovil.png';

const EntregasScreen = () => {
  const [pin, setPin] = useState('');
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

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
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const response = await apiClient.get('/ventas/historial/entregas');
      setHistorial(response.data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const buscarPorPin = async () => {
    if (pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos');
      return;
    }

    setCargando(true);
    setError('');
    setPedido(null);
    setEfectivoRecibido('');
    setPagoConfirmado(false);
    setMetodoPago('efectivo');

    try {
      const response = await apiClient.get(`/pedidos/buscar/${pin}`);
      setPedido(response.data);
      console.log('📦 Pedido cargado:', response.data);
      console.log('💰 Estado de pago:', response.data.pedido.estado_pago);
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontró ningún pedido con ese PIN');
    } finally {
      setCargando(false);
    }
  };

  const confirmarPagoYEntrega = async () => {
    if (!pedido) return;

    const yaPagado = pedido.pedido.estado_pago === 'verificado';

    // Si ya está pagado, solo confirmar entrega
    if (yaPagado) {
      if (!window.confirm(`Este pedido YA ESTÁ PAGADO.\n\n¿Confirmas la ENTREGA del pedido #${pedido.pedido.id}?`)) {
        return;
      }
    } else {
      // Pago pendiente: validar
      if (metodoPago === 'efectivo') {
        const recibido = parseFloat(efectivoRecibido);
        const total = parseFloat(pedido.pedido.total);
        if (!recibido || recibido < total) {
          setError('❌ El efectivo recibido debe ser mayor o igual al total');
          setTimeout(() => setError(''), 3000);
          return;
        }
      }

      if (metodoPago === 'transfermovil' && !pagoConfirmado) {
        setError('❌ Debes confirmar que el cliente ya pagó por Transfermóvil');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const metodoTexto = metodoPago === 'efectivo' ? 'Efectivo' : 'Transfermóvil';
      if (!window.confirm(`¿Confirmar PAGO y ENTREGA del pedido #${pedido.pedido.id}?\n\nMétodo: ${metodoTexto}\nTotal: $${parseFloat(pedido.pedido.total).toFixed(2)}`)) {
        return;
      }
    }

    setConfirmando(true);
    try {
      const payload = yaPagado 
        ? { metodo_pago: 'transfermovil_app', usuario_id: 1 }
        : { metodo_pago: metodoPago, usuario_id: 1 };

      await apiClient.post(`/pedidos/${pedido.pedido.id}/cobrar`, payload);

      setMensaje(yaPagado 
        ? `✅ Pedido #${pedido.pedido.id} entregado (ya estaba pagado)`
        : `✅ Pedido #${pedido.pedido.id} cobrado y entregado`
      );
      setPedido(null);
      setPin('');
      setEfectivoRecibido('');
      setPagoConfirmado(false);
      cargarHistorial();
      setTimeout(() => setMensaje(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al confirmar');
      setTimeout(() => setError(''), 4000);
    } finally {
      setConfirmando(false);
    }
  };

  const total = pedido ? parseFloat(pedido.pedido.total) : 0;
  const cambio = efectivoRecibido ? parseFloat(efectivoRecibido) - total : 0;
  const yaPagado = pedido?.pedido?.estado_pago === 'verificado';
  const enVerificacion = pedido?.pedido?.estado_pago === 'en_verificacion';

  return (
    <div style={{
      padding: '30px', maxWidth: '1200px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)'
    }}>

      <h1 style={{ marginBottom: '30px', color: c.texto }}>🚚 Módulo de Entregas</h1>

      {mensaje && (
        <div style={{
          padding: '15px', marginBottom: '20px', borderRadius: '12px',
          backgroundColor: esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda',
          color: esOscuro ? '#7de8a8' : '#155724', fontWeight: 'bold',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          {mensaje}
        </div>
      )}

      {error && (
        <div style={{
          padding: '15px', marginBottom: '20px', borderRadius: '12px',
          backgroundColor: esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da',
          color: esOscuro ? '#ff9999' : '#721c24', fontWeight: 'bold'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Buscador de PIN */}
      <div style={{
        backgroundColor: c.card, padding: '30px', borderRadius: '16px',
        boxShadow: c.sombra, marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: c.texto }}>
          🔑 Buscar por PIN
        </h2>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyPress={(e) => e.key === 'Enter' && buscarPorPin()}
            placeholder="• • • •"
            maxLength="4"
            style={{
              width: '150px', padding: '20px', fontSize: '32px',
              textAlign: 'center', letterSpacing: '8px', fontWeight: 'bold',
              borderRadius: '12px', border: `2px solid ${c.inputBorder}`,
              outline: 'none', color: c.texto, backgroundColor: c.inputBg
            }}
          />
          <button
            onClick={buscarPorPin}
            disabled={cargando || pin.length !== 4}
            style={{
              padding: '20px 40px', fontSize: '18px', fontWeight: 'bold',
              backgroundColor: cargando || pin.length !== 4 ? '#666' : '#FF6B00',
              color: 'white', border: 'none', borderRadius: '12px',
              cursor: cargando || pin.length !== 4 ? 'not-allowed' : 'pointer'
            }}
          >
            {cargando ? '🔍 Buscando...' : '🔍 Buscar'}
          </button>
        </div>
      </div>

      {/* Pedido encontrado */}
      {pedido && (
        <div style={{
          backgroundColor: c.card, padding: '30px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '30px',
          border: yaPagado ? '3px solid #27AE60' : '3px solid #FF6B00'
        }}>

          {/* Cabecera */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'
          }}>
            <h2 style={{ margin: 0, color: c.texto }}>📦 Pedido #{pedido.pedido.id}</h2>
            <div style={{
              backgroundColor: '#FF6B00', color: 'white',
              padding: '8px 20px', borderRadius: '20px', fontWeight: 'bold'
            }}>
              PIN: {pedido.pedido.pin_retiro}
            </div>
          </div>

          {/* ═══ BANNER DE ESTADO DE PAGO ═══ */}
          {yaPagado && (
            <div style={{
              padding: '20px', borderRadius: '12px',
              backgroundColor: esOscuro ? 'rgba(39,174,96,0.15)' : '#d4edda',
              border: '2px solid #27AE60',
              marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '15px'
            }}>
              <div style={{ fontSize: '48px' }}>✅</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '22px', fontWeight: 'bold',
                  color: esOscuro ? '#7de8a8' : '#155724',
                  marginBottom: '5px'
                }}>
                  PAGO YA VERIFICADO
                </div>
                <div style={{
                  fontSize: '14px',
                  color: esOscuro ? '#7de8a8' : '#155724'
                }}>
                  El cliente pagó desde la app. Solo confirma la entrega.
                </div>
              </div>
            </div>
          )}

          {enVerificacion && (
            <div style={{
              padding: '20px', borderRadius: '12px',
              backgroundColor: esOscuro ? 'rgba(255,184,0,0.15)' : '#FFF9E6',
              border: '2px solid #FFB800',
              marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '15px'
            }}>
              <div style={{ fontSize: '48px' }}>⏳</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '22px', fontWeight: 'bold',
                  color: esOscuro ? '#ffd966' : '#856404',
                  marginBottom: '5px'
                }}>
                  PAGO EN VERIFICACIÓN
                </div>
                <div style={{
                  fontSize: '14px',
                  color: esOscuro ? '#ffd966' : '#856404'
                }}>
                  El comprobante está pendiente de aprobación. Ve a "Pedidos" → "Pagos por verificar".
                </div>
              </div>
            </div>
          )}

          {pedido.pedido.estado_pago === 'pendiente' && (
            <div style={{
              padding: '20px', borderRadius: '12px',
              backgroundColor: esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED',
              border: '2px solid #FF6B00',
              marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '15px'
            }}>
              <div style={{ fontSize: '48px' }}>💳</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '22px', fontWeight: 'bold',
                  color: '#FF6B00', marginBottom: '5px'
                }}>
                  COBRAR AL ENTREGAR
                </div>
                <div style={{
                  fontSize: '14px', color: c.textoSuave
                }}>
                  El cliente pagará al recibir el pedido.
                </div>
              </div>
            </div>
          )}

          {/* Tipo de entrega */}
          <div style={{
            padding: '20px', marginBottom: '20px', borderRadius: '12px',
            backgroundColor: pedido.pedido.tipo_entrega === 'domicilio'
              ? (esOscuro ? 'rgba(74,144,226,0.15)' : '#E8F4FD')
              : (esOscuro ? 'rgba(255,184,0,0.15)' : '#FFF9E6'),
            border: pedido.pedido.tipo_entrega === 'domicilio'
              ? '2px solid #4A90E2'
              : '2px solid #FFB800',
            display: 'flex', alignItems: 'center', gap: '15px'
          }}>
            <div style={{ fontSize: '48px', flexShrink: 0 }}>
              {pedido.pedido.tipo_entrega === 'domicilio' ? '🚚' : '🏪'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '20px', fontWeight: 'bold',
                color: pedido.pedido.tipo_entrega === 'domicilio' ? '#4A90E2' : '#FFB800',
                marginBottom: '5px'
              }}>
                {pedido.pedido.tipo_entrega === 'domicilio' ? 'ENTREGA A DOMICILIO' : 'RETIRO EN TIENDA'}
              </div>
              <div style={{ fontSize: '14px', color: c.textoSuave }}>
                {yaPagado 
                  ? 'Ya pagado. Solo entregar.' 
                  : 'Cobra el pago ANTES de entregar.'}
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px', padding: '20px', backgroundColor: c.cardSecundario,
            borderRadius: '12px', marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: c.textoMuted, marginBottom: '4px', fontWeight: 'bold' }}>
                CLIENTE
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: c.texto }}>
                {pedido.cliente.nombre}
              </div>
              {pedido.cliente.telefono && (
                <div style={{ fontSize: '14px', color: c.textoSuave, marginTop: '4px' }}>
                  📞 {pedido.cliente.telefono}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: c.textoMuted, marginBottom: '4px', fontWeight: 'bold' }}>
                FECHA
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: c.texto }}>
                {new Date(pedido.pedido.fecha_venta).toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Dirección */}
          {pedido.pedido.tipo_entrega === 'domicilio' && (
            <div style={{
              padding: '20px', backgroundColor: esOscuro ? 'rgba(74,144,226,0.15)' : '#E8F4FD',
              borderRadius: '12px', marginBottom: '20px', borderLeft: '5px solid #4A90E2'
            }}>
              <div style={{
                fontSize: '12px', color: '#4A90E2', fontWeight: 'bold',
                letterSpacing: '1px', marginBottom: '8px'
              }}>
                📍 DIRECCIÓN DE ENTREGA
              </div>
              <div style={{ fontSize: '18px', color: c.texto, fontWeight: 'bold', lineHeight: '1.5' }}>
                {pedido.pedido.direccion_entrega || pedido.cliente.direccion || 'Sin dirección'}
              </div>
              {pedido.pedido.costo_envio > 0 && (
                <div style={{
                  marginTop: '10px', paddingTop: '10px',
                  borderTop: '1px solid #4A90E2',
                  fontSize: '14px', color: c.textoSuave,
                  display: 'flex', justifyContent: 'space-between'
                }}>
                  <span>Costo de envío:</span>
                  <strong style={{ color: '#4A90E2' }}>${parseFloat(pedido.pedido.costo_envio).toFixed(2)}</strong>
                </div>
              )}
            </div>
          )}

          {/* Productos */}
          <h3 style={{ marginBottom: '15px', color: c.texto }}>🛍️ Productos a entregar:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pedido.productos.map((prod) => (
              <div key={prod.id} style={{
                display: 'flex', alignItems: 'center', gap: '20px',
                padding: '15px', border: `2px solid ${c.borde}`,
                borderRadius: '12px', backgroundColor: c.cardSecundario,
                flexWrap: 'wrap'
              }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '12px',
                  overflow: 'hidden', backgroundColor: esOscuro ? '#0F1621' : '#f0f0f0',
                  flexShrink: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '32px'
                }}>
                  {prod.imagen ? (
                    <img
                      src={getApiUrl() + prod.imagen}
                      alt={prod.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : '📦'}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '17px', marginBottom: '6px', color: c.texto }}>
                    {prod.nombre}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {prod.talla && (
                      <span style={{
                        backgroundColor: '#4A90E2', color: 'white',
                        padding: '4px 12px', borderRadius: '20px',
                        fontSize: '13px', fontWeight: 'bold'
                      }}>📏 Talla: {prod.talla}</span>
                    )}
                    {prod.color && (
                      <span style={{
                        backgroundColor: '#9B59B6', color: 'white',
                        padding: '4px 12px', borderRadius: '20px',
                        fontSize: '13px', fontWeight: 'bold'
                      }}>🎨 Color: {prod.color}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#FF6B00' }}>
                    x{prod.cantidad}
                  </div>
                  <div style={{ fontSize: '14px', color: c.textoSuave }}>
                    ${parseFloat(prod.subtotal).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{
            marginTop: '25px', padding: '20px',
            backgroundColor: esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED',
            borderRadius: '12px', border: '2px solid #FF6B00'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: c.texto }}>
                {yaPagado ? '💰 TOTAL (PAGADO):' : '💰 TOTAL A COBRAR:'}
              </span>
              <span style={{
                fontSize: '32px', fontWeight: 'bold',
                color: yaPagado ? '#27AE60' : '#FF6B00'
              }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* ═══ SECCIÓN DE PAGO (SOLO SI NO ESTÁ PAGADO) ═══ */}
          {!yaPagado && !enVerificacion && (
            <div style={{ marginTop: '25px' }}>
              <h3 style={{ color: c.texto, marginBottom: '15px' }}>💳 Método de pago:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => { setMetodoPago('efectivo'); setPagoConfirmado(false); }}
                  style={{
                    padding: '20px',
                    border: metodoPago === 'efectivo' ? '3px solid #FF6B00' : `2px solid ${c.borde}`,
                    borderRadius: '12px',
                    backgroundColor: metodoPago === 'efectivo'
                      ? (esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED')
                      : c.card,
                    cursor: 'pointer', fontSize: '40px', transition: 'all 0.2s'
                  }}
                >
                  💵
                  <div style={{
                    fontSize: '15px', fontWeight: 'bold',
                    color: metodoPago === 'efectivo' ? '#FF6B00' : c.textoSuave,
                    marginTop: '5px'
                  }}>
                    Efectivo
                  </div>
                </button>
                <button
                  onClick={() => { setMetodoPago('transfermovil'); setPagoConfirmado(false); }}
                  style={{
                    padding: '20px',
                    border: metodoPago === 'transfermovil' ? '3px solid #FF6B00' : `2px solid ${c.borde}`,
                    borderRadius: '12px',
                    backgroundColor: metodoPago === 'transfermovil'
                      ? (esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED')
                      : c.card,
                    cursor: 'pointer', fontSize: '40px', transition: 'all 0.2s'
                  }}
                >
                  📱
                  <div style={{
                    fontSize: '15px', fontWeight: 'bold',
                    color: metodoPago === 'transfermovil' ? '#FF6B00' : c.textoSuave,
                    marginTop: '5px'
                  }}>
                    Transfermóvil
                  </div>
                </button>
              </div>

              {/* Efectivo */}
              {metodoPago === 'efectivo' && (
                <div style={{
                  marginTop: '20px', padding: '20px',
                  backgroundColor: c.cardSecundario, borderRadius: '12px',
                  border: `2px solid ${c.borde}`
                }}>
                  <label style={{
                    display: 'block', fontWeight: 'bold',
                    marginBottom: '8px', color: c.texto, fontSize: '15px'
                  }}>
                    💵 Paga con:
                  </label>
                  <input
                    type="number"
                    value={efectivoRecibido}
                    onChange={(e) => setEfectivoRecibido(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    style={{
                      width: '100%', padding: '15px', fontSize: '24px',
                      borderRadius: '10px', border: `2px solid ${c.inputBorder}`,
                      boxSizing: 'border-box', color: c.texto,
                      fontWeight: 'bold', textAlign: 'center',
                      backgroundColor: c.inputBg
                    }}
                  />
                  {efectivoRecibido && parseFloat(efectivoRecibido) >= total && (
                    <div style={{
                      marginTop: '12px', padding: '15px',
                      backgroundColor: esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda',
                      color: esOscuro ? '#7de8a8' : '#155724',
                      borderRadius: '10px', fontWeight: 'bold',
                      fontSize: '20px', textAlign: 'center'
                    }}>
                      💰 Cambio: ${cambio.toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {/* Transfermóvil */}
              {metodoPago === 'transfermovil' && (
                <div style={{
                  marginTop: '20px', padding: '25px', textAlign: 'center',
                  backgroundColor: c.cardSecundario, borderRadius: '12px',
                  border: '2px solid #FF6B00'
                }}>
                  <p style={{ marginTop: 0, fontWeight: 'bold', fontSize: '16px', color: c.texto }}>
                    📱 Escanee el código QR
                  </p>
                  <img
                    src={qrTransfermovil}
                    alt="QR Transfermóvil"
                    style={{
                      width: '220px', height: '220px', margin: '10px auto',
                      display: 'block', borderRadius: '12px',
                      backgroundColor: 'white', padding: '10px',
                      border: '1px solid #ddd'
                    }}
                  />
                  <button
                    onClick={() => setPagoConfirmado(true)}
                    disabled={pagoConfirmado}
                    style={{
                      padding: '14px 30px',
                      backgroundColor: pagoConfirmado ? '#28a745' : '#4A90E2',
                      color: 'white', border: 'none', borderRadius: '10px',
                      fontSize: '15px', fontWeight: 'bold',
                      cursor: pagoConfirmado ? 'default' : 'pointer'
                    }}
                  >
                    {pagoConfirmado ? '✅ Cliente ya pagó' : 'Cliente ya pagó'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Advertencia */}
          <div style={{
            padding: '15px',
            backgroundColor: yaPagado 
              ? (esOscuro ? 'rgba(39,174,96,0.15)' : '#E8F8F0')
              : (esOscuro ? 'rgba(255,184,0,0.15)' : '#FFF3CD'),
            borderRadius: '10px', marginTop: '20px',
            borderLeft: yaPagado ? '4px solid #27AE60' : '4px solid #FFB800',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>{yaPagado ? '✅' : '⚠️'}</span>
            <span style={{
              color: yaPagado 
                ? (esOscuro ? '#7de8a8' : '#155724')
                : (esOscuro ? '#ffd966' : '#856404'),
              fontSize: '14px', fontWeight: 'bold'
            }}>
              {yaPagado 
                ? 'Este pedido ya fue pagado desde la app. Solo confirma la entrega.'
                : 'Confirma el pago ANTES de entregar el pedido al cliente.'}
            </span>
          </div>

          {/* Botón principal */}
          <button
            onClick={confirmarPagoYEntrega}
            disabled={
              confirmando || 
              (!yaPagado && enVerificacion) ||
              (!yaPagado && !enVerificacion && metodoPago === 'transfermovil' && !pagoConfirmado) ||
              (!yaPagado && !enVerificacion && metodoPago === 'efectivo' && (!efectivoRecibido || parseFloat(efectivoRecibido) < total))
            }
            style={{
              width: '100%', marginTop: '20px', padding: '22px',
              fontSize: '20px', fontWeight: 'bold',
              backgroundColor: 
                yaPagado ? '#27AE60' :
                enVerificacion ? '#666' :
                (confirmando ||
                  (metodoPago === 'transfermovil' && !pagoConfirmado) ||
                  (metodoPago === 'efectivo' && (!efectivoRecibido || parseFloat(efectivoRecibido) < total))
                ) ? '#666' : '#27AE60',
              color: 'white', border: 'none', borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(39,174,96,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            {yaPagado && <span style={{ fontSize: '24px' }}>📦</span>}
            {confirmando 
              ? 'Procesando...' 
              : yaPagado 
                ? 'CONFIRMAR ENTREGA (YA PAGADO)'
                : enVerificacion
                  ? 'PAGO EN VERIFICACIÓN'
                  : 'CONFIRMAR PAGO Y ENTREGA'}
          </button>
        </div>
      )}

      {/* Historial */}
      <div style={{
        backgroundColor: c.card, padding: '30px', borderRadius: '16px',
        boxShadow: c.sombra
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: c.texto }}>
          📋 Historial de entregas recientes
        </h2>

        {historial.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>
            No hay entregas registradas aún
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: c.cardSecundario }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: c.textoSuave }}>VENTA</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: c.textoSuave }}>CLIENTE</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: c.textoSuave }}>PRODUCTOS</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: c.textoSuave }}>TOTAL</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: c.textoSuave }}>FECHA ENTREGA</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id} style={{ borderBottom: `1px solid ${c.borde}` }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: c.texto }}>#{h.id}</td>
                    <td style={{ padding: '12px', color: c.texto }}>{h.cliente_nombre || 'N/A'}</td>
                    <td style={{ padding: '12px', color: c.textoSuave }}>{h.total_productos} producto(s)</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#FF6B00' }}>${parseFloat(h.total).toFixed(2)}</td>
                    <td style={{ padding: '12px', color: c.textoSuave, fontSize: '13px' }}>
                      {new Date(h.fecha_entrega).toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntregasScreen;
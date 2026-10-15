// DashboardScreen.jsx - Pantalla de inicio con resumen del negocio
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const DashboardScreen = ({ usuario, onNavegar }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  const { tema } = useThemeStore();
  const esOscuro = tema === 'oscuro';

  // Colores según el tema
  const c = esOscuro ? {
    fondo: '#0F1621',
    card: '#1A2332',
    cardSecundario: '#0F1621',
    borde: '#2A3547',
    texto: '#FFFFFF',
    textoSuave: '#B0BEC5',
    textoMuted: '#8B9BB0',
    sombra: '0 4px 20px rgba(0,0,0,0.5)',
  } : {
    fondo: '#F8F9FA',
    card: '#FFFFFF',
    cardSecundario: '#F9F9F9',
    borde: '#EEEEEE',
    texto: '#1A2332',
    textoSuave: '#666666',
    textoMuted: '#999999',
    sombra: '0 4px 20px rgba(0,0,0,0.08)',
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const response = await apiClient.get('/dashboard/resumen');
      setDatos(response.data);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{
        padding: '60px',
        textAlign: 'center',
        fontSize: '18px',
        color: c.textoSuave,
        backgroundColor: c.fondo,
        minHeight: 'calc(100vh - 60px)'
      }}>
        Cargando dashboard...
      </div>
    );
  }

  if (!datos) {
    return (
      <div style={{
        padding: '60px',
        textAlign: 'center',
        color: c.textoMuted,
        backgroundColor: c.fondo,
        minHeight: 'calc(100vh - 60px)'
      }}>
        No se pudo cargar el dashboard
      </div>
    );
  }

  const { resumen, ventas_semana, ultimas_ventas, productos_top } = datos;

  const maxVenta = ventas_semana.length > 0
    ? Math.max(...ventas_semana.map(v => parseFloat(v.total)), 1)
    : 1;

  return (
    <div style={{
      padding: '30px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)',
      transition: 'background-color 0.3s ease'
    }}>

      {/* Encabezado */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: c.texto }}>
          👋 Hola, {usuario?.nombre_completo?.split(' ')[0] || 'Usuario'}
        </h1>
        <p style={{ margin: '5px 0 0 0', color: c.textoSuave, fontSize: '15px' }}>
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Ventas del día */}
        <div style={{
          backgroundColor: c.card,
          padding: '25px',
          borderRadius: '16px',
          boxShadow: c.sombra,
          borderLeft: '5px solid #FF6B00',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold', letterSpacing: '1px' }}>
                VENTAS HOY
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: c.texto, marginTop: '8px' }}>
                {resumen.ventas_hoy}
              </div>
              <div style={{ fontSize: '13px', color: c.textoSuave, marginTop: '4px' }}>
                transacciones
              </div>
            </div>
            <div style={{
              fontSize: '40px',
              backgroundColor: esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED',
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              🛒
            </div>
          </div>
        </div>

        {/* Total recaudado */}
        <div style={{
          backgroundColor: c.card,
          padding: '25px',
          borderRadius: '16px',
          boxShadow: c.sombra,
          borderLeft: '5px solid #27AE60',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold', letterSpacing: '1px' }}>
                RECAUDADO HOY
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#27AE60', marginTop: '8px' }}>
                ${resumen.total_hoy.toFixed(2)}
              </div>
              <div style={{ fontSize: '13px', color: c.textoSuave, marginTop: '4px' }}>
                en ventas
              </div>
            </div>
            <div style={{
              fontSize: '40px',
              backgroundColor: esOscuro ? 'rgba(39,174,96,0.15)' : '#E8F8F0',
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              💰
            </div>
          </div>
        </div>

        {/* Stock crítico */}
        <div
          onClick={() => onNavegar && onNavegar('alertas')}
          style={{
            backgroundColor: c.card,
            padding: '25px',
            borderRadius: '16px',
            boxShadow: c.sombra,
            borderLeft: '5px solid #FFB800',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold', letterSpacing: '1px' }}>
                STOCK CRÍTICO
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FFB800', marginTop: '8px' }}>
                {resumen.stock_critico}
              </div>
              <div style={{ fontSize: '13px', color: c.textoSuave, marginTop: '4px' }}>
                productos
              </div>
            </div>
            <div style={{
              fontSize: '40px',
              backgroundColor: esOscuro ? 'rgba(255,184,0,0.15)' : '#FFF9E6',
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              ⚠️
            </div>
          </div>
        </div>

        {/* Entregas pendientes */}
        <div
          onClick={() => onNavegar && onNavegar('entregas')}
          style={{
            backgroundColor: c.card,
            padding: '25px',
            borderRadius: '16px',
            boxShadow: c.sombra,
            borderLeft: '5px solid #4A90E2',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold', letterSpacing: '1px' }}>
                ENTREGAS
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4A90E2', marginTop: '8px' }}>
                {resumen.entregas_pendientes}
              </div>
              <div style={{ fontSize: '13px', color: c.textoSuave, marginTop: '4px' }}>
                pendientes
              </div>
            </div>
            <div style={{
              fontSize: '40px',
              backgroundColor: esOscuro ? 'rgba(74,144,226,0.15)' : '#EAF3FC',
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              🚚
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de ventas de la semana */}
      <div style={{
        backgroundColor: c.card,
        padding: '25px',
        borderRadius: '16px',
        boxShadow: c.sombra,
        marginBottom: '30px',
        transition: 'all 0.3s ease'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: c.texto }}>
          📈 Ventas de los últimos 7 días
        </h2>
        {ventas_semana.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>
            No hay ventas registradas en los últimos 7 días
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '15px',
            height: '200px',
            paddingTop: '20px'
          }}>
            {ventas_semana.map((v, i) => {
              const altura = (parseFloat(v.total) / maxVenta) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#FF6B00',
                    marginBottom: '5px'
                  }}>
                    ${parseFloat(v.total).toFixed(0)}
                  </div>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(altura, 5)}%`,
                    minHeight: '10px',
                    backgroundColor: '#FF6B00',
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.3s',
                    boxShadow: '0 -2px 8px rgba(255,107,0,0.3)'
                  }} />
                  <div style={{
                    fontSize: '12px',
                    color: c.textoSuave,
                    marginTop: '8px',
                    fontWeight: 'bold'
                  }}>
                    {v.fecha}
                  </div>
                  <div style={{ fontSize: '11px', color: c.textoMuted }}>
                    {v.cantidad} venta{v.cantidad > 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dos columnas: Últimas ventas + Productos top */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px'
      }}>
        {/* Últimas ventas */}
        <div style={{
          backgroundColor: c.card,
          padding: '25px',
          borderRadius: '16px',
          boxShadow: c.sombra,
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: c.texto }}>
            🕐 Últimas ventas
          </h2>
          {ultimas_ventas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>
              No hay ventas registradas
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ultimas_ventas.map((v) => (
                <div key={v.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: c.cardSecundario,
                  borderRadius: '10px',
                  borderLeft: v.estado_entrega === 'pendiente' ? '4px solid #FFB800' : '4px solid #27AE60'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                      Venta #{v.id}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: c.textoSuave,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap'
                    }}>
                      <span>{v.cliente_nombre || 'Venta directa'}</span>
                      <span>•</span>
                      <span>{v.metodo_pago}</span>
                      {v.tipo === 'pedido' && (
                        <span style={{
                          backgroundColor: '#FFB800',
                          color: 'white',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          📱 APP
                        </span>
                      )}
                      {v.tipo_entrega === 'domicilio' && (
                        <span style={{
                          backgroundColor: '#4A90E2',
                          color: 'white',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          🚚 DOMICILIO
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: c.textoMuted, marginTop: '2px' }}>
                      {new Date(v.fecha_venta).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '10px' }}>
                    <div style={{ fontWeight: 'bold', color: '#FF6B00', fontSize: '16px' }}>
                      ${parseFloat(v.total).toFixed(2)}
                    </div>
                    {v.pin_retiro && (
                      <div style={{
                        fontSize: '11px',
                        backgroundColor: '#FFB800',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        marginTop: '4px',
                        display: 'inline-block',
                        fontWeight: 'bold'
                      }}>
                        PIN: {v.pin_retiro}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Productos top */}
        <div style={{
          backgroundColor: c.card,
          padding: '25px',
          borderRadius: '16px',
          boxShadow: c.sombra,
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: c.texto }}>
            ⭐ Productos más vendidos (30 días)
          </h2>
          {productos_top.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>
              No hay datos de ventas aún
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {productos_top.map((p, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  backgroundColor: c.cardSecundario,
                  borderRadius: '10px'
                }}>
                  <div style={{
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : (esOscuro ? '#2A3547' : '#ddd'),
                    color: i < 3 ? '#1A2332' : c.textoSuave,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: c.texto
                    }}>
                      {p.nombre}
                    </div>
                    <div style={{ fontSize: '12px', color: c.textoSuave }}>
                      {p.total_vendido} unidades vendidas
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 'bold',
                    color: '#27AE60',
                    fontSize: '14px'
                  }}>
                    ${parseFloat(p.total_ingresos).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botón actualizar */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={cargarDatos}
          style={{
            padding: '12px 30px',
            backgroundColor: esOscuro ? '#2A3547' : '#1A2332',
            color: 'white',
            border: esOscuro ? `1px solid ${c.borde}` : 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.3s'
          }}
        >
          🔄 Actualizar datos
        </button>
      </div>
    </div>
  );
};

export default DashboardScreen;
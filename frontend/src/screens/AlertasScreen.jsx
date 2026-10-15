// AlertasScreen.jsx - Módulo de alertas con modo oscuro
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const AlertasScreen = () => {
  const [alertas, setAlertas] = useState({ stock_bajo: [], por_caducar: [], agotados: [] });
  const [cargando, setCargando] = useState(true);

  const { tema } = useThemeStore();
  const esOscuro = tema === 'oscuro';

  const c = esOscuro ? {
    fondo: '#0F1621', card: '#1A2332', cardSecundario: '#0F1621',
    borde: '#2A3547', texto: '#FFFFFF', textoSuave: '#B0BEC5',
    textoMuted: '#8B9BB0', sombra: '0 4px 20px rgba(0,0,0,0.5)'
  } : {
    fondo: '#F8F9FA', card: '#FFFFFF', cardSecundario: '#F9F9F9',
    borde: '#EEEEEE', texto: '#1A2332', textoSuave: '#666666',
    textoMuted: '#999999', sombra: '0 4px 20px rgba(0,0,0,0.08)'
  };

  useEffect(() => { cargarAlertas(); }, []);

  const cargarAlertas = async () => {
    try {
      setCargando(true);
      const response = await apiClient.get('/productos/alertas/inventario');
      setAlertas(response.data);
    } catch (error) {
      console.error('Error al cargar alertas:', error);
    } finally {
      setCargando(false);
    }
  };

  const totalAlertas = (alertas.stock_bajo?.length || 0) + (alertas.por_caducar?.length || 0) + (alertas.agotados?.length || 0);

  if (cargando) {
    return <div style={{ padding: '60px', textAlign: 'center', color: c.textoSuave, backgroundColor: c.fondo, minHeight: '100vh' }}>
      Cargando alertas...
    </div>;
  }

  return (
    <div style={{
      padding: '30px', maxWidth: '1200px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)', transition: 'background-color 0.3s ease'
    }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: c.texto }}>⚠️ Alertas de Inventario</h1>
        <button onClick={cargarAlertas} style={{
          padding: '10px 20px', backgroundColor: '#FF6B00', color: 'white',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
        }}>🔄 Actualizar</button>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{
          backgroundColor: esOscuro ? 'rgba(231,76,60,0.15)' : '#FFE5E5',
          padding: '20px', borderRadius: '12px', borderLeft: '5px solid #E74C3C'
        }}>
          <div style={{ fontSize: '14px', color: esOscuro ? '#ff9999' : '#721c24', fontWeight: 'bold' }}>🚫 AGOTADOS</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#E74C3C', marginTop: '5px' }}>
            {alertas.agotados?.length || 0}
          </div>
        </div>
        <div style={{
          backgroundColor: esOscuro ? 'rgba(255,184,0,0.15)' : '#FFF9E6',
          padding: '20px', borderRadius: '12px', borderLeft: '5px solid #FFB800'
        }}>
          <div style={{ fontSize: '14px', color: esOscuro ? '#ffd966' : '#856404', fontWeight: 'bold' }}>⚠️ STOCK BAJO</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFB800', marginTop: '5px' }}>
            {alertas.stock_bajo?.length || 0}
          </div>
        </div>
        <div style={{
          backgroundColor: esOscuro ? 'rgba(155,89,182,0.15)' : '#F4ECF7',
          padding: '20px', borderRadius: '12px', borderLeft: '5px solid #9B59B6'
        }}>
          <div style={{ fontSize: '14px', color: esOscuro ? '#d7bde2' : '#6C3483', fontWeight: 'bold' }}>⏰ POR CADUCAR</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9B59B6', marginTop: '5px' }}>
            {alertas.por_caducar?.length || 0}
          </div>
        </div>
      </div>

      {totalAlertas === 0 && (
        <div style={{
          backgroundColor: c.card, padding: '60px', borderRadius: '16px',
          textAlign: 'center', boxShadow: c.sombra
        }}>
          <div style={{ fontSize: '80px', marginBottom: '15px' }}>✅</div>
          <h2 style={{ margin: 0, color: '#27AE60' }}>¡Todo en orden!</h2>
          <p style={{ color: c.textoSuave, marginTop: '10px' }}>
            No hay alertas de inventario en este momento.
          </p>
        </div>
      )}

      {/* Agotados */}
      {alertas.agotados && alertas.agotados.length > 0 && (
        <div style={{
          backgroundColor: c.card, padding: '25px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '20px', borderLeft: '5px solid #E74C3C'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#E74C3C' }}>
            🚫 Productos agotados ({alertas.agotados.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertas.agotados.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '15px', padding: '12px',
                backgroundColor: esOscuro ? 'rgba(231,76,60,0.15)' : '#FFE5E5',
                borderRadius: '10px', border: '1px solid #E74C3C'
              }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '8px',
                  backgroundColor: esOscuro ? '#0F1621' : '#f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', flexShrink: 0, filter: 'grayscale(100%)'
                }}>📦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: c.texto }}>{p.nombre}</div>
                  <div style={{ fontSize: '12px', color: esOscuro ? '#ff9999' : '#721c24' }}>
                    {p.categoria_nombre} • {p.ubicacion_almacen}
                  </div>
                </div>
                <div style={{
                  padding: '8px 15px', backgroundColor: '#E74C3C', color: 'white',
                  borderRadius: '8px', fontWeight: 'bold', fontSize: '14px'
                }}>AGOTADO</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock bajo */}
      {alertas.stock_bajo && alertas.stock_bajo.length > 0 && (
        <div style={{
          backgroundColor: c.card, padding: '25px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '20px', borderLeft: '5px solid #FFB800'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#856404' }}>
            ⚠️ Productos con stock bajo ({alertas.stock_bajo.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertas.stock_bajo.map((p) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '15px', padding: '12px',
                backgroundColor: esOscuro ? 'rgba(255,184,0,0.15)' : '#FFF9E6',
                borderRadius: '10px', border: '1px solid #FFB800'
              }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '8px',
                  backgroundColor: esOscuro ? '#0F1621' : '#f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', flexShrink: 0
                }}>📦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: c.texto }}>{p.nombre}</div>
                  <div style={{ fontSize: '12px', color: esOscuro ? '#ffd966' : '#856404' }}>
                    {p.categoria_nombre} • {p.ubicacion_almacen}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFB800' }}>
                    {p.stock_actual} / {p.stock_minimo}
                  </div>
                  <div style={{ fontSize: '11px', color: esOscuro ? '#ffd966' : '#856404' }}>unidades</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Por caducar */}
      {alertas.por_caducar && alertas.por_caducar.length > 0 && (
        <div style={{
          backgroundColor: c.card, padding: '25px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '20px', borderLeft: '5px solid #9B59B6'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#9B59B6' }}>
            ⏰ Productos próximos a caducar ({alertas.por_caducar.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertas.por_caducar.map((p, i) => {
              const diasRestantes = Math.ceil((new Date(p.fecha_caducidad) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '15px', padding: '12px',
                  backgroundColor: esOscuro ? 'rgba(155,89,182,0.15)' : '#F4ECF7',
                  borderRadius: '10px', border: '1px solid #9B59B6'
                }}>
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '8px',
                    backgroundColor: esOscuro ? '#0F1621' : '#f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', flexShrink: 0
                  }}>🍽️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: c.texto }}>{p.nombre}</div>
                    <div style={{ fontSize: '12px', color: esOscuro ? '#d7bde2' : '#6C3483' }}>
                      Caduca: {new Date(p.fecha_caducidad).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <div style={{
                    padding: '8px 15px',
                    backgroundColor: diasRestantes <= 3 ? '#E74C3C' : '#F39C12',
                    color: 'white', borderRadius: '8px',
                    fontWeight: 'bold', fontSize: '14px', textAlign: 'center'
                  }}>
                    {diasRestantes <= 0 ? '¡CADUCADO!' : `${diasRestantes} días`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertasScreen;
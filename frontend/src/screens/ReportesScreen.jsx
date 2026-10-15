// ReportesScreen.jsx - Módulo de reportes con modo oscuro
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';
import { getApiUrl } from '../core/utils/apiUrl';

const ReportesScreen = () => {
  const [resumen, setResumen] = useState(null);
  const [ventasDia, setVentasDia] = useState([]);
  const [ventasCategoria, setVentasCategoria] = useState([]);
  const [productosTop, setProductosTop] = useState([]);
  const [margenes, setMargenes] = useState([]);
  const [dias, setDias] = useState(30);
  const [cargando, setCargando] = useState(true);

  const { tema } = useThemeStore();
  const esOscuro = tema === 'oscuro';

  const c = esOscuro ? {
    fondo: '#0F1621', card: '#1A2332', cardSecundario: '#0F1621',
    borde: '#2A3547', texto: '#FFFFFF', textoSuave: '#B0BEC5',
    textoMuted: '#8B9BB0', inputBg: '#0F1621', inputBorder: '#2A3547',
    sombra: '0 4px 20px rgba(0,0,0,0.5)', tablaHeader: '#0F1621'
  } : {
    fondo: '#F8F9FA', card: '#FFFFFF', cardSecundario: '#F9F9F9',
    borde: '#EEEEEE', texto: '#1A2332', textoSuave: '#666666',
    textoMuted: '#999999', inputBg: '#FFFFFF', inputBorder: '#DDDDDD',
    sombra: '0 4px 20px rgba(0,0,0,0.08)', tablaHeader: '#1A2332'
  };

  useEffect(() => { cargarDatos(); }, [dias]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [res, dia, cat, top, marg] = await Promise.all([
        apiClient.get('/reportes/resumen'),
        apiClient.get(`/reportes/ventas-por-dia?dias=${dias}`),
        apiClient.get('/reportes/ventas-por-categoria'),
        apiClient.get('/reportes/productos-top'),
        apiClient.get('/reportes/margenes')
      ]);
      setResumen(res.data);
      setVentasDia(dia.data);
      setVentasCategoria(cat.data);
      setProductosTop(top.data);
      setMargenes(marg.data);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <div style={{ padding: '60px', textAlign: 'center', color: c.textoSuave, backgroundColor: c.fondo, minHeight: '100vh' }}>
      Cargando reportes...
    </div>;
  }

  const maxVenta = ventasDia.length > 0 ? Math.max(...ventasDia.map(v => parseFloat(v.total)), 1) : 1;
  const colores = ['#FF6B00', '#4A90E2', '#27AE60', '#E74C3C', '#9B59B6', '#F1C40F', '#1ABC9C'];
  const totalCategoria = ventasCategoria.reduce((sum, cl) => sum + parseFloat(cl.total_ingresos), 0);

  return (
    <div style={{
      padding: '30px', maxWidth: '1400px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)', transition: 'background-color 0.3s ease'
    }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ margin: 0, color: c.texto }}>📊 Reportes</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px', color: c.texto }}>Período:</label>
          <select value={dias} onChange={(e) => setDias(parseInt(e.target.value))} style={{
            padding: '10px 15px', borderRadius: '10px',
            border: `2px solid ${c.inputBorder}`, fontSize: '14px',
            cursor: 'pointer', fontWeight: 'bold',
            color: c.texto, backgroundColor: c.inputBg
          }}>
            <option value={7}>Últimos 7 días</option>
            <option value={15}>Últimos 15 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
          <button onClick={cargarDatos} style={{
            padding: '10px 20px', backgroundColor: '#FF6B00', color: 'white',
            border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
          }}>🔄 Actualizar</button>
        </div>
      </div>

      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: c.card, padding: '25px', borderRadius: '16px', boxShadow: c.sombra, borderLeft: '5px solid #FF6B00' }}>
            <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold', letterSpacing: '1px' }}>TOTAL VENTAS</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: c.texto, marginTop: '8px' }}>{resumen.total_ventas}</div>
            <div style={{ fontSize: '13px', color: c.textoSuave, marginTop: '4px' }}>transacciones</div>
          </div>
          <div style={{ backgroundColor: c.card, padding: '25px', borderRadius: '16px', boxShadow: c.sombra, borderLeft: '5px solid #27AE60' }}>
            <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold', letterSpacing: '1px' }}>INGRESOS</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#27AE60', marginTop: '8px' }}>${resumen.total_ingresos.toFixed(2)}</div>
            <div style={{ fontSize: '13px', color: c.textoSuave, marginTop: '4px' }}>total recaudado</div>
          </div>
          <div style={{ backgroundColor: c.card, padding: '25px', borderRadius: '16px', boxShadow: c.sombra, borderLeft: '5px solid #E74C3C' }}>
            <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold', letterSpacing: '1px' }}>COSTOS</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#E74C3C', marginTop: '8px' }}>${resumen.total_costos.toFixed(2)}</div>
            <div style={{ fontSize: '13px', color: c.textoSuave, marginTop: '4px' }}>inversión total</div>
          </div>
          <div style={{ backgroundColor: c.card, padding: '25px', borderRadius: '16px', boxShadow: c.sombra, borderLeft: '5px solid #4A90E2' }}>
            <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold', letterSpacing: '1px' }}>GANANCIA</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4A90E2', marginTop: '8px' }}>${resumen.total_ganancia.toFixed(2)}</div>
            <div style={{ fontSize: '13px', color: c.textoSuave, marginTop: '4px' }}>promedio: ${resumen.promedio_venta}</div>
          </div>
        </div>
      )}

      {/* Gráfico ventas por día */}
      <div style={{ backgroundColor: c.card, padding: '25px', borderRadius: '16px', boxShadow: c.sombra, marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: c.texto }}>
          📈 Ventas por día (últimos {dias} días)
        </h2>
        {ventasDia.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>No hay datos en este período</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '250px', paddingTop: '20px', overflowX: 'auto', paddingBottom: '40px' }}>
            {ventasDia.map((v, i) => {
              const altura = (parseFloat(v.total) / maxVenta) * 100;
              return (
                <div key={i} style={{ flex: '1 0 50px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#FF6B00', marginBottom: '5px', whiteSpace: 'nowrap' }}>
                    ${parseFloat(v.total).toFixed(0)}
                  </div>
                  <div style={{
                    width: '100%', height: `${Math.max(altura, 5)}%`, minHeight: '10px',
                    background: 'linear-gradient(to top, #FF6B00, #FF8C3A)',
                    borderRadius: '6px 6px 0 0', transition: 'all 0.3s',
                    boxShadow: '0 -2px 8px rgba(255,107,0,0.3)'
                  }} />
                  <div style={{
                    fontSize: '10px', color: c.texto, marginTop: '8px',
                    fontWeight: 'bold', transform: 'rotate(-45deg)',
                    transformOrigin: 'center', whiteSpace: 'nowrap'
                  }}>
                    {v.fecha.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dos columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: c.card, padding: '25px', borderRadius: '16px', boxShadow: c.sombra }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: c.texto }}>🥧 Ventas por categoría</h2>
          {ventasCategoria.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>No hay datos</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {ventasCategoria.map((cat, i) => {
                const porcentaje = totalCategoria > 0 ? (parseFloat(cat.total_ingresos) / totalCategoria * 100).toFixed(1) : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: colores[i % colores.length] }} />
                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: c.texto }}>{cat.categoria}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: c.texto }}>${parseFloat(cat.total_ingresos).toFixed(2)}</div>
                        <div style={{ fontSize: '11px', color: c.textoSuave }}>{porcentaje}% • {cat.total_productos} unid.</div>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: c.cardSecundario, borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${porcentaje}%`, height: '100%', backgroundColor: colores[i % colores.length], borderRadius: '4px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: c.card, padding: '25px', borderRadius: '16px', boxShadow: c.sombra }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: c.texto }}>💰 Márgenes de ganancia</h2>
          {margenes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>No hay datos</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {margenes.map((m, i) => (
                <div key={i} style={{
                  padding: '12px', backgroundColor: c.cardSecundario, borderRadius: '10px',
                  borderLeft: `4px solid ${parseFloat(m.margen_porcentaje) > 30 ? '#27AE60' : parseFloat(m.margen_porcentaje) > 15 ? '#FFB800' : '#E74C3C'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: c.texto }}>{m.categoria}</span>
                    <span style={{
                      fontWeight: 'bold', fontSize: '16px',
                      color: parseFloat(m.margen_porcentaje) > 30 ? '#27AE60' : parseFloat(m.margen_porcentaje) > 15 ? '#FFB800' : '#E74C3C'
                    }}>{m.margen_porcentaje}%</span>
                  </div>
                  <div style={{ fontSize: '11px', color: c.textoSuave, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ingresos: ${parseFloat(m.ingresos).toFixed(2)}</span>
                    <span>Ganancia: ${parseFloat(m.ganancia).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Productos top */}
      <div style={{ backgroundColor: c.card, padding: '25px', borderRadius: '16px', boxShadow: c.sombra }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: c.texto }}>⭐ Top 10 productos más vendidos</h2>
        {productosTop.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>No hay datos de ventas aún</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: c.cardSecundario }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: c.textoSuave }}>#</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: c.textoSuave }}>PRODUCTO</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: c.textoSuave }}>CATEGORÍA</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: c.textoSuave }}>VENDIDOS</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: c.textoSuave }}>INGRESOS</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: c.textoSuave }}>GANANCIA</th>
                </tr>
              </thead>
              <tbody>
                {productosTop.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${c.borde}` }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : c.cardSecundario,
                        color: i < 3 ? 'white' : c.textoSuave,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '14px'
                      }}>{i + 1}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {p.imagen_principal && (
                          <img src={`${getApiUrl()}${p.imagen_principal}`} alt={p.nombre}
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                            onError={(e) => { e.target.style.display = 'none'; }} />
                        )}
                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: c.texto }}>{p.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: c.textoSuave }}>{p.categoria}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>{p.total_vendido}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#FF6B00', fontSize: '14px' }}>${parseFloat(p.total_ingresos).toFixed(2)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#27AE60', fontSize: '14px' }}>${parseFloat(p.ganancia).toFixed(2)}</td>
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

export default ReportesScreen;
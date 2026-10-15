// GastosScreen.jsx - Gestión de gastos
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const GastosScreen = () => {
  const [gastos, setGastos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Filtros
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    categoria_id: ''
  });

  // Formulario
  const [formData, setFormData] = useState({
    categoria_id: '',
    descripcion: '',
    monto: '',
    fecha_gasto: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    notas: ''
  });

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

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    cargarGastos();
  }, [filtros]);

  const cargarCategorias = async () => {
    try {
      const response = await apiClient.get('/gastos/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarGastos = async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });

      const [gastosRes, resumenRes] = await Promise.all([
        apiClient.get(`/gastos?${params.toString()}`),
        apiClient.get(`/gastos/resumen?${params.toString()}`)
      ]);

      setGastos(gastosRes.data.gastos);
      setResumen(resumenRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirModal = (gasto = null) => {
    if (gasto) {
      setGastoEditando(gasto);
      setFormData({
        categoria_id: gasto.categoria_id,
        descripcion: gasto.descripcion,
        monto: gasto.monto,
        fecha_gasto: gasto.fecha_gasto?.split('T')[0] || '',
        metodo_pago: gasto.metodo_pago || 'efectivo',
        notas: gasto.notas || ''
      });
    } else {
      setGastoEditando(null);
      setFormData({
        categoria_id: '',
        descripcion: '',
        monto: '',
        fecha_gasto: new Date().toISOString().split('T')[0],
        metodo_pago: 'efectivo',
        notas: ''
      });
    }
    setModalAbierto(true);
    setError('');
    setMensaje('');
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setGastoEditando(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const guardarGasto = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (gastoEditando) {
        await apiClient.put(`/gastos/${gastoEditando.id}`, formData);
        setMensaje('✅ Gasto actualizado');
      } else {
        await apiClient.post('/gastos', formData);
        setMensaje('✅ Gasto registrado');
      }
      cargarGastos();
      setTimeout(() => {
        cerrarModal();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const eliminarGasto = async (id) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    try {
      await apiClient.delete(`/gastos/${id}`);
      cargarGastos();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const filtroRapido = (tipo) => {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    if (tipo === 'hoy') {
      setFiltros({ ...filtros, fecha_inicio: hoyStr, fecha_fin: hoyStr });
    } else if (tipo === 'mes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFiltros({
        ...filtros,
        fecha_inicio: primerDia.toISOString().split('T')[0],
        fecha_fin: hoyStr
      });
    } else if (tipo === 'año') {
      const primerDia = new Date(hoy.getFullYear(), 0, 1);
      setFiltros({
        ...filtros,
        fecha_inicio: primerDia.toISOString().split('T')[0],
        fecha_fin: hoyStr
      });
    }
  };

  const limpiarFiltros = () => {
    setFiltros({ fecha_inicio: '', fecha_fin: '', categoria_id: '' });
  };

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '10px',
    border: `2px solid ${c.inputBorder}`, fontSize: '15px',
    outline: 'none', boxSizing: 'border-box',
    backgroundColor: c.inputBg, color: c.texto
  };

  const labelStyle = {
    display: 'block', marginBottom: '5px',
    fontWeight: 'bold', fontSize: '14px', color: c.texto
  };

  return (
    <div style={{
      padding: '30px', maxWidth: '1400px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)'
    }}>

      {/* Encabezado */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: c.texto }}>💸 Gestión de Gastos</h1>
          <p style={{ margin: '5px 0 0 0', color: c.textoSuave, fontSize: '14px' }}>
            Registra y controla los gastos del negocio
          </p>
        </div>
        <button onClick={() => abrirModal()} style={{
          padding: '14px 25px', backgroundColor: '#E74C3C', color: 'white',
          border: 'none', borderRadius: '10px', fontWeight: 'bold',
          cursor: 'pointer', fontSize: '15px',
          boxShadow: '0 2px 8px rgba(231,76,60,0.3)'
        }}>
          ➕ Nuevo gasto
        </button>
      </div>

      {mensaje && (
        <div style={{
          padding: '15px', marginBottom: '20px', borderRadius: '10px',
          backgroundColor: esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda',
          color: esOscuro ? '#7de8a8' : '#155724', fontWeight: 'bold'
        }}>{mensaje}</div>
      )}

      {/* Tarjetas de resumen */}
      {resumen && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px', marginBottom: '25px'
        }}>
          <div style={{
            backgroundColor: c.card, padding: '20px', borderRadius: '16px',
            boxShadow: c.sombra, borderLeft: '5px solid #27AE60'
          }}>
            <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold' }}>
              INGRESOS
            </div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#27AE60', marginTop: '5px' }}>
              ${resumen.total_ingresos.toFixed(2)}
            </div>
          </div>
          <div style={{
            backgroundColor: c.card, padding: '20px', borderRadius: '16px',
            boxShadow: c.sombra, borderLeft: '5px solid #E74C3C'
          }}>
            <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold' }}>
              GASTOS
            </div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#E74C3C', marginTop: '5px' }}>
              ${resumen.total_gastos.toFixed(2)}
            </div>
          </div>
          <div style={{
            backgroundColor: c.card, padding: '20px', borderRadius: '16px',
            boxShadow: c.sombra,
            borderLeft: `5px solid ${resumen.ganancia_neta >= 0 ? '#4A90E2' : '#E74C3C'}`
          }}>
            <div style={{ fontSize: '13px', color: c.textoMuted, fontWeight: 'bold' }}>
              GANANCIA NETA
            </div>
            <div style={{
              fontSize: '26px', fontWeight: 'bold', marginTop: '5px',
              color: resumen.ganancia_neta >= 0 ? '#4A90E2' : '#E74C3C'
            }}>
              ${resumen.ganancia_neta.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{
        backgroundColor: c.card, padding: '20px', borderRadius: '16px',
        boxShadow: c.sombra, marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: c.textoSuave, fontWeight: 'bold' }}>
            Rápido:
          </span>
          <button onClick={() => filtroRapido('hoy')} style={{
            padding: '8px 16px', backgroundColor: esOscuro ? '#2A3547' : '#F0F0F0',
            color: c.texto, border: 'none', borderRadius: '20px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
          }}>📅 Hoy</button>
          <button onClick={() => filtroRapido('mes')} style={{
            padding: '8px 16px', backgroundColor: esOscuro ? '#2A3547' : '#F0F0F0',
            color: c.texto, border: 'none', borderRadius: '20px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
          }}>📅 Este mes</button>
          <button onClick={() => filtroRapido('año')} style={{
            padding: '8px 16px', backgroundColor: esOscuro ? '#2A3547' : '#F0F0F0',
            color: c.texto, border: 'none', borderRadius: '20px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
          }}>📅 Este año</button>
          <button onClick={limpiarFiltros} style={{
            padding: '8px 16px', backgroundColor: '#E74C3C',
            color: 'white', border: 'none', borderRadius: '20px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
          }}>✕ Limpiar</button>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div>
            <label style={{ fontSize: '12px', color: c.textoSuave, fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
              Fecha inicio
            </label>
            <input type="date" value={filtros.fecha_inicio}
              onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: c.textoSuave, fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
              Fecha fin
            </label>
            <input type="date" value={filtros.fecha_fin}
              onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
              style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: c.textoSuave, fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
              Categoría
            </label>
            <select value={filtros.categoria_id}
              onChange={(e) => setFiltros({ ...filtros, categoria_id: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Todas</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px', color: c.textoMuted }}>
          Cargando gastos...
        </div>
      ) : gastos.length === 0 ? (
        <div style={{
          backgroundColor: c.card, padding: '60px', borderRadius: '16px',
          textAlign: 'center', color: c.textoMuted, boxShadow: c.sombra
        }}>
          No hay gastos registrados
        </div>
      ) : (
        <div style={{
          backgroundColor: c.card, borderRadius: '16px',
          boxShadow: c.sombra, overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: c.tablaHeader, color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>FECHA</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>CATEGORÍA</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>DESCRIPCIÓN</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>REGISTRADO POR</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>MONTO</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map(g => (
                  <tr key={g.id} style={{ borderBottom: `1px solid ${c.borde}` }}>
                    <td style={{ padding: '12px', color: c.texto, fontSize: '14px' }}>
                      {new Date(g.fecha_gasto).toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        backgroundColor: g.categoria_color + '20',
                        color: g.categoria_color,
                        padding: '4px 12px', borderRadius: '12px',
                        fontSize: '12px', fontWeight: 'bold'
                      }}>
                        {g.categoria_nombre}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: c.texto, fontSize: '14px' }}>
                      {g.descripcion}
                    </td>
                    <td style={{ padding: '12px', color: c.textoSuave, fontSize: '13px' }}>
                      {g.registrado_por || 'N/A'}
                    </td>
                    <td style={{
                      padding: '12px', textAlign: 'right',
                      fontWeight: 'bold', color: '#E74C3C', fontSize: '15px'
                    }}>
                      -${parseFloat(g.monto).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => abrirModal(g)} style={{
                          padding: '6px 10px', backgroundColor: '#FFB800',
                          color: 'white', border: 'none', borderRadius: '6px',
                          cursor: 'pointer', fontSize: '13px'
                        }}>✏️</button>
                        <button onClick={() => eliminarGasto(g.id)} style={{
                          padding: '6px 10px', backgroundColor: '#E74C3C',
                          color: 'white', border: 'none', borderRadius: '6px',
                          cursor: 'pointer', fontSize: '13px'
                        }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: c.card, padding: '30px', borderRadius: '16px',
            maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            border: '2px solid #E74C3C'
          }}>
            <h2 style={{ marginTop: 0, color: '#E74C3C' }}>
              {gastoEditando ? '✏️ Editar gasto' : '➕ Nuevo gasto'}
            </h2>

            {error && (
              <div style={{
                padding: '10px', marginBottom: '15px', borderRadius: '8px',
                backgroundColor: esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da',
                color: esOscuro ? '#ff9999' : '#721c24', fontWeight: 'bold'
              }}>❌ {error}</div>
            )}

            <form onSubmit={guardarGasto}>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Categoría *</label>
                <select name="categoria_id" value={formData.categoria_id}
                  onChange={handleChange} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Descripción *</label>
                <input type="text" name="descripcion" value={formData.descripcion}
                  onChange={handleChange} required
                  placeholder="Ej: Factura de luz octubre" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Monto *</label>
                <input type="number" name="monto" value={formData.monto}
                  onChange={handleChange} required step="0.01" min="0.01"
                  placeholder="0.00" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Fecha *</label>
                <input type="date" name="fecha_gasto" value={formData.fecha_gasto}
                  onChange={handleChange} required style={inputStyle} />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Método de pago</label>
                <select name="metodo_pago" value={formData.metodo_pago}
                  onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Notas (opcional)</label>
                <textarea name="notas" value={formData.notas}
                  onChange={handleChange} rows="2"
                  placeholder="Detalles adicionales..." 
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={cerrarModal} style={{
                  flex: 1, padding: '14px', backgroundColor: '#666',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontWeight: 'bold', cursor: 'pointer'
                }}>✕ Cancelar</button>
                <button type="submit" style={{
                  flex: 2, padding: '14px', backgroundColor: '#E74C3C',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontWeight: 'bold', cursor: 'pointer'
                }}>
                  {gastoEditando ? '💾 Actualizar' : '✅ Registrar gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GastosScreen;
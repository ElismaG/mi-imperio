// ClientesScreen.jsx - Módulo de clientes con modo oscuro
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const ClientesScreen = () => {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', email: '', telefono: '', cedula: '', direccion: '', es_vip: false
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

  useEffect(() => { cargarClientes(); }, []);

  const cargarClientes = async () => {
    try {
      setCargando(true);
      const response = await apiClient.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirFormulario = (cliente = null) => {
    if (cliente) {
      setClienteEditando(cliente);
      setFormData({
        nombre: cliente.nombre || '', email: cliente.email || '',
        telefono: cliente.telefono || '', cedula: cliente.cedula || '',
        direccion: cliente.direccion || '', es_vip: cliente.es_vip || false
      });
    } else {
      setClienteEditando(null);
      setFormData({ nombre: '', email: '', telefono: '', cedula: '', direccion: '', es_vip: false });
    }
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setClienteEditando(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (clienteEditando) {
        await apiClient.put(`/clientes/${clienteEditando.id}`, formData);
      } else {
        await apiClient.post('/clientes', formData);
      }
      cargarClientes();
      cerrarFormulario();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const eliminarCliente = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar a "${nombre}"?`)) return;
    try {
      await apiClient.delete(`/clientes/${id}`);
      cargarClientes();
    } catch (error) {
      alert('Error al eliminar: ' + (error.response?.data?.error || error.message));
    }
  };

  const verHistorial = async (id) => {
    try {
      const response = await apiClient.get(`/clientes/${id}/historial`);
      setHistorial(response.data);
    } catch (error) {
      alert('Error al cargar historial');
    }
  };

  const clientesFiltrados = clientes.filter(cl => {
    if (!busqueda) return true;
    const b = busqueda.toLowerCase();
    return cl.nombre.toLowerCase().includes(b) ||
           (cl.telefono && cl.telefono.includes(busqueda)) ||
           (cl.cedula && cl.cedula.includes(busqueda)) ||
           (cl.email && cl.email.toLowerCase().includes(b));
  });

  const inputStyle = {
    width: '100%', padding: '10px', borderRadius: '8px',
    border: `2px solid ${c.inputBorder}`, boxSizing: 'border-box',
    backgroundColor: c.inputBg, color: c.texto
  };

  const labelStyle = {
    display: 'block', marginBottom: '5px', fontWeight: 'bold',
    fontSize: '13px', color: c.texto
  };

  return (
    <div style={{
      padding: '30px', maxWidth: '1400px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)', transition: 'background-color 0.3s ease'
    }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, color: c.texto }}>👥 Clientes</h1>
          <p style={{ margin: '5px 0 0 0', color: c.textoSuave, fontSize: '14px' }}>
            {clientes.length} clientes registrados
          </p>
        </div>
        <button
          onClick={() => abrirFormulario()}
          style={{
            padding: '14px 25px', backgroundColor: '#27AE60',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(39,174,96,0.3)'
          }}
        >
          ➕ Nuevo cliente
        </button>
      </div>

      {mostrarFormulario && (
        <div style={{
          backgroundColor: c.card, padding: '25px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '30px', border: '2px solid #FF6B00'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: c.texto }}>
            {clienteEditando ? `✏️ Editar: ${clienteEditando.nombre}` : '➕ Nuevo cliente'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono *</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Cédula</label>
                <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                  <input type="checkbox" name="es_vip" checked={formData.es_vip} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
                  ⭐ Marcar como cliente VIP
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={cerrarFormulario} style={{
                flex: 1, padding: '12px 20px', backgroundColor: '#E74C3C',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
              }}>
                ✕ Cancelar
              </button>
              <button type="submit" style={{
                flex: 2, padding: '12px 30px', backgroundColor: '#27AE60',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
              }}>
                {clienteEditando ? '💾 Actualizar' : '✅ Guardar cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{
        backgroundColor: c.card, padding: '20px', borderRadius: '16px',
        boxShadow: c.sombra, marginBottom: '25px', transition: 'all 0.3s ease'
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, teléfono, cédula o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%', padding: '12px 15px', fontSize: '14px',
            borderRadius: '10px', border: `2px solid ${c.inputBorder}`,
            outline: 'none', boxSizing: 'border-box',
            backgroundColor: c.inputBg, color: c.texto
          }}
        />
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px', color: c.textoMuted }}>Cargando clientes...</div>
      ) : clientesFiltrados.length === 0 ? (
        <div style={{ backgroundColor: c.card, padding: '60px', borderRadius: '16px', textAlign: 'center', color: c.textoMuted }}>
          {busqueda ? 'No se encontraron clientes' : 'No hay clientes registrados'}
        </div>
      ) : (
        <div style={{ backgroundColor: c.card, borderRadius: '16px', boxShadow: c.sombra, overflow: 'hidden', transition: 'all 0.3s ease' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: c.tablaHeader, color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>CLIENTE</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>TELÉFONO</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>EMAIL</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>COMPRAS</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontSize: '13px' }}>TOTAL GASTADO</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cl) => (
                  <tr key={cl.id} style={{ borderBottom: `1px solid ${c.borde}` }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          backgroundColor: cl.es_vip ? '#FFD700' : '#4A90E2',
                          color: 'white', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', flexShrink: 0
                        }}>
                          {cl.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', color: c.texto, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {cl.nombre}
                            {cl.es_vip && <span title="Cliente VIP">⭐</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: c.textoMuted }}>
                            {cl.cedula ? `CI: ${cl.cedula}` : 'Sin cédula'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px', fontSize: '14px', color: c.textoSuave }}>📞 {cl.telefono}</td>
                    <td style={{ padding: '15px', fontSize: '13px', color: c.textoSuave }}>{cl.email || '-'}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block', padding: '4px 12px',
                        backgroundColor: esOscuro ? 'rgba(74,144,226,0.2)' : '#EAF3FC',
                        color: '#4A90E2', borderRadius: '12px',
                        fontSize: '13px', fontWeight: 'bold'
                      }}>
                        {cl.total_compras || 0}
                      </div>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#FF6B00', fontSize: '15px' }}>
                      ${parseFloat(cl.total_gastado || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button onClick={() => verHistorial(cl.id)} title="Ver historial" style={{
                          padding: '8px 12px', backgroundColor: '#4A90E2', color: 'white',
                          border: 'none', borderRadius: '8px', cursor: 'pointer',
                          fontSize: '14px', fontWeight: 'bold'
                        }}>👁️</button>
                        <button onClick={() => abrirFormulario(cl)} title="Editar" style={{
                          padding: '8px 12px', backgroundColor: '#FFB800', color: 'white',
                          border: 'none', borderRadius: '8px', cursor: 'pointer',
                          fontSize: '14px', fontWeight: 'bold'
                        }}>✏️</button>
                        <button onClick={() => eliminarCliente(cl.id, cl.nombre)} title="Eliminar" style={{
                          padding: '8px 12px', backgroundColor: '#E74C3C', color: 'white',
                          border: 'none', borderRadius: '8px', cursor: 'pointer',
                          fontSize: '14px', fontWeight: 'bold'
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

      {/* Modal de historial */}
      {historial && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: c.card, borderRadius: '16px', maxWidth: '800px',
            width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '30px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: c.texto }}>📋 Historial de {historial.cliente.nombre}</h2>
              <button onClick={() => setHistorial(null)} style={{
                background: 'none', border: 'none', fontSize: '24px',
                cursor: 'pointer', color: c.textoMuted
              }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
              <div style={{ padding: '15px', backgroundColor: esOscuro ? 'rgba(74,144,226,0.15)' : '#EAF3FC', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#4A90E2', fontWeight: 'bold' }}>COMPRAS</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4A90E2' }}>{historial.estadisticas.total_compras}</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#FF6B00', fontWeight: 'bold' }}>TOTAL GASTADO</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6B00' }}>${historial.estadisticas.total_gastado.toFixed(2)}</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: esOscuro ? 'rgba(39,174,96,0.15)' : '#E8F8F0', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#27AE60', fontWeight: 'bold' }}>PROMEDIO</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27AE60' }}>${historial.estadisticas.promedio_compra}</div>
              </div>
            </div>

            <h3 style={{ color: c.texto }}>Compras realizadas:</h3>
            {historial.ventas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: c.textoMuted }}>
                Este cliente no ha realizado compras aún
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historial.ventas.map((v) => (
                  <div key={v.id} style={{
                    padding: '15px', backgroundColor: c.cardSecundario,
                    borderRadius: '10px',
                    borderLeft: v.estado_entrega === 'pendiente' ? '4px solid #FFB800' : '4px solid #27AE60'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', color: c.texto }}>
                          Venta #{v.id} • {v.total_productos} producto(s)
                        </div>
                        <div style={{ fontSize: '12px', color: c.textoSuave, marginTop: '3px' }}>
                          {new Date(v.fecha_venta).toLocaleDateString('es-ES', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })} • {v.metodo_pago}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#FF6B00', fontSize: '18px' }}>
                          ${parseFloat(v.total).toFixed(2)}
                        </div>
                        {v.pin_retiro && v.estado_entrega === 'pendiente' && (
                          <div style={{
                            fontSize: '11px', backgroundColor: '#FFB800', color: 'white',
                            padding: '2px 8px', borderRadius: '10px',
                            marginTop: '4px', display: 'inline-block', fontWeight: 'bold'
                          }}>
                            PIN: {v.pin_retiro}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesScreen;
// EmpleadosScreen.jsx - Gestión de empleados con modo oscuro y botones de rol
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const EmpleadosScreen = ({ usuario }) => {
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', nombre_completo: '', rol_id: 3, pin_4digitos: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

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
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [empRes, rolesRes] = await Promise.all([
        apiClient.get('/empleados'),
        apiClient.get('/empleados/roles')
      ]);
      setEmpleados(empRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    } finally {
      setCargando(false);
    }
  };

  const abrirFormulario = (empleado = null) => {
    if (empleado) {
      setEmpleadoEditando(empleado);
      setFormData({
        email: empleado.email || '',
        password: '',
        nombre_completo: empleado.nombre_completo || '',
        rol_id: empleado.rol_id || 3,
        pin_4digitos: empleado.pin_4digitos || ''
      });
    } else {
      setEmpleadoEditando(null);
      setFormData({
        email: '', password: '', nombre_completo: '', rol_id: 3, pin_4digitos: ''
      });
    }
    setMostrarFormulario(true);
    setMensaje('');
    setError('');
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEmpleadoEditando(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    try {
      if (empleadoEditando) {
        await apiClient.put(`/empleados/${empleadoEditando.id}`, formData);
        setMensaje('✅ Empleado actualizado');
      } else {
        await apiClient.post('/empleados', formData);
        setMensaje('✅ Empleado creado');
      }
      cargarDatos();
      setTimeout(() => {
        cerrarFormulario();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const toggleActivo = async (empleado) => {
    if (!window.confirm(`¿${empleado.activo ? 'Desactivar' : 'Activar'} a "${empleado.nombre_completo}"?`)) return;
    try {
      await apiClient.patch(`/empleados/${empleado.id}/toggle-activo`);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const eliminarEmpleado = async (empleado) => {
    if (!window.confirm(`¿Eliminar a "${empleado.nombre_completo}"?\n\nSi tiene ventas registradas solo se desactivará.`)) return;
    try {
      const res = await apiClient.delete(`/empleados/${empleado.id}`);
      alert(res.data.mensaje);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'dueño': return { bg: '#FF6B00', text: 'white' };
      case 'admin': return { bg: '#9B59B6', text: 'white' };
      case 'cajero': return { bg: '#4A90E2', text: 'white' };
      case 'almacenista': return { bg: '#27AE60', text: 'white' };
      default: return { bg: '#666', text: 'white' };
    }
  };

  const getRolIcono = (rol) => {
    switch (rol) {
      case 'dueño': return '👔';
      case 'admin': return '🔧';
      case 'cajero': return '🛒';
      case 'almacenista': return '📦';
      default: return '👤';
    }
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
      padding: '30px', maxWidth: '1300px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)', transition: 'background-color 0.3s ease'
    }}>

      {/* Encabezado */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '30px',
        flexWrap: 'wrap', gap: '15px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: c.texto }}>👔 Gestión de Empleados</h1>
          <p style={{ margin: '5px 0 0 0', color: c.textoSuave, fontSize: '14px' }}>
            {empleados.length} empleados registrados
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
          ➕ Nuevo empleado
        </button>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div style={{
          padding: '15px', marginBottom: '20px', borderRadius: '10px',
          backgroundColor: esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda',
          color: esOscuro ? '#7de8a8' : '#155724', fontWeight: 'bold'
        }}>
          {mensaje}
        </div>
      )}
      {error && (
        <div style={{
          padding: '15px', marginBottom: '20px', borderRadius: '10px',
          backgroundColor: esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da',
          color: esOscuro ? '#ff9999' : '#721c24', fontWeight: 'bold'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <div style={{
          backgroundColor: c.card, padding: '25px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '30px', border: '2px solid #FF6B00'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#FF6B00' }}>
            {empleadoEditando ? `✏️ Editar: ${empleadoEditando.nombre_completo}` : '➕ Nuevo empleado'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={labelStyle}>Nombre completo *</label>
                <input
                  type="text" name="nombre_completo"
                  value={formData.nombre_completo} onChange={handleChange}
                  required placeholder="Ej: Juan Pérez" style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email" name="email"
                  value={formData.email} onChange={handleChange}
                  required placeholder="Ej: juan@miimperio.com" style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Contraseña {empleadoEditando ? '(dejar vacío para no cambiar)' : '*'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    name="password" value={formData.password} onChange={handleChange}
                    required={!empleadoEditando}
                    placeholder="Mínimo 4 caracteres"
                    style={{ ...inputStyle, paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', fontSize: '20px'
                    }}
                  >
                    {mostrarPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  PIN de 4 dígitos (opcional)
                </label>
                <input
                  type="text" name="pin_4digitos"
                  value={formData.pin_4digitos} onChange={handleChange}
                  maxLength="4" placeholder="Ej: 1234"
                  style={inputStyle}
                />
              </div>

              {/* 🆕 SELECTOR DE ROL CON BOTONES */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Rol *</label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px'
                }}>
                  {roles.map(rol => {
                    const seleccionado = formData.rol_id === rol.id;
                    const rolColor = getRolColor(rol.nombre);
                    const icono = getRolIcono(rol.nombre);

                    return (
                      <button
                        key={rol.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, rol_id: rol.id }))}
                        style={{
                          padding: '15px 10px',
                          border: seleccionado 
                            ? `3px solid ${rolColor.bg}` 
                            : `2px solid ${c.borde}`,
                          borderRadius: '12px',
                          backgroundColor: seleccionado 
                            ? (esOscuro ? `${rolColor.bg}22` : `${rolColor.bg}15`)
                            : c.cardSecundario,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s',
                          boxShadow: seleccionado ? `0 0 0 3px ${rolColor.bg}33` : 'none'
                        }}
                      >
                        <span style={{ fontSize: '28px' }}>{icono}</span>
                        <span style={{
                          fontWeight: 'bold',
                          fontSize: '13px',
                          color: seleccionado ? rolColor.bg : c.texto,
                          textTransform: 'capitalize'
                        }}>
                          {rol.nombre}
                        </span>
                        {seleccionado && (
                          <span style={{
                            fontSize: '10px',
                            color: rolColor.bg,
                            fontWeight: 'bold'
                          }}>
                            ✓ Seleccionado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Descripción del rol seleccionado */}
                {formData.rol_id && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 15px',
                    backgroundColor: c.cardSecundario,
                    borderRadius: '10px',
                    borderLeft: `4px solid ${getRolColor(roles.find(r => r.id === formData.rol_id)?.nombre).bg}`
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: c.textoMuted,
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}>
                      📋 DESCRIPCIÓN DEL ROL
                    </div>
                    <div style={{ fontSize: '14px', color: c.textoSuave }}>
                      {roles.find(r => r.id === formData.rol_id)?.descripcion || ''}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button
                type="button" onClick={cerrarFormulario}
                style={{
                  flex: 1, padding: '12px 20px', backgroundColor: '#E74C3C',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                ✕ Cancelar
              </button>
              <button
                type="submit"
                style={{
                  flex: 2, padding: '12px 30px', backgroundColor: '#27AE60',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                {empleadoEditando ? '💾 Actualizar' : '✅ Crear empleado'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px', color: c.textoMuted }}>
          Cargando empleados...
        </div>
      ) : empleados.length === 0 ? (
        <div style={{
          backgroundColor: c.card, padding: '60px', borderRadius: '16px',
          textAlign: 'center', color: c.textoMuted
        }}>
          No hay empleados registrados
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
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>EMPLEADO</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>EMAIL</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>ROL</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>ESTADO</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>ÚLTIMO ACCESO</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((emp) => {
                  const rolColor = getRolColor(emp.rol_nombre);
                  const esYoMismo = emp.id === usuario?.id;

                  return (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${c.borde}` }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: emp.activo ? rolColor.bg : '#666',
                            color: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 'bold',
                            fontSize: '16px', flexShrink: 0
                          }}>
                            {emp.nombre_completo.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{
                              fontWeight: 'bold', fontSize: '14px',
                              color: c.texto, display: 'flex',
                              alignItems: 'center', gap: '6px'
                            }}>
                              {emp.nombre_completo}
                              {esYoMismo && <span style={{ fontSize: '11px', color: '#FF6B00' }}>(Tú)</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px', fontSize: '13px', color: c.textoSuave }}>
                        {emp.email}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: rolColor.bg,
                          color: rolColor.text,
                          padding: '5px 12px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: 'bold',
                          textTransform: 'capitalize',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {getRolIcono(emp.rol_nombre)} {emp.rol_nombre}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: emp.activo
                            ? (esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda')
                            : (esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da'),
                          color: emp.activo
                            ? (esOscuro ? '#7de8a8' : '#155724')
                            : (esOscuro ? '#ff9999' : '#721c24'),
                          padding: '5px 12px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: 'bold'
                        }}>
                          {emp.activo ? '✅ Activo' : '⏸️ Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: c.textoMuted }}>
                        {emp.ultimo_acceso
                          ? new Date(emp.ultimo_acceso).toLocaleDateString('es-ES', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })
                          : 'Nunca'}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => abrirFormulario(emp)}
                            title="Editar"
                            style={{
                              padding: '6px 10px', backgroundColor: '#FFB800',
                              color: 'white', border: 'none', borderRadius: '6px',
                              cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                            }}
                          >
                            ✏️
                          </button>
                          {!esYoMismo && (
                            <>
                              <button
                                onClick={() => toggleActivo(emp)}
                                title={emp.activo ? 'Desactivar' : 'Activar'}
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: emp.activo ? '#666' : '#4A90E2',
                                  color: 'white', border: 'none', borderRadius: '6px',
                                  cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                                }}
                              >
                                {emp.activo ? '⏸️' : '▶️'}
                              </button>
                              <button
                                onClick={() => eliminarEmpleado(emp)}
                                title="Eliminar"
                                style={{
                                  padding: '6px 10px', backgroundColor: '#E74C3C',
                                  color: 'white', border: 'none', borderRadius: '6px',
                                  cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                                }}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nota informativa */}
      <div style={{
        marginTop: '25px', padding: '20px', borderRadius: '12px',
        backgroundColor: esOscuro ? 'rgba(74,144,226,0.15)' : '#EAF3FC',
        borderLeft: '5px solid #4A90E2'
      }}>
        <div style={{ fontWeight: 'bold', color: '#4A90E2', marginBottom: '8px' }}>
          ℹ️ Información
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', color: c.textoSuave, fontSize: '14px', lineHeight: '1.8' }}>
          <li><strong>Dueño:</strong> Acceso total al sistema</li>
          <li><strong>Admin:</strong> Igual que dueño pero sin poder eliminar empleados</li>
          <li><strong>Cajero:</strong> Solo TPV, pedidos, clientes y entregas</li>
          <li><strong>Almacenista:</strong> Solo entregas e inventario</li>
          <li>Los empleados <strong>no pueden eliminarse</strong> si tienen ventas registradas, solo desactivarse</li>
        </ul>
      </div>
    </div>
  );
};

export default EmpleadosScreen;
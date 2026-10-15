// MiPerfilScreen.jsx - Editar perfil del cliente
import { useState } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const MiPerfilScreen = ({ cliente, onVolver, onActualizar }) => {
  const [tab, setTab] = useState('datos'); // 'datos' | 'password'
  const [formData, setFormData] = useState({
    nombre: cliente.nombre || '',
    username: cliente.username || '',
    email: cliente.email || '',
    telefono: cliente.telefono || '',
    cedula: cliente.cedula || '',
    direccion: cliente.direccion || ''
  });
  const [passwordData, setPasswordData] = useState({
    password_actual: '',
    password_nueva: '',
    confirmar: ''
  });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const guardarDatos = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setMensaje('');

    try {
      const response = await apiClient.put(`/clientes/${cliente.id}/mi-perfil`, formData);
      setMensaje('✅ Perfil actualizado correctamente');
      
      // Actualizar el cliente en localStorage
      const clienteActualizado = { ...cliente, ...response.data.cliente };
      localStorage.setItem('cliente', JSON.stringify(clienteActualizado));
      
      if (onActualizar) onActualizar(clienteActualizado);
      
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setCargando(false);
    }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (passwordData.password_nueva !== passwordData.confirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordData.password_nueva.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres');
      return;
    }

    setCargando(true);
    try {
      await apiClient.put(`/clientes/${cliente.id}/mi-password`, {
        password_actual: passwordData.password_actual,
        password_nueva: passwordData.password_nueva
      });
      setMensaje('✅ Contraseña actualizada correctamente');
      setPasswordData({ password_actual: '', password_nueva: '', confirmar: '' });
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setCargando(false);
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
      minHeight: '100vh', backgroundColor: c.fondo,
      fontFamily: 'system-ui, sans-serif',
      transition: 'background-color 0.3s ease'
    }}>

      {/* Barra superior */}
      <div style={{
        backgroundColor: '#1A2332', color: 'white', padding: '15px 30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexWrap: 'wrap', gap: '10px'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>👤 Mi Perfil</h2>
          <div style={{ fontSize: '13px', color: '#8B9BB0' }}>Actualiza tus datos personales</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={toggleTema} style={{
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

      <div style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }}>

        {/* Mensajes */}
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
          }}>❌ {error}</div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '10px', marginBottom: '25px',
          borderBottom: `2px solid ${c.borde}`
        }}>
          <button
            onClick={() => { setTab('datos'); setError(''); setMensaje(''); }}
            style={{
              padding: '12px 24px', border: 'none',
              backgroundColor: 'transparent',
              color: tab === 'datos' ? '#4A90E2' : c.textoSuave,
              fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
              borderBottom: tab === 'datos' ? '3px solid #4A90E2' : '3px solid transparent',
              marginBottom: '-2px'
            }}
          >
            📋 Datos personales
          </button>
          <button
            onClick={() => { setTab('password'); setError(''); setMensaje(''); }}
            style={{
              padding: '12px 24px', border: 'none',
              backgroundColor: 'transparent',
              color: tab === 'password' ? '#FF6B00' : c.textoSuave,
              fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
              borderBottom: tab === 'password' ? '3px solid #FF6B00' : '3px solid transparent',
              marginBottom: '-2px'
            }}
          >
            🔐 Cambiar contraseña
          </button>
        </div>

        {/* TAB: DATOS */}
        {tab === 'datos' && (
          <div style={{
            backgroundColor: c.card, padding: '30px',
            borderRadius: '16px', boxShadow: c.sombra
          }}>
            <form onSubmit={guardarDatos}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Nombre completo *</label>
                <input type="text" name="nombre" value={formData.nombre}
                  onChange={handleChange} required style={inputStyle} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Nombre de usuario *</label>
                <input type="text" name="username" value={formData.username}
                  onChange={handleChange} required
                  placeholder="Ej: juanperez" style={inputStyle} />
                <p style={{ fontSize: '12px', color: c.textoMuted, marginTop: '5px' }}>
                  💡 Este es el nombre con el que inicias sesión
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Email</label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Teléfono *</label>
                <input type="text" name="telefono" value={formData.telefono}
                  onChange={handleChange} required style={inputStyle} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Cédula</label>
                <input type="text" name="cedula" value={formData.cedula}
                  onChange={handleChange} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={labelStyle}>Dirección</label>
                <textarea name="direccion" value={formData.direccion}
                  onChange={handleChange} rows="3"
                  placeholder="Calle, número, referencia..."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <button type="submit" disabled={cargando}
                style={{
                  width: '100%', padding: '14px',
                  backgroundColor: cargando ? '#666' : '#4A90E2',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '16px', fontWeight: 'bold',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(74,144,226,0.3)'
                }}>
                {cargando ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
            </form>
          </div>
        )}

        {/* TAB: PASSWORD */}
        {tab === 'password' && (
          <div style={{
            backgroundColor: c.card, padding: '30px',
            borderRadius: '16px', boxShadow: c.sombra
          }}>
            <form onSubmit={cambiarPassword}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Contraseña actual *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    name="password_actual"
                    value={passwordData.password_actual}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Tu contraseña actual"
                    style={{ ...inputStyle, paddingRight: '45px' }}
                  />
                  <button type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', fontSize: '20px'
                    }}>
                    {mostrarPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Nueva contraseña *</label>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  name="password_nueva"
                  value={passwordData.password_nueva}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Mínimo 4 caracteres"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={labelStyle}>Confirmar nueva contraseña *</label>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  name="confirmar"
                  value={passwordData.confirmar}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Repite la nueva contraseña"
                  style={inputStyle}
                />
              </div>

              <button type="submit" disabled={cargando}
                style={{
                  width: '100%', padding: '14px',
                  backgroundColor: cargando ? '#666' : '#FF6B00',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '16px', fontWeight: 'bold',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(255,107,0,0.3)'
                }}>
                {cargando ? 'Cambiando...' : '🔐 Cambiar contraseña'}
              </button>
            </form>

            <div style={{
              marginTop: '20px', padding: '15px',
              backgroundColor: esOscuro ? 'rgba(255,184,0,0.15)' : '#FFF9E6',
              borderRadius: '10px', borderLeft: '4px solid #FFB800'
            }}>
              <div style={{
                fontSize: '13px', color: esOscuro ? '#ffd966' : '#856404',
                fontWeight: 'bold', marginBottom: '5px'
              }}>
                ⚠️ Importante
              </div>
              <div style={{
                fontSize: '12px', color: esOscuro ? '#ffd966' : '#856404',
                lineHeight: '1.6'
              }}>
                Si cambias tu contraseña, tendrás que volver a iniciar sesión en otros dispositivos.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiPerfilScreen;
// RegistroClienteScreen.jsx - Registro con username y pregunta de seguridad
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const RegistroClienteScreen = ({ onVolverAlLogin }) => {
  const [formData, setFormData] = useState({
    nombre: '', username: '', email: '', telefono: '', cedula: '', direccion: '',
    password: '', confirmarPassword: '',
    pregunta_seguridad: '', respuesta_seguridad: ''
  });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [usernameDisponible, setUsernameDisponible] = useState(null);
  const [verificandoUsername, setVerificandoUsername] = useState(false);

  const { tema, toggleTema } = useThemeStore();
  const esOscuro = tema === 'oscuro';

  const c = esOscuro ? {
    fondo: '#0F1621', card: '#1A2332', texto: '#FFFFFF',
    textoSuave: '#B0BEC5', inputBg: '#0F1621', inputBorder: '#2A3547',
    sombra: '0 4px 20px rgba(0,0,0,0.5)', borde: '#2A3547'
  } : {
    fondo: '#f0f2f5', card: '#FFFFFF', texto: '#1A2332',
    textoSuave: '#666666', inputBg: '#FFFFFF', inputBorder: '#DDDDDD',
    sombra: '0 4px 20px rgba(0,0,0,0.1)', borde: '#E0E0E0'
  };

  const preguntasDisponibles = [
    '¿Cuál es el nombre de tu primera mascota?',
    '¿Cuál es el nombre de tu madre?',
    '¿Cuál es tu ciudad de nacimiento?',
    '¿Cuál es tu comida favorita?',
    '¿Cuál es el nombre de tu mejor amigo de la infancia?',
    '¿Cuál es tu color favorito?',
    '¿Cuál es el nombre de tu primera escuela?',
    '¿Cuál es tu marca de carro favorita?'
  ];

  // Verificar username con debounce
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameDisponible(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setVerificandoUsername(true);
      try {
        const response = await apiClient.get(`/auth/verificar-username/${formData.username.toLowerCase()}`);
        setUsernameDisponible(response.data.disponible);
      } catch (error) {
        setUsernameDisponible(null);
      } finally {
        setVerificandoUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (formData.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }
    if (!formData.username || formData.username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres');
      return;
    }
    if (usernameDisponible === false) {
      setError('Ese nombre de usuario ya está en uso');
      return;
    }
    if (!formData.pregunta_seguridad || !formData.respuesta_seguridad) {
      setError('Debes elegir una pregunta de seguridad y dar su respuesta');
      return;
    }

    setCargando(true);
    try {
      await apiClient.post('/clientes/registro', {
        nombre: formData.nombre,
        username: formData.username.toLowerCase(),
        email: formData.email,
        telefono: formData.telefono,
        cedula: formData.cedula,
        direccion: formData.direccion,
        password: formData.password,
        pregunta_seguridad: formData.pregunta_seguridad,
        respuesta_seguridad: formData.respuesta_seguridad
      });
      setExito(true);
      setTimeout(() => { onVolverAlLogin(); }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cuenta');
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

  if (exito) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: c.fondo, padding: '20px'
      }}>
        <div style={{
          backgroundColor: c.card, padding: '50px', borderRadius: '16px',
          boxShadow: c.sombra, maxWidth: '450px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
          <h1 style={{ color: '#27AE60', marginBottom: '15px' }}>¡Cuenta creada!</h1>
          <p style={{ color: c.textoSuave, fontSize: '16px' }}>
            Ya puedes iniciar sesión con tu usuario <strong>{formData.username}</strong> y contraseña.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: c.fondo, padding: '20px',
      position: 'relative', transition: 'background-color 0.3s ease'
    }}>

      <button
        onClick={toggleTema}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontSize: '32px', padding: '5px', lineHeight: 1
        }}
      >
        {esOscuro ? '☀️' : '🌙'}
      </button>

      <div style={{
        backgroundColor: c.card, padding: '40px', borderRadius: '16px',
        boxShadow: c.sombra, width: '100%', maxWidth: '520px',
        transition: 'all 0.3s ease',
        border: esOscuro ? `1px solid ${c.borde}` : 'none'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#FF6B00', margin: 0, fontSize: '28px' }}>🚀 Mi Imperio</h1>
          <p style={{ color: c.textoSuave, marginTop: '10px', fontSize: '15px' }}>
            Crea tu cuenta de cliente
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da',
            color: esOscuro ? '#ff9999' : '#721c24',
            borderRadius: '8px', marginBottom: '20px',
            fontWeight: 'bold', fontSize: '14px',
            border: esOscuro ? '1px solid #E74C3C' : 'none'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Nombre completo *</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
              required placeholder="Ej: Juan Pérez" style={inputStyle} />
          </div>

          {/* USERNAME */}
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Nombre de usuario *</label>
            <input
              type="text" name="username" value={formData.username} onChange={handleChange}
              required placeholder="Ej: juanperez"
              style={{
                ...inputStyle,
                borderColor: usernameDisponible === false 
                  ? '#E74C3C' 
                  : usernameDisponible === true 
                    ? '#27AE60' 
                    : c.inputBorder
              }}
            />
            {verificandoUsername && (
              <p style={{ fontSize: '12px', color: c.textoSuave, marginTop: '5px' }}>
                🔍 Verificando disponibilidad...
              </p>
            )}
            {!verificandoUsername && usernameDisponible === true && (
              <p style={{ fontSize: '12px', color: '#27AE60', marginTop: '5px', fontWeight: 'bold' }}>
                ✅ Disponible
              </p>
            )}
            {!verificandoUsername && usernameDisponible === false && (
              <p style={{ fontSize: '12px', color: '#E74C3C', marginTop: '5px', fontWeight: 'bold' }}>
                ❌ Ya está en uso
              </p>
            )}
            {!verificandoUsername && usernameDisponible === null && formData.username.length >= 3 && (
              <p style={{ fontSize: '12px', color: c.textoSuave, marginTop: '5px' }}>
                Mínimo 3 caracteres. Solo letras, números y guión bajo.
              </p>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              required placeholder="Ej: juan@email.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Teléfono *</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange}
              required placeholder="Ej: 555-1234" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Cédula (opcional)</label>
            <input type="text" name="cedula" value={formData.cedula} onChange={handleChange}
              placeholder="Ej: 85010112345" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Dirección (opcional)</label>
            <input type="text" name="direccion" value={formData.direccion} onChange={handleChange}
              placeholder="Ej: Calle Principal #123" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Contraseña *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                name="password" value={formData.password} onChange={handleChange}
                required placeholder="Mínimo 4 caracteres"
                style={{ ...inputStyle, paddingRight: '45px' }}
              />
              <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)}
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
            <label style={labelStyle}>Confirmar contraseña *</label>
            <input
              type={mostrarPassword ? 'text' : 'password'}
              name="confirmarPassword" value={formData.confirmarPassword}
              onChange={handleChange} required placeholder="Repite tu contraseña" style={inputStyle}
            />
          </div>

          {/* PREGUNTA DE SEGURIDAD */}
          <div style={{
            padding: '15px', backgroundColor: c.inputBg,
            borderRadius: '10px', marginBottom: '20px',
            border: `2px dashed ${c.inputBorder}`
          }}>
            <div style={{
              fontSize: '13px', color: c.texto, fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              🔐 Pregunta de seguridad
            </div>
            <p style={{ fontSize: '12px', color: c.textoSuave, marginBottom: '10px' }}>
              La usarás si olvidas tu contraseña
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Elige una pregunta *</label>
              <select
                name="pregunta_seguridad"
                value={formData.pregunta_seguridad}
                onChange={handleChange}
                required
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Selecciona...</option>
                {preguntasDisponibles.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Tu respuesta *</label>
              <input
                type="text" name="respuesta_seguridad"
                value={formData.respuesta_seguridad}
                onChange={handleChange} required
                placeholder="Escribe tu respuesta"
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando || usernameDisponible === false}
            style={{
              width: '100%', padding: '14px',
              backgroundColor: cargando || usernameDisponible === false ? '#666' : '#27AE60',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '16px', fontWeight: 'bold',
              cursor: cargando || usernameDisponible === false ? 'not-allowed' : 'pointer',
              marginBottom: '15px',
              boxShadow: '0 4px 12px rgba(39,174,96,0.3)'
            }}
          >
            {cargando ? 'Creando cuenta...' : '✅ Crear cuenta'}
          </button>

          <button
            type="button"
            onClick={onVolverAlLogin}
            style={{
              width: '100%', padding: '12px',
              backgroundColor: 'transparent',
              color: c.textoSuave,
              border: `2px solid ${c.borde}`,
              borderRadius: '10px', fontSize: '14px',
              fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            ← Volver al inicio de sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistroClienteScreen;
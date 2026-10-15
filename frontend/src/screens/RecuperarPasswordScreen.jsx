// RecuperarPasswordScreen.jsx - Recuperar contraseña con pregunta de seguridad
import { useState } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const RecuperarPasswordScreen = ({ onVolverAlLogin }) => {
  const [paso, setPaso] = useState(1); // 1: usuario, 2: pregunta, 3: nueva pass, 4: éxito
  const [usuario, setUsuario] = useState('');
  const [pregunta, setPregunta] = useState('');
  const [nombre, setNombre] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

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

  const buttonPrimary = {
    width: '100%', padding: '14px',
    backgroundColor: cargando ? '#666' : '#FF6B00',
    color: 'white', border: 'none', borderRadius: '10px',
    fontSize: '16px', fontWeight: 'bold',
    cursor: cargando ? 'not-allowed' : 'pointer',
    boxShadow: '0 4px 12px rgba(255,107,0,0.3)'
  };

  const buttonSecondary = {
    width: '100%', padding: '12px', marginTop: '10px',
    backgroundColor: 'transparent', color: c.textoSuave,
    border: `2px solid ${c.borde}`, borderRadius: '10px',
    fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
  };

  // PASO 1: Verificar usuario
  const buscarUsuario = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/obtener-pregunta', { usuario });
      setNombre(response.data.nombre);
      setPregunta(response.data.pregunta);
      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al buscar usuario');
    } finally {
      setCargando(false);
    }
  };

  // PASO 2: Verificar respuesta
  const verificarRespuesta = async (e) => {
    e.preventDefault();
    if (!respuesta.trim()) {
      setError('Debes ingresar tu respuesta');
      return;
    }
    // Avanzamos al paso 3 (la verificación real se hace al resetear)
    setPaso(3);
    setError('');
  };

  // PASO 3: Nueva contraseña
  const resetearPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (nuevaPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);
    try {
      await apiClient.post('/auth/resetear-password', {
        usuario,
        respuesta,
        nueva_password: nuevaPassword
      });
      setPaso(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al resetear contraseña');
      // Si la respuesta era incorrecta, volvemos al paso 2
      if (err.response?.data?.error?.includes('Respuesta')) {
        setTimeout(() => setPaso(2), 2000);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: c.fondo, padding: '20px',
      position: 'relative', transition: 'background-color 0.3s ease'
    }}>

      {/* Botón de tema */}
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
        boxShadow: c.sombra, width: '100%', maxWidth: '440px',
        transition: 'all 0.3s ease',
        border: esOscuro ? `1px solid ${c.borde}` : 'none'
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '60px', marginBottom: '10px' }}>🔑</div>
          <h1 style={{ color: '#FF6B00', margin: 0, fontSize: '24px' }}>
            Recuperar contraseña
          </h1>
          <p style={{ color: c.textoSuave, marginTop: '8px', fontSize: '14px' }}>
            {paso === 1 && 'Ingresa tu nombre de usuario'}
            {paso === 2 && 'Responde la pregunta de seguridad'}
            {paso === 3 && 'Crea tu nueva contraseña'}
            {paso === 4 && '¡Todo listo!'}
          </p>
        </div>

        {/* Indicador de pasos */}
        {paso < 4 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '8px',
            marginBottom: '25px'
          }}>
            {[1, 2, 3].map(p => (
              <div key={p} style={{
                width: p === paso ? '30px' : '10px',
                height: '10px', borderRadius: '5px',
                backgroundColor: p <= paso ? '#FF6B00' : c.borde,
                transition: 'all 0.3s'
              }} />
            ))}
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da',
            color: esOscuro ? '#ff9999' : '#721c24',
            borderRadius: '8px', marginBottom: '20px',
            fontSize: '14px', fontWeight: 'bold',
            border: esOscuro ? '1px solid #E74C3C' : 'none'
          }}>
            ❌ {error}
          </div>
        )}

        {/* PASO 1: Usuario */}
        {paso === 1 && (
          <form onSubmit={buscarUsuario}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Usuario o Email</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                placeholder="Ej: juanperez"
                autoFocus
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={cargando} style={buttonPrimary}>
              {cargando ? 'Buscando...' : '🔍 Buscar cuenta'}
            </button>
          </form>
        )}

        {/* PASO 2: Pregunta de seguridad */}
        {paso === 2 && (
          <form onSubmit={verificarRespuesta}>
            <div style={{
              padding: '15px', backgroundColor: c.inputBg,
              borderRadius: '10px', marginBottom: '20px',
              border: `1px solid ${c.borde}`
            }}>
              <div style={{ fontSize: '13px', color: c.textoSuave, marginBottom: '5px' }}>
                Hola, <strong style={{ color: c.texto }}>{nombre}</strong>
              </div>
              <div style={{
                fontSize: '15px', color: c.texto,
                fontWeight: 'bold', marginTop: '8px'
              }}>
                🔐 {pregunta}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Tu respuesta</label>
              <input
                type="text"
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                required
                placeholder="Escribe tu respuesta"
                autoFocus
                style={inputStyle}
              />
              <p style={{ fontSize: '11px', color: c.textoSuave, marginTop: '5px' }}>
                💡 No distingue mayúsculas/minúsculas
              </p>
            </div>

            <button type="submit" style={buttonPrimary}>
              Continuar →
            </button>

            <button
              type="button"
              onClick={() => { setPaso(1); setRespuesta(''); setError(''); }}
              style={buttonSecondary}
            >
              ← Volver
            </button>
          </form>
        )}

        {/* PASO 3: Nueva contraseña */}
        {paso === 3 && (
          <form onSubmit={resetearPassword}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  required
                  placeholder="Mínimo 4 caracteres"
                  autoFocus
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

            <div style={{ marginBottom: '25px' }}>
              <label style={labelStyle}>Confirmar contraseña</label>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                required
                placeholder="Repite la contraseña"
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={cargando} style={buttonPrimary}>
              {cargando ? 'Procesando...' : '✅ Cambiar contraseña'}
            </button>

            <button
              type="button"
              onClick={() => { setPaso(2); setNuevaPassword(''); setConfirmarPassword(''); setError(''); }}
              style={buttonSecondary}
            >
              ← Volver
            </button>
          </form>
        )}

        {/* PASO 4: Éxito */}
        {paso === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ color: '#27AE60', marginBottom: '15px' }}>
              ¡Contraseña actualizada!
            </h2>
            <p style={{ color: c.textoSuave, fontSize: '15px', marginBottom: '25px' }}>
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <button
              onClick={onVolverAlLogin}
              style={buttonPrimary}
            >
              🔐 Ir a iniciar sesión
            </button>
          </div>
        )}

        {/* Botón volver al login (siempre visible excepto en paso 4) */}
        {paso < 4 && (
          <button
            type="button"
            onClick={onVolverAlLogin}
            style={{
              width: '100%', marginTop: '15px', padding: '10px',
              backgroundColor: 'transparent', border: 'none',
              color: c.textoSuave, cursor: 'pointer',
              fontSize: '13px', fontWeight: 'bold',
              textDecoration: 'underline'
            }}
          >
            ← Volver al inicio de sesión
          </button>
        )}
      </div>
    </div>
  );
};

export default RecuperarPasswordScreen;
import { useState } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const LoginScreen = ({ onLoginExitoso, onLoginCliente, onIrARegistro, onIrARecuperar }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login-universal', { usuario, password });
      const { tipo, token, usuario: user, cliente } = response.data;

      if (tipo === 'empleado') {
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(user));
        localStorage.removeItem('cliente');
        if (onLoginExitoso) onLoginExitoso(user);
      } else if (tipo === 'cliente') {
        localStorage.setItem('token', token);
        localStorage.setItem('cliente', JSON.stringify(cliente));
        localStorage.removeItem('usuario');
        if (onLoginCliente) onLoginCliente(cliente);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
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
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: c.fondo, padding: '20px',
      position: 'relative', transition: 'background-color 0.3s ease'
    }}>

      {/* Botón de tema */}
      <button
        onClick={toggleTema}
        title={esOscuro ? 'Modo claro' : 'Modo oscuro'}
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
        boxShadow: c.sombra, width: '100%', maxWidth: '420px',
        transition: 'all 0.3s ease',
        border: esOscuro ? `1px solid ${c.borde}` : 'none'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#FF6B00', margin: 0, fontSize: '28px' }}>🚀 Mi Imperio</h1>
          <p style={{ color: c.textoSuave, marginTop: '10px', fontSize: '15px' }}>
            Sistema de gestión comercial
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da',
            color: esOscuro ? '#ff9999' : '#721c24',
            borderRadius: '8px', marginBottom: '20px',
            textAlign: 'center', fontSize: '14px', fontWeight: 'bold',
            border: esOscuro ? '1px solid #E74C3C' : 'none'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              placeholder="Ej: juanperez"
              autoComplete="username"
              style={inputStyle}
            />
            <p style={{ fontSize: '11px', color: c.textoSuave, marginTop: '5px' }}>
              💡 Ingresa tu nombre de usuario (no email)
            </p>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={labelStyle}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: '20px', padding: '5px'
                }}
              >
                {mostrarPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%', padding: '14px',
              backgroundColor: cargando ? '#666' : '#FF6B00',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '16px', fontWeight: 'bold',
              cursor: cargando ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(255,107,0,0.3)',
              marginBottom: '15px'
            }}
          >
            {cargando ? 'Iniciando...' : '🔐 Iniciar sesión'}
          </button>

          {/* Link "Olvidé mi contraseña" */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={onIrARecuperar}
              style={{
                background: 'none', border: 'none',
                color: '#4A90E2', cursor: 'pointer',
                fontSize: '13px', fontWeight: 'bold',
                textDecoration: 'underline'
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: c.borde }} />
          <span style={{ padding: '0 15px', color: c.textoSuave, fontSize: '13px' }}>
            ¿No tienes cuenta?
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: c.borde }} />
        </div>

        <button
          type="button"
          onClick={onIrARegistro}
          style={{
            width: '100%', padding: '14px',
            backgroundColor: 'transparent',
            color: '#27AE60', border: '2px solid #27AE60',
            borderRadius: '10px', fontSize: '15px',
            fontWeight: 'bold', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#27AE60';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#27AE60';
          }}
        >
          ✨ Crear cuenta de cliente
        </button>

        <div style={{
          textAlign: 'center', marginTop: '20px',
          color: c.textoSuave, fontSize: '12px'
        }}>
          Ingresa con tu usuario y contraseña.
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
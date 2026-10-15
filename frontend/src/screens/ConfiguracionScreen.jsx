// ConfiguracionScreen.jsx - Panel de configuración con modo oscuro
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const ConfiguracionScreen = ({ usuario }) => {
  const [config, setConfig] = useState({
    nombre_negocio: '',
    telefono: '',
    direccion: '',
    email_contacto: '',
    costo_envio: '0',
    moneda: 'CUP',
    mensaje_bienvenida: '',
    envio_habilitado: 'true',
    qr_transfermovil: '',
    // 🆕 Nuevos campos
    pago_app_habilitado: 'true',
    texto_instrucciones_pago: 'Escanea el QR con Transfermóvil, realiza el pago y sube una captura del comprobante.'
});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [imagenQR, setImagenQR] = useState(null);
  const [previewQR, setPreviewQR] = useState(null);

  const { tema } = useThemeStore();
  const esOscuro = tema === 'oscuro';

  const c = esOscuro ? {
    fondo: '#0F1621',
    card: '#1A2332',
    cardSecundario: '#0F1621',
    borde: '#2A3547',
    texto: '#FFFFFF',
    textoSuave: '#B0BEC5',
    textoMuted: '#8B9BB0',
    inputBg: '#0F1621',
    inputBorder: '#2A3547',
    sombra: '0 4px 20px rgba(0,0,0,0.5)',
  } : {
    fondo: '#F8F9FA',
    card: '#FFFFFF',
    cardSecundario: '#F9F9F9',
    borde: '#EEEEEE',
    texto: '#1A2332',
    textoSuave: '#666666',
    textoMuted: '#999999',
    inputBg: '#FFFFFF',
    inputBorder: '#DDDDDD',
    sombra: '0 4px 20px rgba(0,0,0,0.08)',
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setCargando(true);
      const response = await apiClient.get('/configuracion');
      setConfig(prev => ({ ...prev, ...response.data }));
      if (response.data.qr_transfermovil) {
        setPreviewQR(`${getApiUrl()}${response.data.qr_transfermovil}`);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenQR(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewQR(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');
    setError('');

    try {
      let qrUrl = config.qr_transfermovil;

      if (imagenQR) {
        const formData = new FormData();
        formData.append('imagen', imagenQR);
        const uploadRes = await apiClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        qrUrl = uploadRes.data.url;
      }

      await apiClient.put('/configuracion', {
        ...config,
        qr_transfermovil: qrUrl
      });

      setMensaje('✅ Configuración guardada exitosamente');
      setImagenQR(null);
      setTimeout(() => setMensaje(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar configuración');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{
        padding: '60px', textAlign: 'center',
        color: c.textoSuave, backgroundColor: c.fondo, minHeight: '100vh'
      }}>
        Cargando configuración...
      </div>
    );
  }

  return (
    <div style={{
      padding: '30px', maxWidth: '900px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)', transition: 'background-color 0.3s ease'
    }}>

      <h1 style={{ marginBottom: '30px', color: c.texto }}>⚙️ Configuración del Negocio</h1>

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
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Datos del negocio */}
        <div style={{
          backgroundColor: c.card, padding: '25px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '20px', transition: 'all 0.3s ease'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: c.texto, fontSize: '18px' }}>
            🏢 Datos del Negocio
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                Nombre del negocio
              </label>
              <input
                type="text" name="nombre_negocio" value={config.nombre_negocio}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: `2px solid ${c.inputBorder}`, fontSize: '15px',
                  boxSizing: 'border-box', color: c.texto, backgroundColor: c.inputBg
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                Teléfono
              </label>
              <input
                type="text" name="telefono" value={config.telefono}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: `2px solid ${c.inputBorder}`, fontSize: '15px',
                  boxSizing: 'border-box', color: c.texto, backgroundColor: c.inputBg
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                Email de contacto
              </label>
              <input
                type="email" name="email_contacto" value={config.email_contacto}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: `2px solid ${c.inputBorder}`, fontSize: '15px',
                  boxSizing: 'border-box', color: c.texto, backgroundColor: c.inputBg
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                Moneda
              </label>
              <select
                name="moneda" value={config.moneda} onChange={handleChange}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: `2px solid ${c.inputBorder}`, fontSize: '15px',
                  boxSizing: 'border-box', cursor: 'pointer',
                  color: c.texto, backgroundColor: c.inputBg
                }}
              >
                <option value="CUP">CUP (Peso Cubano)</option>
                <option value="USD">USD (Dólar)</option>
                <option value="MLC">MLC (Moneda Libremente Convertible)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                Dirección
              </label>
              <input
                type="text" name="direccion" value={config.direccion}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: `2px solid ${c.inputBorder}`, fontSize: '15px',
                  boxSizing: 'border-box', color: c.texto, backgroundColor: c.inputBg
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                Mensaje de bienvenida (para clientes)
              </label>
              <textarea
                name="mensaje_bienvenida" value={config.mensaje_bienvenida}
                onChange={handleChange} rows="3"
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: `2px solid ${c.inputBorder}`, fontSize: '15px',
                  boxSizing: 'border-box', resize: 'vertical',
                  fontFamily: 'inherit', color: c.texto, backgroundColor: c.inputBg
                }}
              />
            </div>
          </div>
        </div>

        {/* Entrega a domicilio */}
        <div style={{
          backgroundColor: c.card, padding: '25px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '20px', transition: 'all 0.3s ease'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: c.texto, fontSize: '18px' }}>
            🚚 Entrega a Domicilio
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                Costo de envío
              </label>
              <input
                type="number" name="costo_envio" value={config.costo_envio}
                onChange={handleChange} step="0.01"
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: `2px solid ${c.inputBorder}`, fontSize: '15px',
                  boxSizing: 'border-box', color: c.texto, backgroundColor: c.inputBg
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                Servicio de envío
              </label>
              <select
                name="envio_habilitado" value={config.envio_habilitado}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: `2px solid ${c.inputBorder}`, fontSize: '15px',
                  boxSizing: 'border-box', cursor: 'pointer',
                  color: c.texto, backgroundColor: c.inputBg
                }}
              >
                <option value="true">✅ Habilitado</option>
                <option value="false">❌ Deshabilitado</option>
              </select>
            </div>
          </div>
        </div>
{/* ═══ PAGO DESDE LA APP ═══ */}
<div style={{
  backgroundColor: c.card, padding: '25px', borderRadius: '16px',
  boxShadow: c.sombra, marginBottom: '20px', transition: 'all 0.3s ease'
}}>
  <h2 style={{ marginTop: 0, marginBottom: '20px', color: c.texto, fontSize: '18px' }}>
    💳 Pago desde la App
  </h2>

  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
    <div>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
        Permitir pago desde la app
      </label>
      <select
        name="pago_app_habilitado"
        value={config.pago_app_habilitado}
        onChange={handleChange}
        style={{
          width: '100%', padding: '12px', borderRadius: '10px',
          border: `2px solid ${c.inputBorder}`, fontSize: '15px',
          boxSizing: 'border-box', cursor: 'pointer',
          color: c.texto, backgroundColor: c.inputBg
        }}
      >
        <option value="true">✅ Habilitado (el cliente puede pagar por QR)</option>
        <option value="false">❌ Deshabilitado (solo paga al recibir)</option>
      </select>
      <p style={{ fontSize: '12px', color: c.textoMuted, marginTop: '5px' }}>
        Si está deshabilitado, los clientes solo podrán pagar al recibir el pedido.
      </p>
    </div>
  </div>

  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
      Instrucciones para el cliente
    </label>
    <textarea
      name="texto_instrucciones_pago"
      value={config.texto_instrucciones_pago}
      onChange={handleChange}
      rows="3"
      style={{
        width: '100%', padding: '12px', borderRadius: '10px',
        border: `2px solid ${c.inputBorder}`, fontSize: '14px',
        boxSizing: 'border-box', resize: 'vertical',
        fontFamily: 'inherit', color: c.texto, backgroundColor: c.inputBg
      }}
      placeholder="Ej: Escanea el QR con Transfermóvil, realiza el pago y sube una captura del comprobante."
    />
  </div>

  <div style={{
    padding: '15px',
    backgroundColor: esOscuro ? 'rgba(74,144,226,0.15)' : '#EAF3FC',
    borderRadius: '10px',
    borderLeft: '4px solid #4A90E2'
  }}>
    <div style={{ fontSize: '13px', color: c.texto, fontWeight: 'bold', marginBottom: '5px' }}>
      ℹ️ Cómo funciona el pago desde la app
    </div>
    <ul style={{ margin: 0, paddingLeft: '20px', color: c.textoSuave, fontSize: '13px', lineHeight: '1.6' }}>
      <li>El cliente arma su pedido y elige "Pagar ahora"</li>
      <li>Ve el QR de Transfermóvil y paga desde su app</li>
      <li>Sube una captura del comprobante</li>
      <li>El cajero verifica el comprobante y aprueba el pago</li>
      <li>El pedido queda "Pagado" y listo para procesar</li>
    </ul>
  </div>
</div>
        {/* QR */}
        <div style={{
          backgroundColor: c.card, padding: '25px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '20px', transition: 'all 0.3s ease'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: c.texto, fontSize: '18px' }}>
            📱 QR de Transfermóvil
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: c.texto }}>
                Subir nueva imagen QR
              </label>
              <input
                type="file" accept="image/*" onChange={handleImagenChange}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: `2px solid ${c.inputBorder}`, fontSize: '14px',
                  boxSizing: 'border-box', color: c.texto, backgroundColor: c.inputBg
                }}
              />
              <p style={{ fontSize: '12px', color: c.textoMuted, marginTop: '8px' }}>
                Sube la imagen del QR de la cuenta del dueño de Transfermóvil.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              {previewQR ? (
                <img
                  src={previewQR}
                  alt="QR Transfermóvil"
                  style={{
                    width: '180px', height: '180px', objectFit: 'contain',
                    borderRadius: '10px', border: '2px solid #FF6B00',
                    padding: '10px', backgroundColor: 'white'
                  }}
                />
              ) : (
                <div style={{
                  width: '180px', height: '180px', borderRadius: '10px',
                  backgroundColor: c.cardSecundario, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', color: c.textoMuted, fontSize: '14px',
                  border: `2px dashed ${c.borde}`
                }}>
                  Sin QR configurado
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={guardando}
          style={{
            width: '100%', padding: '20px',
            backgroundColor: guardando ? '#666' : '#27AE60',
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '18px', fontWeight: 'bold',
            cursor: guardando ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(39,174,96,0.3)'
          }}
        >
          {guardando ? 'Guardando...' : '💾 Guardar Configuración'}
        </button>
      </form>
    </div>
  );
};

export default ConfiguracionScreen;
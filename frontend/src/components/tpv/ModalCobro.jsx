// ModalCobro.jsx - Pop-up de cobro con métodos de pago
import { useState } from 'react';
import apiClient from '../../services/apiClient';
import qrTransfermovil from '../../assets/qr_transfermovil.png';
import { getApiUrl } from '../../core/utils/apiUrl';

const ModalCobro = ({ total, carrito, usuario, onClose, onVentaCompletada }) => {
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [retirarDespues, setRetirarDespues] = useState(false);
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cambio = efectivoRecibido ? parseFloat(efectivoRecibido) - total : 0;

  const handleConfirmar = async () => {
    setCargando(true);
    setError('');

    try {
      // 🆕 AHORA ENVIAMOS TALLA Y COLOR
      const ventaData = {
        productos: carrito.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          talla: item.talla || null,
          color: item.color || null
        })),
        metodo_pago: metodoPago,
        retirar_despues: retirarDespues
      };

      console.log('📦 Enviando venta:', ventaData);

      const response = await apiClient.post('/ventas', ventaData);
      onVentaCompletada(response.data.venta);

    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Error al procesar la venta');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>💳 Cobrar</h2>

        <div style={{
          padding: '15px',
          backgroundColor: '#FFF7ED',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Total a pagar</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FF6B00' }}>
            ${total.toFixed(2)}
          </div>
        </div>

        {/* Resumen de productos en el cobro */}
        <div style={{
          padding: '15px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          marginBottom: '20px',
          maxHeight: '150px',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>
            PRODUCTOS:
          </div>
          {carrito.map((item, i) => (
            <div key={i} style={{
              fontSize: '13px',
              padding: '5px 0',
              borderBottom: '1px solid #eee'
            }}>
              <div style={{ fontWeight: 'bold' }}>
                {item.cantidad}x {item.nombre}
              </div>
              {(item.talla || item.color) && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  {item.talla && `📏 Talla: ${item.talla}`}
                  {item.talla && item.color && ' | '}
                  {item.color && `🎨 Color: ${item.color}`}
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            {error}
          </div>
        )}

        {/* Métodos de pago */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px' }}>
            Método de pago:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => { setMetodoPago('efectivo'); setPagoConfirmado(false); }}
              style={{
                padding: '20px',
                border: metodoPago === 'efectivo' ? '3px solid #FF6B00' : '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: metodoPago === 'efectivo' ? '#FFF7ED' : 'white',
                cursor: 'pointer',
                fontSize: '32px'
              }}
            >
              💵
              <div style={{ fontSize: '14px', marginTop: '5px', fontWeight: 'bold' }}>Efectivo</div>
            </button>
            <button
              onClick={() => { setMetodoPago('transfermovil'); setPagoConfirmado(false); }}
              style={{
                padding: '20px',
                border: metodoPago === 'transfermovil' ? '3px solid #FF6B00' : '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: metodoPago === 'transfermovil' ? '#FFF7ED' : 'white',
                cursor: 'pointer',
                fontSize: '32px'
              }}
            >
              📱
              <div style={{ fontSize: '14px', marginTop: '5px', fontWeight: 'bold' }}>Transfermóvil</div>
            </button>
          </div>
        </div>

        {/* Efectivo */}
        {metodoPago === 'efectivo' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
              Paga con:
            </label>
            <input
              type="number"
              value={efectivoRecibido}
              onChange={(e) => setEfectivoRecibido(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '20px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                boxSizing: 'border-box'
              }}
            />
            {efectivoRecibido && parseFloat(efectivoRecibido) >= total && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                Cambio: ${cambio.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Transfermóvil */}
        {metodoPago === 'transfermovil' && (
          <div style={{
            marginBottom: '20px',
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '2px solid #FF6B00'
          }}>
            <p style={{ marginTop: 0, fontWeight: 'bold', fontSize: '16px' }}>
              📱 Escanee el código QR con Transfermóvil
            </p>

            <img
              src={qrTransfermovil}
              alt="QR Transfermóvil"
              style={{
                width: '220px',
                height: '220px',
                margin: '10px auto',
                display: 'block',
                borderRadius: '8px',
                backgroundColor: 'white',
                padding: '10px',
                border: '1px solid #ddd'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML += '<div style="padding:20px;color:#999">[QR no disponible]</div>';
              }}
            />

            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Teléfono: +53 5XXXXXXX
            </p>

            <button
              onClick={() => setPagoConfirmado(true)}
              disabled={pagoConfirmado}
              style={{
                padding: '12px 24px',
                backgroundColor: pagoConfirmado ? '#28a745' : '#4A90E2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: pagoConfirmado ? 'default' : 'pointer'
              }}
            >
              {pagoConfirmado ? '✅ Cliente ya pagó' : 'Cliente ya pagó'}
            </button>
          </div>
        )}

        {/* Retirar después */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={retirarDespues}
              onChange={(e) => setRetirarDespues(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span>🕐 Retirará después (generar PIN)</span>
          </label>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={cargando}
            style={{
              flex: 1,
              padding: '15px',
              backgroundColor: cargando ? '#ccc' : '#E74C3C',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: cargando ? 'not-allowed' : 'pointer'
            }}
          >
            ✕ Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={cargando || (metodoPago === 'transfermovil' && !pagoConfirmado)}
            style={{
              flex: 2,
              padding: '15px',
              backgroundColor: 
                cargando || (metodoPago === 'transfermovil' && !pagoConfirmado) 
                  ? '#ccc' 
                  : '#27AE60',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 
                cargando || (metodoPago === 'transfermovil' && !pagoConfirmado) 
                  ? 'not-allowed' 
                  : 'pointer'
            }}
          >
            {cargando ? 'Procesando...' : '✅ Confirmar pago'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCobro;
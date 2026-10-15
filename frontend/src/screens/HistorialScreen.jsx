// HistorialScreen.jsx - Histórico completo de ventas con filtros
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';
import * as XLSX from 'xlsx';
import { getApiUrl } from '../core/utils/apiUrl';

const HistorialScreen = () => {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalRecaudado, setTotalRecaudado] = useState(0);
  const [empleados, setEmpleados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    cliente_id: '',
    usuario_id: '',
    metodo_pago: '',
    estado_entrega: '',
    tipo: '',
    busqueda: ''
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
    cargarFiltros();
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [filtros]);

  const cargarFiltros = async () => {
    try {
      const [empRes, cliRes] = await Promise.all([
        apiClient.get('/historial/filtros/empleados'),
        apiClient.get('/historial/filtros/clientes')
      ]);
      setEmpleados(empRes.data);
      setClientes(cliRes.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, valor]) => {
        if (valor) params.append(key, valor);
      });

      const response = await apiClient.get(`/historial?${params.toString()}`);
      setVentas(response.data.ventas);
      setTotal(response.data.total);
      setTotalRecaudado(response.data.total_recaudado);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const verDetalle = async (id) => {
    try {
      setCargandoDetalle(true);
      const response = await apiClient.get(`/historial/${id}/detalle`);
      setDetalle(response.data);
    } catch (error) {
      alert('Error al cargar detalle');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_inicio: '',
      fecha_fin: '',
      cliente_id: '',
      usuario_id: '',
      metodo_pago: '',
      estado_entrega: '',
      tipo: '',
      busqueda: ''
    });
  };

  const aplicarFiltroRapido = (tipo) => {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    if (tipo === 'hoy') {
      setFiltros({ ...filtros, fecha_inicio: hoyStr, fecha_fin: hoyStr });
    } else if (tipo === 'semana') {
      const hace7 = new Date();
      hace7.setDate(hace7.getDate() - 7);
      setFiltros({
        ...filtros,
        fecha_inicio: hace7.toISOString().split('T')[0],
        fecha_fin: hoyStr
      });
    } else if (tipo === 'mes') {
      const hace30 = new Date();
      hace30.setDate(hace30.getDate() - 30);
      setFiltros({
        ...filtros,
        fecha_inicio: hace30.toISOString().split('T')[0],
        fecha_fin: hoyStr
      });
    }
  };

  const exportarCSV = () => {
    try {
      console.log('🔄 Iniciando exportación. Ventas en estado:', ventas.length);

      if (!ventas || ventas.length === 0) {
        alert('⚠️ No hay ventas para exportar. Limpia los filtros primero.');
        return;
      }

      // Preparar los datos
      const datos = ventas.map(v => ({
        'ID': v.id,
        'Fecha': new Date(v.fecha_venta).toLocaleString('es-ES'),
        'Cliente': v.cliente_nombre || 'Venta directa',
        'Teléfono': v.cliente_telefono || '',
        'Vendedor': v.vendedor || 'N/A',
        'Productos': v.total_productos || 0,
        'Total': parseFloat(v.total).toFixed(2),
        'Método de Pago': v.metodo_pago || '',
        'Estado': v.estado_entrega || '',
        'Tipo': v.tipo || '',
        'Tipo Entrega': v.tipo_entrega || 'retiro',
        'PIN': v.pin_retiro || ''
      }));

      console.log('📊 Datos a exportar:', datos);

      // Crear hoja de Excel
      const hoja = XLSX.utils.json_to_sheet(datos);

      // Ajustar ancho de columnas
      hoja['!cols'] = [
        { wch: 6 },   // ID
        { wch: 18 },  // Fecha
        { wch: 20 },  // Cliente
        { wch: 15 },  // Teléfono
        { wch: 20 },  // Vendedor
        { wch: 10 },  // Productos
        { wch: 12 },  // Total
        { wch: 18 },  // Método Pago
        { wch: 12 },  // Estado
        { wch: 10 },  // Tipo
        { wch: 12 },  // Tipo Entrega
        { wch: 8 }    // PIN
      ];

      // Crear libro
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Ventas');

      // Nombre del archivo con fecha y hora
      const fecha = new Date();
      const nombreArchivo = `Historial_Ventas_${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2,'0')}-${fecha.getDate().toString().padStart(2,'0')}_${fecha.getHours()}-${fecha.getMinutes()}.xlsx`;

      // Descargar
      XLSX.writeFile(libro, nombreArchivo);

      console.log('✅ Archivo exportado:', nombreArchivo);

    } catch (error) {
      console.error('❌ Error al exportar:', error);
      alert('Error al exportar: ' + error.message);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px', borderRadius: '8px',
    border: `2px solid ${c.inputBorder}`, fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
    backgroundColor: c.inputBg, color: c.texto
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'entregado': return { bg: esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda', color: esOscuro ? '#7de8a8' : '#155724' };
      case 'pendiente': return { bg: esOscuro ? 'rgba(255,184,0,0.2)' : '#fff3cd', color: esOscuro ? '#ffd966' : '#856404' };
      case 'cancelado': return { bg: esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da', color: esOscuro ? '#ff9999' : '#721c24' };
      default: return { bg: c.cardSecundario, color: c.textoSuave };
    }
  };

  return (
    <div style={{
      padding: '30px', maxWidth: '1600px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)', transition: 'background-color 0.3s ease'
    }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: c.texto }}>📊 Histórico de Ventas</h1>
          <p style={{ margin: '5px 0 0 0', color: c.textoSuave, fontSize: '14px' }}>
            {total} venta(s) encontrada(s) • Total recaudado: <strong style={{ color: '#FF6B00' }}>${totalRecaudado.toFixed(2)}</strong>
          </p>
        </div>
        <button onClick={exportarCSV} style={{
          padding: '12px 24px', backgroundColor: '#27AE60', color: 'white',
          border: 'none', borderRadius: '10px', fontWeight: 'bold',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          📥 Exportar a Excel
        </button>
      </div>

      {/* Filtros rápidos */}
      <div style={{
        backgroundColor: c.card, padding: '20px', borderRadius: '16px',
        boxShadow: c.sombra, marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '14px', color: c.textoSuave, fontWeight: 'bold', alignSelf: 'center' }}>
            Filtros rápidos:
          </span>
          <button onClick={() => aplicarFiltroRapido('hoy')} style={{
            padding: '8px 16px', backgroundColor: esOscuro ? '#2A3547' : '#F0F0F0',
            color: c.texto, border: 'none', borderRadius: '20px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
          }}>
            📅 Hoy
          </button>
          <button onClick={() => aplicarFiltroRapido('semana')} style={{
            padding: '8px 16px', backgroundColor: esOscuro ? '#2A3547' : '#F0F0F0',
            color: c.texto, border: 'none', borderRadius: '20px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
          }}>
            📅 Última semana
          </button>
          <button onClick={() => aplicarFiltroRapido('mes')} style={{
            padding: '8px 16px', backgroundColor: esOscuro ? '#2A3547' : '#F0F0F0',
            color: c.texto, border: 'none', borderRadius: '20px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
          }}>
            📅 Últimos 30 días
          </button>
          <button onClick={limpiarFiltros} style={{
            padding: '8px 16px', backgroundColor: '#E74C3C',
            color: 'white', border: 'none', borderRadius: '20px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
          }}>
            ✕ Limpiar
          </button>
        </div>

        {/* Filtros detallados */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div>
            <label style={{ fontSize: '12px', color: c.textoSuave, fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
              Buscar (ID o PIN)
            </label>
            <input type="text" placeholder="Ej: 5 o 1234"
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              style={inputStyle} />
          </div>

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
              Cliente
            </label>
            <select value={filtros.cliente_id}
              onChange={(e) => setFiltros({ ...filtros, cliente_id: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Todos</option>
              {clientes.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: c.textoSuave, fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
              Vendedor
            </label>
            <select value={filtros.usuario_id}
              onChange={(e) => setFiltros({ ...filtros, usuario_id: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Todos</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: c.textoSuave, fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
              Método de pago
            </label>
            <select value={filtros.metodo_pago}
              onChange={(e) => setFiltros({ ...filtros, metodo_pago: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="transfermovil">Transfermóvil</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transfermovil_app">Transfermóvil (App)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: c.textoSuave, fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
              Estado
            </label>
            <select value={filtros.estado_entrega}
              onChange={(e) => setFiltros({ ...filtros, estado_entrega: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: c.textoSuave, fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
              Tipo
            </label>
            <select value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Todos</option>
              <option value="presencial">Presencial</option>
              <option value="pedido">Pedido (App)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px', color: c.textoMuted }}>Cargando historial...</div>
      ) : ventas.length === 0 ? (
        <div style={{
          backgroundColor: c.card, padding: '60px', borderRadius: '16px',
          textAlign: 'center', color: c.textoMuted, boxShadow: c.sombra
        }}>
          No se encontraron ventas con esos filtros
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
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>FECHA</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>CLIENTE</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>VENDEDOR</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>PRODUCTOS</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>TOTAL</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>PAGO</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>ESTADO</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map(v => {
                  const estadoColor = getEstadoColor(v.estado_entrega);
                  return (
                    <tr key={v.id} style={{ borderBottom: `1px solid ${c.borde}` }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: c.texto }}>
                        #{v.id}
                        {v.tipo === 'pedido' && (
                          <span style={{
                            marginLeft: '6px', fontSize: '10px',
                            backgroundColor: '#FFB800', color: 'white',
                            padding: '2px 6px', borderRadius: '8px'
                          }}>APP</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: c.textoSuave }}>
                        {new Date(v.fecha_venta).toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: c.texto }}>
                        {v.cliente_nombre || 'Venta directa'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: c.textoSuave }}>
                        {v.vendedor || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: c.textoSuave }}>
                        {v.total_productos} producto(s)
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#FF6B00' }}>
                        ${parseFloat(v.total).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: c.textoSuave }}>
                        {v.metodo_pago}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: estadoColor.bg, color: estadoColor.color,
                          padding: '4px 10px', borderRadius: '12px',
                          fontSize: '11px', fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }}>
                          {v.estado_entrega}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => verDetalle(v.id)} style={{
                          padding: '6px 12px', backgroundColor: '#4A90E2',
                          color: 'white', border: 'none', borderRadius: '6px',
                          cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                        }}>
                          👁️ Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {detalle && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: c.card, padding: '30px', borderRadius: '16px',
            maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: c.texto }}>📋 Detalle de Venta #{detalle.venta.id}</h2>
              <button onClick={() => setDetalle(null)} style={{
                background: 'none', border: 'none', fontSize: '24px',
                cursor: 'pointer', color: c.textoSuave
              }}>✕</button>
            </div>

            {/* Info general */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '15px', padding: '15px', backgroundColor: c.cardSecundario,
              borderRadius: '10px', marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: c.textoMuted, fontWeight: 'bold' }}>CLIENTE</div>
                <div style={{ fontSize: '15px', color: c.texto, fontWeight: 'bold' }}>
                  {detalle.venta.cliente_nombre || 'Venta directa'}
                </div>
                {detalle.venta.cliente_telefono && (
                  <div style={{ fontSize: '13px', color: c.textoSuave }}>📞 {detalle.venta.cliente_telefono}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: c.textoMuted, fontWeight: 'bold' }}>VENDEDOR</div>
                <div style={{ fontSize: '15px', color: c.texto, fontWeight: 'bold' }}>
                  {detalle.venta.vendedor || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: c.textoMuted, fontWeight: 'bold' }}>FECHA</div>
                <div style={{ fontSize: '14px', color: c.texto }}>
                  {new Date(detalle.venta.fecha_venta).toLocaleString('es-ES')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: c.textoMuted, fontWeight: 'bold' }}>MÉTODO DE PAGO</div>
                <div style={{ fontSize: '14px', color: c.texto, textTransform: 'capitalize' }}>
                  {detalle.venta.metodo_pago}
                </div>
              </div>
              {detalle.venta.pin_retiro && (
                <div>
                  <div style={{ fontSize: '11px', color: c.textoMuted, fontWeight: 'bold' }}>PIN</div>
                  <div style={{
                    fontSize: '18px', color: '#FF6B00', fontWeight: 'bold',
                    letterSpacing: '3px'
                  }}>
                    {detalle.venta.pin_retiro}
                  </div>
                </div>
              )}
              {detalle.venta.direccion_entrega && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '11px', color: c.textoMuted, fontWeight: 'bold' }}>
                    📍 DIRECCIÓN DE ENTREGA
                  </div>
                  <div style={{ fontSize: '14px', color: c.texto }}>
                    {detalle.venta.direccion_entrega}
                  </div>
                </div>
              )}
            </div>

            {/* Productos */}
            <h3 style={{ color: c.texto, fontSize: '16px', marginBottom: '12px' }}>
              🛍️ Productos ({detalle.productos.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {detalle.productos.map(p => (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', backgroundColor: c.cardSecundario,
                  borderRadius: '10px'
                }}>
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '8px',
                    backgroundColor: esOscuro ? '#0F1621' : '#f0f0f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', flexShrink: 0, overflow: 'hidden'
                  }}>
                    {p.imagen ? (
                      <img src={`${getApiUrl()}${p.imagen}`} alt={p.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '📦'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: c.texto, fontSize: '14px' }}>
                      {p.nombre}
                    </div>
                    <div style={{ fontSize: '11px', color: c.textoSuave }}>
                      {p.talla && `Talla: ${p.talla}`}
                      {p.talla && p.color && ' • '}
                      {p.color && `Color: ${p.color}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: c.texto }}>x{p.cantidad}</div>
                    <div style={{ color: '#FF6B00', fontWeight: 'bold', fontSize: '14px' }}>
                      ${parseFloat(p.subtotal).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              marginTop: '20px', padding: '15px',
              backgroundColor: esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED',
              borderRadius: '10px', border: '2px solid #FF6B00',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: c.texto }}>TOTAL</span>
              <span style={{ fontSize: '26px', fontWeight: 'bold', color: '#FF6B00' }}>
                ${parseFloat(detalle.venta.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialScreen;
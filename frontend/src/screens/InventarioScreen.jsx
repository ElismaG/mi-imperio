// InventarioScreen.jsx - Gestión completa de inventario con modo oscuro
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';
import FormularioProducto from '../components/FormularioProducto';
import { getApiUrl } from '../core/utils/apiUrl';

const InventarioScreen = ({ usuario }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [modalStock, setModalStock] = useState(null);
  const [stockCantidad, setStockCantidad] = useState(0);
  const [stockMotivo, setStockMotivo] = useState('compra_proveedor');

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
    tablaHeader: '#0F1621',
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
    tablaHeader: '#1A2332',
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [prodRes, catRes] = await Promise.all([
        apiClient.get('/productos'),
        apiClient.get('/categorias').catch(() => ({ data: [] }))
      ]);
      setProductos(prodRes.data);
      setCategorias(catRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await apiClient.get('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const eliminarProducto = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${nombre}"?`)) return;
    try {
      await apiClient.delete(`/productos/${id}`);
      cargarProductos();
    } catch (error) {
      alert('Error al eliminar producto');
    }
  };

  const abrirEditar = (producto) => {
    setProductoEditando(producto);
    setMostrarFormulario(true);
  };

  const abrirAjusteStock = (producto) => {
    setModalStock(producto);
    setStockCantidad(0);
    setStockMotivo('compra_proveedor');
  };

  const confirmarAjusteStock = async () => {
    if (!modalStock || stockCantidad === 0) return;
    try {
      await apiClient.post(`/productos/${modalStock.id}/ajustar-stock`, {
        cantidad: stockCantidad,
        motivo: stockMotivo
      });
      setModalStock(null);
      setStockCantidad(0);
      cargarProductos();
    } catch (error) {
      alert('Error al ajustar stock: ' + (error.response?.data?.error || error.message));
    }
  };

  const productosFiltrados = productos.filter(p => {
    if (filtroCategoria !== 'todas' && p.categoria_id !== parseInt(filtroCategoria)) return false;
    if (busqueda) {
      return p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
             (p.codigo_barras && p.codigo_barras.includes(busqueda));
    }
    return true;
  });

  const getColorStock = (actual, minimo) => {
    if (actual === 0) return { bg: '#E74C3C', color: 'white' };
    if (actual <= minimo) return { bg: '#FFB800', color: 'white' };
    return { bg: '#27AE60', color: 'white' };
  };

  return (
    <div style={{
      padding: '30px', maxWidth: '1400px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)', transition: 'background-color 0.3s ease'
    }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: 0, color: c.texto }}>📦 Inventario</h1>
          <p style={{ margin: '5px 0 0 0', color: c.textoSuave, fontSize: '14px' }}>
            {productos.length} productos activos
          </p>
        </div>
        <button
          onClick={() => {
            setProductoEditando(null);
            setMostrarFormulario(!mostrarFormulario);
          }}
          style={{
            padding: '14px 25px',
            backgroundColor: mostrarFormulario ? '#666' : '#27AE60',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          {mostrarFormulario ? '✕ Cerrar formulario' : '➕ Nuevo producto'}
        </button>
      </div>

      {mostrarFormulario && (
        <div style={{
          backgroundColor: c.card, padding: '25px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '30px', border: '2px solid #FF6B00'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#FF6B00' }}>
            {productoEditando ? `✏️ Editar: ${productoEditando.nombre}` : '➕ Nuevo producto'}
          </h2>
          <FormularioProducto
            producto={productoEditando}
            categorias={categorias}
            onProductoCreado={() => {
              cargarProductos();
              setMostrarFormulario(false);
              setProductoEditando(null);
            }}
            onCancelar={() => {
              setMostrarFormulario(false);
              setProductoEditando(null);
            }}
          />
        </div>
      )}

      <div style={{
        display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap',
        backgroundColor: c.card, padding: '20px', borderRadius: '16px',
        boxShadow: c.sombra, transition: 'all 0.3s ease'
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: 1, minWidth: '250px', padding: '12px 15px',
            fontSize: '14px', borderRadius: '10px',
            border: `2px solid ${c.inputBorder}`,
            outline: 'none', backgroundColor: c.inputBg, color: c.texto
          }}
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          style={{
            padding: '12px 15px', fontSize: '14px', borderRadius: '10px',
            border: `2px solid ${c.inputBorder}`, outline: 'none',
            cursor: 'pointer', fontWeight: 'bold',
            backgroundColor: c.inputBg, color: c.texto
          }}
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px', color: c.textoMuted }}>
          Cargando productos...
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div style={{
          backgroundColor: c.card, padding: '60px', borderRadius: '16px',
          textAlign: 'center', color: c.textoMuted
        }}>
          No se encontraron productos
        </div>
      ) : (
        <div style={{
          backgroundColor: c.card, borderRadius: '16px',
          boxShadow: c.sombra, overflow: 'hidden', transition: 'all 0.3s ease'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: esOscuro ? '#0F1621' : '#1A2332', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>PRODUCTO</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px' }}>CATEGORÍA</th>
                  <th style={{ padding: '15px', textAlign: 'right', fontSize: '13px' }}>PRECIO</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>STOCK</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((p) => {
                  const colorStock = getColorStock(p.stock_actual, p.stock_minimo);
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${c.borde}` }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '50px', height: '50px', borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: esOscuro ? '#0F1621' : '#f0f0f0',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '22px', flexShrink: 0
                          }}>
                            {p.imagen_principal ? (
                              <img
                                src={`${getApiUrl()}${p.imagen_principal}`}
                                alt={p.nombre}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : '📦'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: c.texto }}>{p.nombre}</div>
                            <div style={{ fontSize: '11px', color: c.textoMuted }}>{p.codigo_barras || 'Sin código'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px', fontSize: '14px', color: c.textoSuave }}>
                        {p.categoria_nombre}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#FF6B00', fontSize: '15px' }}>
                          ${parseFloat(p.precio_venta).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', color: c.textoMuted }}>
                          Costo: ${parseFloat(p.precio_compra).toFixed(2)}
                        </div>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-block', padding: '6px 14px',
                          backgroundColor: colorStock.bg, color: colorStock.color,
                          borderRadius: '20px', fontSize: '13px', fontWeight: 'bold'
                        }}>
                          {p.stock_actual} unid.
                        </div>
                        <div style={{ fontSize: '11px', color: c.textoMuted, marginTop: '4px' }}>
                          Mín: {p.stock_minimo}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button
                            onClick={() => abrirAjusteStock(p)}
                            style={{
                              padding: '8px 12px', backgroundColor: '#4A90E2',
                              color: 'white', border: 'none', borderRadius: '8px',
                              cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                            }}
                          >
                            📊 Stock
                          </button>
                          <button
                            onClick={() => abrirEditar(p)}
                            style={{
                              padding: '8px 12px', backgroundColor: '#FFB800',
                              color: 'white', border: 'none', borderRadius: '8px',
                              cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => eliminarProducto(p.id, p.nombre)}
                            style={{
                              padding: '8px 12px', backgroundColor: '#E74C3C',
                              color: 'white', border: 'none', borderRadius: '8px',
                              cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                            }}
                          >
                            🗑️
                          </button>
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

      {/* Modal de Ajuste de Stock */}
      {modalStock && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: c.card, padding: '30px', borderRadius: '16px',
            maxWidth: '450px', width: '90%'
          }}>
            <h2 style={{ marginTop: 0, color: c.texto }}>📊 Ajustar Stock</h2>
            <p style={{ color: c.textoSuave }}>
              <strong style={{ color: c.texto }}>{modalStock.nombre}</strong><br />
              Stock actual: <strong style={{ color: c.texto }}>{modalStock.stock_actual}</strong> unidades
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: c.texto }}>
                Cantidad a ajustar:
              </label>
              <input
                type="number"
                value={stockCantidad}
                onChange={(e) => setStockCantidad(parseInt(e.target.value) || 0)}
                style={{
                  width: '100%', padding: '12px', fontSize: '18px',
                  borderRadius: '10px', border: `2px solid ${c.inputBorder}`,
                  boxSizing: 'border-box', backgroundColor: c.inputBg, color: c.texto
                }}
                placeholder="Ej: 10 (sumar) o -5 (restar)"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: c.texto }}>
                Motivo:
              </label>
              <select
                value={stockMotivo}
                onChange={(e) => setStockMotivo(e.target.value)}
                style={{
                  width: '100%', padding: '12px', fontSize: '14px',
                  borderRadius: '10px', border: `2px solid ${c.inputBorder}`,
                  boxSizing: 'border-box', cursor: 'pointer',
                  backgroundColor: c.inputBg, color: c.texto
                }}
              >
                <option value="compra_proveedor">Compra a proveedor</option>
                <option value="devolucion">Devolución de cliente</option>
                <option value="rotura">Rotura o pérdida</option>
                <option value="ajuste_inventario">Ajuste manual</option>
              </select>
            </div>

            {stockCantidad !== 0 && (
              <div style={{
                padding: '12px', backgroundColor: c.cardSecundario,
                borderRadius: '10px', marginBottom: '20px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: c.textoSuave }}>Nuevo stock será:</div>
                <div style={{
                  fontSize: '28px', fontWeight: 'bold',
                  color: (modalStock.stock_actual + stockCantidad) < 0 ? '#E74C3C' : '#27AE60'
                }}>
                  {modalStock.stock_actual + stockCantidad} unidades
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setModalStock(null)}
                style={{
                  flex: 1, padding: '14px', backgroundColor: '#E74C3C',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAjusteStock}
                disabled={stockCantidad === 0}
                style={{
                  flex: 2, padding: '14px',
                  backgroundColor: stockCantidad === 0 ? '#666' : '#27AE60',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: stockCantidad === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ✅ Confirmar ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioScreen;
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';
import ClienteTPVScreen from './ClienteTPVScreen';
import MiPerfilScreen from './MiPerfilScreen';
import { getApiUrl } from '../core/utils/apiUrl';

const ClienteDashboardScreen = ({ cliente: clienteInicial, onLogout }) => {
  const [cliente, setCliente] = useState(clienteInicial);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState('catalogo'); // 'catalogo' | 'pedido' | 'perfil'

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

  useEffect(() => { cargarProductos(); }, []);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const response = await apiClient.get('/clientes/catalogo');
      setProductos(response.data);
      const cats = [...new Set(response.data.map(p => p.categoria_nombre))].filter(Boolean);
      setCategorias(cats);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleActualizarPerfil = (clienteActualizado) => {
    setCliente(clienteActualizado);
  };

  // Vista de pedido
  if (vista === 'pedido') {
    return <ClienteTPVScreen cliente={cliente} onVolver={() => setVista('catalogo')} />;
  }

  // Vista de perfil
  if (vista === 'perfil') {
    return (
      <MiPerfilScreen
        cliente={cliente}
        onVolver={() => setVista('catalogo')}
        onActualizar={handleActualizarPerfil}
      />
    );
  }

  const productosFiltrados = productos.filter(p => {
    if (filtroCategoria !== 'todas' && p.categoria_nombre !== filtroCategoria) return false;
    if (busqueda) return p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: c.fondo, fontFamily: 'system-ui, sans-serif', transition: 'background-color 0.3s ease' }}>
      
      {/* Barra superior */}
      <div style={{
        backgroundColor: '#1A2332', color: 'white', padding: '15px 30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexWrap: 'wrap', gap: '10px'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>🛍️ Mi Imperio</h2>
          <div style={{ fontSize: '13px', color: '#8B9BB0', marginTop: '3px' }}>
            Hola, {cliente.nombre}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={toggleTema} title={esOscuro ? 'Modo claro' : 'Modo oscuro'}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: '28px', padding: '5px', lineHeight: 1
            }}>
            {esOscuro ? '☀️' : '🌙'}
          </button>
          
          <button onClick={() => setVista('perfil')}
            style={{
              padding: '10px 20px', backgroundColor: '#4A90E2',
              color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
            👤 Mi Perfil
          </button>

          <button onClick={() => setVista('pedido')}
            style={{
              padding: '10px 20px', backgroundColor: '#27AE60',
              color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold'
            }}>
            🛒 Hacer Pedido
          </button>
          
          <button onClick={onLogout}
            style={{
              padding: '10px 20px', backgroundColor: '#E74C3C',
              color: 'white', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: 'bold'
            }}>
            🚪 Salir
          </button>
        </div>
      </div>

      <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Bienvenida */}
        <div style={{
          backgroundColor: c.card, padding: '25px', borderRadius: '16px',
          boxShadow: c.sombra, marginBottom: '25px',
          borderLeft: '5px solid #FF6B00'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              backgroundColor: '#4A90E2', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '24px', flexShrink: 0
            }}>
              {cliente.nombre.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, color: c.texto, fontSize: '22px' }}>
                👋 ¡Bienvenido, {cliente.nombre}!
              </h1>
              <p style={{ color: c.textoSuave, marginTop: '5px', marginBottom: 0, fontSize: '14px' }}>
                Usuario: <strong>@{cliente.username || 'sin usuario'}</strong>
              </p>
            </div>
            <button
              onClick={() => setVista('perfil')}
              style={{
                padding: '10px 20px', backgroundColor: 'transparent',
                color: '#4A90E2', border: '2px solid #4A90E2',
                borderRadius: '10px', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '14px'
              }}
            >
              ✏️ Editar perfil
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap',
          backgroundColor: c.card, padding: '20px', borderRadius: '16px',
          boxShadow: c.sombra
        }}>
          <input
            type="text" placeholder="🔍 Buscar producto..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            style={{
              flex: 1, minWidth: '250px', padding: '12px 15px',
              fontSize: '14px', borderRadius: '10px',
              border: `2px solid ${c.inputBorder}`, outline: 'none',
              boxSizing: 'border-box', backgroundColor: c.inputBg, color: c.texto
            }}
          />
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
            style={{
              padding: '12px 15px', fontSize: '14px', borderRadius: '10px',
              border: `2px solid ${c.inputBorder}`, cursor: 'pointer',
              fontWeight: 'bold', color: c.texto, backgroundColor: c.inputBg
            }}>
            <option value="todas">Todas las categorías</option>
            {categorias.map((cat, i) => (<option key={i} value={cat}>{cat}</option>))}
          </select>
        </div>

        {/* Productos */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '60px', color: c.textoMuted }}>Cargando catálogo...</div>
        ) : productosFiltrados.length === 0 ? (
          <div style={{ backgroundColor: c.card, padding: '60px', borderRadius: '16px', textAlign: 'center', color: c.textoMuted }}>
            No se encontraron productos
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
            {productosFiltrados.map((p) => (
              <div key={p.id} style={{
                backgroundColor: c.card, borderRadius: '16px', overflow: 'hidden',
                boxShadow: c.sombra, transition: 'all 0.2s',
                border: esOscuro ? `1px solid ${c.borde}` : 'none'
              }}>
                <div style={{
                  width: '100%', height: '180px',
                  backgroundColor: esOscuro ? '#0F1621' : '#f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '60px', overflow: 'hidden'
                }}>
                  {p.imagen_principal ? (
                    <img src={`${getApiUrl()}${p.imagen_principal}`} alt={p.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '📦'; }} />
                  ) : '📦'}
                </div>
                <div style={{ padding: '15px' }}>
                  <div style={{ fontSize: '11px', color: c.textoSuave, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
                    {p.categoria_nombre || 'Producto'}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: c.texto, marginBottom: '10px', minHeight: '40px' }}>
                    {p.nombre}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#FF6B00' }}>
                      ${parseFloat(p.precio_venta).toFixed(2)}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: p.stock_actual > 5 ? '#27AE60' : '#FFB800',
                      fontWeight: 'bold',
                      backgroundColor: p.stock_actual > 5
                        ? (esOscuro ? 'rgba(39,174,96,0.2)' : '#E8F8F0')
                        : (esOscuro ? 'rgba(255,184,0,0.2)' : '#FFF9E6'),
                      padding: '4px 10px', borderRadius: '10px'
                    }}>
                      {p.stock_actual > 5 ? '✓ Disponible' : `Solo ${p.stock_actual}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClienteDashboardScreen;
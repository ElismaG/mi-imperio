// CategoriasScreen.jsx - Gestión de categorías y atributos con modo oscuro
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useThemeStore } from '../core/stores/themeStore';

const CategoriasScreen = () => {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [atributos, setAtributos] = useState([]);
  const [mostrarFormAtributo, setMostrarFormAtributo] = useState(false);
  const [atributoEditando, setAtributoEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Datos para el formulario de categoría
  const [formCategoria, setFormCategoria] = useState({
    nombre: '', descripcion: '', icono: 'fa-box', color_hex: '#9B59B6'
  });

  // Datos para el formulario de atributo
  const [formAtributo, setFormAtributo] = useState({
    nombre_atributo: '',
    tipo_dato: 'texto',
    es_obligatorio: false,
    usa_stock: false,
    opciones_lista: '',
    orden_visual: 0,
    visible_en_tpv: true
  });

  const { tema } = useThemeStore();
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

  // Lista de íconos disponibles (FontAwesome)
  const iconosDisponibles = [
    { value: 'fa-tshirt', label: '👕 Ropa' },
    { value: 'fa-utensils', label: '🍴 Comida' },
    { value: 'fa-washing-machine', label: '🔌 Electrodoméstico' },
    { value: 'fa-car', label: '🚗 Vehículo' },
    { value: 'fa-puzzle-piece', label: '🧸 Juguete' },
    { value: 'fa-hard-hat', label: '🏗️ Construcción' },
    { value: 'fa-couch', label: '🛋️ Mueble' },
    { value: 'fa-book', label: '📚 Libro' },
    { value: 'fa-futbol', label: '⚽ Deporte' },
    { value: 'fa-tshirt', label: '👗 Moda' },
    { value: 'fa-mobile-alt', label: '📱 Tecnología' },
    { value: 'fa-spa', label: '💆 Belleza' },
    { value: 'fa-paw', label: '🐾 Mascotas' },
    { value: 'fa-box', label: '📦 Otro' }
  ];

  const coloresDisponibles = [
    '#4A90E2', '#4CAF50', '#E67E22', '#E74C3C', '#9B59B6',
    '#F1C40F', '#1ABC9C', '#34495E', '#FF6B00', '#27AE60'
  ];

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setCargando(true);
      const response = await apiClient.get('/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarAtributos = async (categoriaId) => {
    try {
      const response = await apiClient.get(`/categorias/${categoriaId}/atributos`);
      setAtributos(response.data);
    } catch (error) {
      console.error('Error al cargar atributos:', error);
    }
  };

  // ═══════════ CATEGORÍAS ═══════════

  const abrirFormCategoria = (cat = null) => {
    if (cat) {
      setCategoriaEditando(cat);
      setFormCategoria({
        nombre: cat.nombre,
        descripcion: cat.descripcion || '',
        icono: cat.icono || 'fa-box',
        color_hex: cat.color_hex || '#9B59B6'
      });
    } else {
      setCategoriaEditando(null);
      setFormCategoria({
        nombre: '', descripcion: '', icono: 'fa-box', color_hex: '#9B59B6'
      });
    }
    setMostrarFormCategoria(true);
    setError('');
    setMensaje('');
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (categoriaEditando) {
        await apiClient.put(`/categorias/${categoriaEditando.id}`, formCategoria);
        setMensaje('✅ Categoría actualizada');
      } else {
        await apiClient.post('/categorias', formCategoria);
        setMensaje('✅ Categoría creada');
      }
      cargarCategorias();
      setTimeout(() => {
        setMostrarFormCategoria(false);
        setCategoriaEditando(null);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const eliminarCategoria = async (cat) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      await apiClient.delete(`/categorias/${cat.id}`);
      setMensaje('✅ Categoría eliminada');
      cargarCategorias();
      if (categoriaSeleccionada?.id === cat.id) {
        setCategoriaSeleccionada(null);
      }
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  // ═══════════ ATRIBUTOS ═══════════

  const seleccionarCategoria = (cat) => {
    setCategoriaSeleccionada(cat);
    cargarAtributos(cat.id);
  };

  const abrirFormAtributo = (attr = null) => {
    if (attr) {
      setAtributoEditando(attr);
      setFormAtributo({
        nombre_atributo: attr.nombre_atributo,
        tipo_dato: attr.tipo_dato,
        es_obligatorio: attr.es_obligatorio,
        usa_stock: attr.usa_stock,
        opciones_lista: attr.opciones_lista ? attr.opciones_lista.join(', ') : '',
        orden_visual: attr.orden_visual || 0,
        visible_en_tpv: attr.visible_en_tpv !== false
      });
    } else {
      setAtributoEditando(null);
      setFormAtributo({
        nombre_atributo: '',
        tipo_dato: 'texto',
        es_obligatorio: false,
        usa_stock: false,
        opciones_lista: '',
        orden_visual: atributos.length,
        visible_en_tpv: true
      });
    }
    setMostrarFormAtributo(true);
    setError('');
    setMensaje('');
  };

  const guardarAtributo = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (atributoEditando) {
        await apiClient.put(`/categorias/atributos/${atributoEditando.id}`, formAtributo);
        setMensaje('✅ Atributo actualizado');
      } else {
        await apiClient.post(`/categorias/${categoriaSeleccionada.id}/atributos`, formAtributo);
        setMensaje('✅ Atributo creado');
      }
      cargarAtributos(categoriaSeleccionada.id);
      cargarCategorias();
      setTimeout(() => {
        setMostrarFormAtributo(false);
        setAtributoEditando(null);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const eliminarAtributo = async (attr) => {
    if (!window.confirm(`¿Eliminar el atributo "${attr.nombre_atributo}"?`)) return;
    try {
      await apiClient.delete(`/categorias/atributos/${attr.id}`);
      setMensaje('✅ Atributo eliminado');
      cargarAtributos(categoriaSeleccionada.id);
      cargarCategorias();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
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

  const getTipoIcono = (tipo) => {
    switch (tipo) {
      case 'texto': return '📝';
      case 'numero': return '🔢';
      case 'fecha': return '📅';
      case 'lista': return '📋';
      case 'booleano': return '☑️';
      default: return '📝';
    }
  };

  return (
    <div style={{
      padding: '30px', maxWidth: '1400px', margin: '0 auto',
      fontFamily: 'system-ui, sans-serif', backgroundColor: c.fondo,
      minHeight: 'calc(100vh - 60px)', transition: 'background-color 0.3s ease'
    }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px'
      }}>
        <div>
          <h1 style={{ margin: 0, color: c.texto }}>📁 Categorías y Atributos</h1>
          <p style={{ margin: '5px 0 0 0', color: c.textoSuave, fontSize: '14px' }}>
            {categorias.length} categorías registradas
          </p>
        </div>
        <button
          onClick={() => abrirFormCategoria()}
          style={{
            padding: '14px 25px', backgroundColor: '#27AE60',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(39,174,96,0.3)'
          }}
        >
          ➕ Nueva categoría
        </button>
      </div>

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

      {/* Modal Nueva/Editar Categoría */}
      {mostrarFormCategoria && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: c.card, padding: '30px', borderRadius: '16px',
            maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            border: '2px solid #FF6B00'
          }}>
            <h2 style={{ marginTop: 0, color: '#FF6B00' }}>
              {categoriaEditando ? `✏️ Editar: ${categoriaEditando.nombre}` : '➕ Nueva Categoría'}
            </h2>

            <form onSubmit={guardarCategoria}>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Nombre *</label>
                <input
                  type="text" value={formCategoria.nombre}
                  onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })}
                  required placeholder="Ej: Muebles, Libros, Deportes..."
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  value={formCategoria.descripcion}
                  onChange={(e) => setFormCategoria({ ...formCategoria, descripcion: e.target.value })}
                  rows="2" placeholder="Breve descripción de la categoría"
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Ícono</label>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '8px'
                }}>
                  {iconosDisponibles.map(ic => (
                    <button
                      key={ic.value}
                      type="button"
                      onClick={() => setFormCategoria({ ...formCategoria, icono: ic.value })}
                      style={{
                        padding: '10px',
                        border: formCategoria.icono === ic.value ? '3px solid #FF6B00' : `2px solid ${c.borde}`,
                        borderRadius: '10px',
                        backgroundColor: formCategoria.icono === ic.value
                          ? (esOscuro ? 'rgba(255,107,0,0.15)' : '#FFF7ED')
                          : c.cardSecundario,
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: c.texto,
                        fontWeight: 'bold'
                      }}
                    >
                      {ic.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {coloresDisponibles.map(col => (
                    <div
                      key={col}
                      onClick={() => setFormCategoria({ ...formCategoria, color_hex: col })}
                      style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        backgroundColor: col, cursor: 'pointer',
                        border: formCategoria.color_hex === col ? '4px solid white' : '3px solid transparent',
                        boxShadow: formCategoria.color_hex === col
                          ? `0 0 0 3px ${col}, 0 0 0 5px white`
                          : `0 0 0 1px ${c.borde}`,
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setMostrarFormCategoria(false); setCategoriaEditando(null); }}
                  style={{
                    flex: 1, padding: '14px', backgroundColor: '#E74C3C',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontWeight: 'bold', cursor: 'pointer'
                  }}
                >✕ Cancelar</button>
                <button
                  type="submit"
                  style={{
                    flex: 2, padding: '14px', backgroundColor: '#27AE60',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {categoriaEditando ? '💾 Actualizar' : '✅ Crear categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo/Editar Atributo */}
      {mostrarFormAtributo && categoriaSeleccionada && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px'
        }}>
          <div style={{
            backgroundColor: c.card, padding: '30px', borderRadius: '16px',
            maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            border: '2px solid #4A90E2'
          }}>
            <h2 style={{ marginTop: 0, color: '#4A90E2' }}>
              {atributoEditando
                ? `✏️ Editar atributo: ${atributoEditando.nombre_atributo}`
                : `➕ Nuevo atributo para "${categoriaSeleccionada.nombre}"`}
            </h2>

            <form onSubmit={guardarAtributo}>
              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Nombre del atributo *</label>
                <input
                  type="text" value={formAtributo.nombre_atributo}
                  onChange={(e) => setFormAtributo({ ...formAtributo, nombre_atributo: e.target.value })}
                  required
                  placeholder="Ej: Talla, Color, Fecha de caducidad, Material..."
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={labelStyle}>Tipo de dato *</label>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '8px'
                }}>
                  {[
                    { v: 'texto', l: '📝 Texto' },
                    { v: 'numero', l: '🔢 Número' },
                    { v: 'fecha', l: '📅 Fecha' },
                    { v: 'lista', l: '📋 Lista' },
                    { v: 'booleano', l: '☑️ Sí/No' }
                  ].map(tipo => (
                    <button
                      key={tipo.v}
                      type="button"
                      onClick={() => setFormAtributo({ ...formAtributo, tipo_dato: tipo.v })}
                      style={{
                        padding: '12px 8px',
                        border: formAtributo.tipo_dato === tipo.v
                          ? '3px solid #4A90E2'
                          : `2px solid ${c.borde}`,
                        borderRadius: '10px',
                        backgroundColor: formAtributo.tipo_dato === tipo.v
                          ? (esOscuro ? 'rgba(74,144,226,0.2)' : '#EAF3FC')
                          : c.cardSecundario,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        color: c.texto
                      }}
                    >
                      {tipo.l}
                    </button>
                  ))}
                </div>
              </div>

              {formAtributo.tipo_dato === 'lista' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Opciones (separadas por coma) *</label>
                  <input
                    type="text"
                    value={formAtributo.opciones_lista}
                    onChange={(e) => setFormAtributo({ ...formAtributo, opciones_lista: e.target.value })}
                    placeholder="Ej: S, M, L, XL"
                    style={inputStyle}
                  />
                  <p style={{ fontSize: '12px', color: c.textoMuted, marginTop: '5px' }}>
                    💡 Separa cada opción con una coma. Ej: <strong>Rojo, Azul, Verde</strong>
                  </p>
                </div>
              )}

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                marginBottom: '20px'
              }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px', backgroundColor: c.cardSecundario,
                  borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${c.borde}`, color: c.texto, fontSize: '14px', fontWeight: 'bold'
                }}>
                  <input
                    type="checkbox"
                    checked={formAtributo.es_obligatorio}
                    onChange={(e) => setFormAtributo({ ...formAtributo, es_obligatorio: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Obligatorio
                </label>

                <label style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px', backgroundColor: c.cardSecundario,
                  borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${c.borde}`, color: c.texto, fontSize: '14px', fontWeight: 'bold'
                }}>
                  <input
                    type="checkbox"
                    checked={formAtributo.usa_stock}
                    onChange={(e) => setFormAtributo({ ...formAtributo, usa_stock: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Controlar stock por variante
                </label>

                <label style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px', backgroundColor: c.cardSecundario,
                  borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${c.borde}`, color: c.texto, fontSize: '14px', fontWeight: 'bold'
                }}>
                  <input
                    type="checkbox"
                    checked={formAtributo.visible_en_tpv}
                    onChange={(e) => setFormAtributo({ ...formAtributo, visible_en_tpv: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  Visible en TPV
                </label>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px', backgroundColor: c.cardSecundario,
                  borderRadius: '10px', border: `2px solid ${c.borde}`
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: c.texto }}>Orden:</span>
                  <input
                    type="number"
                    value={formAtributo.orden_visual}
                    onChange={(e) => setFormAtributo({ ...formAtributo, orden_visual: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '60px', padding: '6px', borderRadius: '6px',
                      border: `1px solid ${c.inputBorder}`,
                      backgroundColor: c.inputBg, color: c.texto, textAlign: 'center'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setMostrarFormAtributo(false); setAtributoEditando(null); }}
                  style={{
                    flex: 1, padding: '14px', backgroundColor: '#E74C3C',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontWeight: 'bold', cursor: 'pointer'
                  }}
                >✕ Cancelar</button>
                <button
                  type="submit"
                  style={{
                    flex: 2, padding: '14px', backgroundColor: '#4A90E2',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {atributoEditando ? '💾 Actualizar' : '✅ Crear atributo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de categorías */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '60px', color: c.textoMuted }}>
          Cargando categorías...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: categoriaSeleccionada ? '1fr 1.3fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>

          {/* Columna de categorías */}
          <div>
            <h2 style={{ color: c.texto, fontSize: '16px', marginBottom: '15px' }}>
              📁 Categorías ({categorias.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categorias.map(cat => {
                const activa = categoriaSeleccionada?.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => seleccionarCategoria(cat)}
                    style={{
                      backgroundColor: c.card,
                      padding: '18px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      boxShadow: c.sombra,
                      borderLeft: `5px solid ${cat.color_hex || '#9B59B6'}`,
                      border: activa
                        ? `2px solid ${cat.color_hex}`
                        : `1px solid ${c.borde}`,
                      transition: 'all 0.2s',
                      transform: activa ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 'bold', fontSize: '17px',
                          color: c.texto, marginBottom: '5px'
                        }}>
                          {cat.nombre}
                        </div>
                        {cat.descripcion && (
                          <div style={{ fontSize: '12px', color: c.textoSuave, marginBottom: '8px' }}>
                            {cat.descripcion}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '11px', padding: '3px 8px',
                            backgroundColor: esOscuro ? 'rgba(74,144,226,0.2)' : '#EAF3FC',
                            color: '#4A90E2', borderRadius: '10px', fontWeight: 'bold'
                          }}>
                            📦 {cat.total_productos} productos
                          </span>
                          <span style={{
                            fontSize: '11px', padding: '3px 8px',
                            backgroundColor: esOscuro ? 'rgba(155,89,182,0.2)' : '#F4ECF7',
                            color: '#9B59B6', borderRadius: '10px', fontWeight: 'bold'
                          }}>
                            ⚙️ {cat.total_atributos} atributos
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); abrirFormCategoria(cat); }}
                          title="Editar"
                          style={{
                            padding: '6px 8px', backgroundColor: '#FFB800',
                            color: 'white', border: 'none', borderRadius: '6px',
                            cursor: 'pointer', fontSize: '12px'
                          }}
                        >✏️</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); eliminarCategoria(cat); }}
                          title="Eliminar"
                          style={{
                            padding: '6px 8px', backgroundColor: '#E74C3C',
                            color: 'white', border: 'none', borderRadius: '6px',
                            cursor: 'pointer', fontSize: '12px'
                          }}
                        >🗑️</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna de atributos */}
          {categoriaSeleccionada && (
            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '15px'
              }}>
                <h2 style={{ color: c.texto, fontSize: '16px', margin: 0 }}>
                  ⚙️ Atributos de "{categoriaSeleccionada.nombre}"
                </h2>
                <button
                  onClick={() => setCategoriaSeleccionada(null)}
                  style={{
                    padding: '6px 12px', backgroundColor: 'transparent',
                    color: c.textoSuave, border: `1px solid ${c.borde}`,
                    borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                  }}
                >✕ Cerrar</button>
              </div>

              <button
                onClick={() => abrirFormAtributo()}
                style={{
                  width: '100%', padding: '14px', backgroundColor: '#4A90E2',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                ➕ Añadir atributo a esta categoría
              </button>

              {atributos.length === 0 ? (
                <div style={{
                  backgroundColor: c.card, padding: '40px',
                  borderRadius: '14px', textAlign: 'center', color: c.textoMuted,
                  border: `2px dashed ${c.borde}`
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
                  <p>Esta categoría no tiene atributos definidos</p>
                  <p style={{ fontSize: '13px' }}>
                    Añade atributos como Talla, Color, Fecha de caducidad, etc.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {atributos.map(attr => (
                    <div key={attr.id} style={{
                      backgroundColor: c.card, padding: '15px',
                      borderRadius: '12px', boxShadow: c.sombra,
                      borderLeft: '4px solid #4A90E2'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 'bold', fontSize: '15px',
                            color: c.texto, marginBottom: '5px',
                            display: 'flex', alignItems: 'center', gap: '6px'
                          }}>
                            {getTipoIcono(attr.tipo_dato)} {attr.nombre_atributo}
                          </div>
                          <div style={{ fontSize: '12px', color: c.textoSuave, marginBottom: '8px' }}>
                            Tipo: <strong>{attr.tipo_dato}</strong>
                          </div>

                          {attr.opciones_lista && attr.opciones_lista.length > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ fontSize: '11px', color: c.textoMuted, marginBottom: '4px' }}>
                                OPCIONES:
                              </div>
                              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {attr.opciones_lista.map((op, i) => (
                                  <span key={i} style={{
                                    padding: '3px 10px',
                                    backgroundColor: esOscuro ? 'rgba(155,89,182,0.2)' : '#F4ECF7',
                                    color: '#9B59B6', borderRadius: '10px',
                                    fontSize: '11px', fontWeight: 'bold'
                                  }}>{op}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {attr.es_obligatorio && (
                              <span style={{
                                fontSize: '10px', padding: '2px 8px',
                                backgroundColor: esOscuro ? 'rgba(231,76,60,0.2)' : '#f8d7da',
                                color: '#E74C3C', borderRadius: '10px', fontWeight: 'bold'
                              }}>Obligatorio</span>
                            )}
                            {attr.usa_stock && (
                              <span style={{
                                fontSize: '10px', padding: '2px 8px',
                                backgroundColor: esOscuro ? 'rgba(255,184,0,0.2)' : '#fff3cd',
                                color: '#856404', borderRadius: '10px', fontWeight: 'bold'
                              }}>📊 Stock por variante</span>
                            )}
                            {attr.visible_en_tpv && (
                              <span style={{
                                fontSize: '10px', padding: '2px 8px',
                                backgroundColor: esOscuro ? 'rgba(39,174,96,0.2)' : '#d4edda',
                                color: '#27AE60', borderRadius: '10px', fontWeight: 'bold'
                              }}>👁️ Visible en TPV</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                          <button
                            onClick={() => abrirFormAtributo(attr)}
                            style={{
                              padding: '6px 8px', backgroundColor: '#FFB800',
                              color: 'white', border: 'none', borderRadius: '6px',
                              cursor: 'pointer', fontSize: '12px'
                            }}
                          >✏️</button>
                          <button
                            onClick={() => eliminarAtributo(attr)}
                            style={{
                              padding: '6px 8px', backgroundColor: '#E74C3C',
                              color: 'white', border: 'none', borderRadius: '6px',
                              cursor: 'pointer', fontSize: '12px'
                            }}
                          >🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoriasScreen;
// Sidebar.jsx - Menú lateral moderno
import { useThemeStore } from '../../core/stores/themeStore';

const Sidebar = ({ 
  pantalla, 
  setPantalla, 
  usuario, 
  colapsado, 
  setColapsado,
  menuAbierto,
  setMenuAbierto,
  onLogout 
}) => {
  const { tema } = useThemeStore();
  const esOscuro = tema === 'oscuro';

  const rol = (usuario.rol || '').toLowerCase().trim();
  const esDueño = rol === 'dueño' || rol === 'dueno' || rol === 'admin' || rol === 'administrador';
  const esCajero = rol === 'cajero' || rol === 'vendedor' || esDueño;
  const esAlmacenista = rol.includes('almacen') || rol.includes('despach') || esDueño;

  const c = esOscuro ? {
    fondo: '#0F1621',
    fondoActivo: '#FF6B00',
    fondoHover: '#1A2332',
    borde: '#2A3547',
    texto: '#FFFFFF',
    textoSuave: '#8B9BB0',
    titulo: '#5A6B7F',
  } : {
    fondo: '#1A2332',
    fondoActivo: '#FF6B00',
    fondoHover: '#2A3547',
    borde: '#2A3547',
    texto: '#FFFFFF',
    textoSuave: '#8B9BB0',
    titulo: '#5A6B7F',
  };

  // ═══════════ ESTRUCTURA DEL MENÚ ═══════════
  const secciones = [
    {
      titulo: null,
      visible: true,
      items: [
        { id: 'dashboard', nombre: 'Inicio', icono: '🏠', roles: ['todos'] }
      ]
    },
    {
      titulo: 'VENTAS',
      visible: esCajero || esAlmacenista,
      items: [
        { id: 'tpv', nombre: 'TPV', icono: '🛒', roles: ['cajero'] },
        { id: 'pedidos', nombre: 'Pedidos', icono: '📋', roles: ['cajero'] },
        { id: 'entregas', nombre: 'Entregas', icono: '🚚', roles: ['almacenista'] }
      ]
    },
    {
      titulo: 'CATÁLOGO',
      visible: esDueño || esCajero,
      items: [
        { id: 'inventario', nombre: 'Inventario', icono: '📦', roles: ['dueño'] },
        { id: 'categorias', nombre: 'Categorías', icono: '📁', roles: ['dueño'] },
        { id: 'clientes', nombre: 'Clientes', icono: '👥', roles: ['cajero'] }
      ]
    },
    {
      titulo: 'ADMINISTRACIÓN',
      visible: esDueño,
      items: [
        { id: 'historial', nombre: 'Historial', icono: '📜', roles: ['dueño'] },
        { id: 'gastos', nombre: 'Gastos', icono: '💸', roles: ['dueño'] },
        { id: 'reportes', nombre: 'Reportes', icono: '📊', roles: ['dueño'] },
        { id: 'empleados', nombre: 'Empleados', icono: '👔', roles: ['dueño'] },
        { id: 'alertas', nombre: 'Alertas', icono: '⚠️', roles: ['dueño'] }
      ]
    },
    {
      titulo: 'SISTEMA',
      visible: esDueño,
      items: [
        { id: 'configuracion', nombre: 'Configuración', icono: '⚙️', roles: ['dueño'] }
      ]
    }
  ];

  // Verificar si un item debe mostrarse según el rol
  const puedeVer = (item) => {
    if (item.roles.includes('todos')) return true;
    if (esDueño) return true; // El dueño ve todo
    if (item.roles.includes('cajero') && esCajero) return true;
    if (item.roles.includes('almacenista') && esAlmacenista) return true;
    return false;
  };

  const handleClick = (id) => {
    setPantalla(id);
    // Cerrar el menú en móvil al hacer clic
    if (window.innerWidth < 768) {
      setMenuAbierto(false);
    }
  };

  const ancho = colapsado ? '70px' : '240px';

  return (
    <>
      {/* Overlay para móvil */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 998,
            display: window.innerWidth < 768 ? 'block' : 'none'
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: ancho,
        height: '100vh',
        backgroundColor: c.fondo,
        borderRight: `1px solid ${c.borde}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 999,
        transform: window.innerWidth < 768 
          ? (menuAbierto ? 'translateX(0)' : 'translateX(-100%)')
          : 'translateX(0)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
      }}>

        {/* Logo + Botón colapsar */}
        <div style={{
          padding: colapsado ? '15px 10px' : '15px 20px',
          borderBottom: `1px solid ${c.borde}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: colapsado ? 'center' : 'space-between',
          minHeight: '70px',
          gap: '10px'
        }}>
          {!colapsado && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}>
              <span style={{ fontSize: '24px' }}>🚀</span>
              <span>Mi Imperio</span>
            </div>
          )}

          {colapsado && (
            <span style={{ fontSize: '28px' }}>🚀</span>
          )}

          {/* Botón colapsar (solo en escritorio) */}
          {window.innerWidth >= 768 && (
            <button
              onClick={() => setColapsado(!colapsado)}
              title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
              style={{
                background: 'transparent',
                border: 'none',
                color: c.textoSuave,
                cursor: 'pointer',
                fontSize: '18px',
                padding: '5px',
                borderRadius: '6px',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = c.fondoHover;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = c.textoSuave;
              }}
            >
              {colapsado ? '»' : '«'}
            </button>
          )}

          {/* Botón cerrar (solo en móvil) */}
          {window.innerWidth < 768 && (
            <button
              onClick={() => setMenuAbierto(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: c.textoSuave,
                cursor: 'pointer',
                fontSize: '24px',
                padding: '5px',
                position: 'absolute',
                right: '10px',
                top: '20px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Menú de secciones */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 0',
          overflowX: 'hidden'
        }}>
          {secciones.map((seccion, idx) => {
            if (!seccion.visible) return null;

            const itemsVisibles = seccion.items.filter(puedeVer);
            if (itemsVisibles.length === 0) return null;

            return (
              <div key={idx} style={{ marginBottom: '10px' }}>
                {/* Título de la sección */}
                {seccion.titulo && !colapsado && (
                  <div style={{
                    padding: '10px 20px 5px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: c.titulo,
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    {seccion.titulo}
                  </div>
                )}

                {/* Separador si está colapsado */}
                {seccion.titulo && colapsado && (
                  <div style={{
                    height: '1px',
                    backgroundColor: c.borde,
                    margin: '8px 15px'
                  }} />
                )}

                {/* Items */}
                {itemsVisibles.map(item => {
                  const activo = pantalla === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleClick(item.id)}
                      title={colapsado ? item.nombre : ''}
                      style={{
                        width: '100%',
                        padding: colapsado ? '12px 0' : '12px 20px',
                        background: activo ? c.fondoActivo : 'transparent',
                        border: 'none',
                        color: activo ? 'white' : c.texto,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: colapsado ? 'center' : 'flex-start',
                        gap: '12px',
                        fontSize: '14px',
                        fontWeight: activo ? 'bold' : '500',
                        transition: 'all 0.2s',
                        borderLeft: activo ? '4px solid #FF6B00' : '4px solid transparent',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!activo) {
                          e.currentTarget.style.backgroundColor = c.fondoHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!activo) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span style={{
                        fontSize: '18px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px'
                      }}>
                        {item.icono}
                      </span>
                      {!colapsado && (
                        <span style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.nombre}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer: Usuario + Salir */}
        <div style={{
          padding: '15px',
          borderTop: `1px solid ${c.borde}`,
          backgroundColor: esOscuro ? '#0A0F16' : '#141B26'
        }}>
          {!colapsado ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px',
                padding: '8px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#FF6B00',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  {usuario.nombre_completo?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {usuario.nombre_completo}
                  </div>
                  <div style={{
                    color: c.textoSuave,
                    fontSize: '11px',
                    textTransform: 'capitalize'
                  }}>
                    {usuario.rol}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(231,76,60,0.15)',
                  color: '#FF6B6B',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E74C3C';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(231,76,60,0.15)';
                  e.currentTarget.style.color = '#FF6B6B';
                }}
              >
                🚪 Cerrar sesión
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FF6B00',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {usuario.nombre_completo?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'rgba(231,76,60,0.15)',
                  color: '#FF6B6B',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                🚪
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
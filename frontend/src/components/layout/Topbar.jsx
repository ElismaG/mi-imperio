// Topbar.jsx - Barra superior fina
import { useThemeStore } from '../../core/stores/themeStore';

const Topbar = ({ setMenuAbierto }) => {
  const { tema, toggleTema } = useThemeStore();
  const esOscuro = tema === 'oscuro';

  const c = esOscuro ? {
    fondo: '#1A2332',
    texto: '#FFFFFF',
    textoSuave: '#8B9BB0',
    borde: '#2A3547'
  } : {
    fondo: '#FFFFFF',
    texto: '#1A2332',
    textoSuave: '#666666',
    borde: '#E0E0E0'
  };

  return (
    <div style={{
      height: '60px',
      backgroundColor: c.fondo,
      borderBottom: `1px solid ${c.borde}`,
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.3s ease',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Botón menú (solo móvil) */}
      <button
        onClick={() => setMenuAbierto(true)}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: c.texto,
          padding: '5px 10px',
          display: window.innerWidth < 768 ? 'block' : 'none'
        }}
      >
        ☰
      </button>

      <div style={{ flex: 1 }} />

      {/* Botón tema */}
      <button
        onClick={toggleTema}
        title={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          padding: '5px 10px',
          lineHeight: 1,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.15) rotate(15deg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0)';
        }}
      >
        {esOscuro ? '☀️' : '🌙'}
      </button>
    </div>
  );
};

export default Topbar;
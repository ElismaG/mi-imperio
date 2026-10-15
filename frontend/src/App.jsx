import { useState, useEffect } from 'react';
import apiClient from './services/apiClient';
import { useThemeStore } from './core/stores/themeStore';
import LoginScreen from './screens/LoginScreen';
import RegistroClienteScreen from './screens/RegistroClienteScreen';
import RecuperarPasswordScreen from './screens/RecuperarPasswordScreen';
import ClienteDashboardScreen from './screens/ClienteDashboardScreen';
import DashboardScreen from './screens/DashboardScreen';
import VentaScreen from './screens/VentaScreen';
import EntregasScreen from './screens/EntregasScreen';
import AlertasScreen from './screens/AlertasScreen';
import InventarioScreen from './screens/InventarioScreen';
import ReportesScreen from './screens/ReportesScreen';
import ClientesScreen from './screens/ClientesScreen';
import PedidosPendientesScreen from './screens/PedidosPendientesScreen';
import ConfiguracionScreen from './screens/ConfiguracionScreen';
import EmpleadosScreen from './screens/EmpleadosScreen';
import CategoriasScreen from './screens/CategoriasScreen';
import HistorialScreen from './screens/HistorialScreen';
import GastosScreen from './screens/GastosScreen';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pantalla, setPantalla] = useState('dashboard');
  const [vistaAuth, setVistaAuth] = useState('login');
  const [colapsado, setColapsado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const { tema } = useThemeStore();
  const esOscuro = tema === 'oscuro';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');
    const clienteGuardado = localStorage.getItem('cliente');

    if (token && usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    } else if (token && clienteGuardado) {
      setCliente(JSON.parse(clienteGuardado));
    }
    setCargando(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('cliente');
    setUsuario(null);
    setCliente(null);
    setPantalla('dashboard');
    setVistaAuth('login');
  };

  useEffect(() => {
    if (usuario) setPantalla('dashboard');
  }, [usuario]);

  if (cargando) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando...</div>;

  // Cliente logueado → catálogo
  if (cliente && !usuario) {
    return <ClienteDashboardScreen cliente={cliente} onLogout={handleLogout} />;
  }

  // Sin sesión
  if (!usuario) {
    if (vistaAuth === 'registro') {
      return <RegistroClienteScreen onVolverAlLogin={() => setVistaAuth('login')} />;
    }
    if (vistaAuth === 'recuperar') {
      return <RecuperarPasswordScreen onVolverAlLogin={() => setVistaAuth('login')} />;
    }
    return (
      <LoginScreen
        onLoginExitoso={setUsuario}
        onLoginCliente={setCliente}
        onIrARegistro={() => setVistaAuth('registro')}
        onIrARecuperar={() => setVistaAuth('recuperar')}
      />
    );
  }

  // Colores de fondo
  const fondo = esOscuro ? '#0F1621' : '#F0F2F5';

  // Ancho del sidebar (colapsado o expandido)
  const anchoSidebar = window.innerWidth < 768 ? '0px' : (colapsado ? '70px' : '240px');

  return (
    <div style={{ backgroundColor: fondo, minHeight: '100vh', transition: 'background-color 0.3s ease' }}>
      
      {/* Sidebar */}
      <Sidebar
        pantalla={pantalla}
        setPantalla={setPantalla}
        usuario={usuario}
        colapsado={colapsado}
        setColapsado={setColapsado}
        menuAbierto={menuAbierto}
        setMenuAbierto={setMenuAbierto}
        onLogout={handleLogout}
      />

      {/* Contenido principal */}
      <div style={{
        marginLeft: anchoSidebar,
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh'
      }}>
        {/* Topbar */}
        <Topbar setMenuAbierto={setMenuAbierto} />

        {/* Contenido de la pantalla */}
        <div>
          {pantalla === 'dashboard' && <DashboardScreen usuario={usuario} onNavegar={setPantalla} />}
          {pantalla === 'tpv' && <VentaScreen usuario={usuario} />}
          {pantalla === 'pedidos' && <PedidosPendientesScreen usuario={usuario} />}
          {pantalla === 'entregas' && <EntregasScreen />}
          {pantalla === 'alertas' && <AlertasScreen />}
          {pantalla === 'inventario' && <InventarioScreen usuario={usuario} />}
          {pantalla === 'historial' && <HistorialScreen />}
          {pantalla === 'gastos' && <GastosScreen />}
          {pantalla === 'reportes' && <ReportesScreen />}
          {pantalla === 'clientes' && <ClientesScreen />}
          {pantalla === 'empleados' && <EmpleadosScreen usuario={usuario} />}
          {pantalla === 'categorias' && <CategoriasScreen />}
          {pantalla === 'configuracion' && <ConfiguracionScreen usuario={usuario} />}
        </div>
      </div>
    </div>
  );
}

export default App;
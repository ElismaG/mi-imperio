import { useState } from 'react';
import apiClient from '../services/apiClient';
import { getApiUrl } from '../core/utils/apiUrl';


const FormularioProducto = ({ onProductoCreado, categorias = [] }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: 1,
    codigo_barras: '',
    precio_compra: '',
    precio_venta: '',
    stock_actual: 0,
    stock_minimo: 5,
    ubicacion_almacen: 'Almacén A',
    imagen_principal: ''
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenFile(file);
      // Crear vista previa
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImagen(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje('');

    try {
      let imagenUrl = '';

      // 1. Subir imagen si existe
      if (imagenFile) {
        const formDataImg = new FormData();
        formDataImg.append('imagen', imagenFile);
        const uploadRes = await apiClient.post('/upload', formDataImg, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imagenUrl = uploadRes.data.url;
      }

      // 2. Crear producto
      const dataConImagen = {
        ...formData,
        imagen_principal: imagenUrl
      };

      await apiClient.post('/productos', dataConImagen);
      setMensaje('✅ Producto creado exitosamente');
      
      // Resetear formulario
      setFormData({
        nombre: '',
        descripcion: '',
        categoria_id: 1,
        codigo_barras: '',
        precio_compra: '',
        precio_venta: '',
        stock_actual: 0,
        stock_minimo: 5,
        ubicacion_almacen: 'Almacén A',
        imagen_principal: ''
      });
      setImagenFile(null);
      setPreviewImagen(null);

      if (onProductoCreado) onProductoCreado();
    } catch (error) {
      setMensaje('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#f9f9f9',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '30px',
      border: '1px solid #ddd'
    }}>
      <h2>➕ Agregar nuevo producto</h2>

      {mensaje && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '4px',
          backgroundColor: mensaje.includes('✅') ? '#d4edda' : '#f8d7da',
          color: mensaje.includes('✅') ? '#155724' : '#721c24'
        }}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre *</label>
            <input
              type="text" name="nombre" value={formData.nombre}
              onChange={handleChange} required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Categoría *</label>
            <select
              name="categoria_id" value={formData.categoria_id}
              onChange={handleChange} required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="1">Ropa</option>
              <option value="2">Comida</option>
              <option value="3">Electrodomésticos</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descripción</label>
            <input
              type="text" name="descripcion" value={formData.descripcion}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          {/* FOTO DEL PRODUCTO */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              📸 Foto del producto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImagenChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            {previewImagen && (
              <div style={{ marginTop: '10px' }}>
                <img
                  src={previewImagen}
                  alt="Vista previa"
                  style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #FF6B00' }}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código de barras</label>
            <input
              type="text" name="codigo_barras" value={formData.codigo_barras}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ubicación</label>
            <input
              type="text" name="ubicacion_almacen" value={formData.ubicacion_almacen}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio compra *</label>
            <input
              type="number" name="precio_compra" value={formData.precio_compra}
              onChange={handleChange} required step="0.01"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Precio venta *</label>
            <input
              type="number" name="precio_venta" value={formData.precio_venta}
              onChange={handleChange} required step="0.01"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stock actual</label>
            <input
              type="number" name="stock_actual" value={formData.stock_actual}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stock mínimo</label>
            <input
              type="number" name="stock_minimo" value={formData.stock_minimo}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            marginTop: '20px',
            padding: '12px 30px',
            backgroundColor: cargando ? '#ccc' : '#FF6B00',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: cargando ? 'not-allowed' : 'pointer'
          }}
        >
          {cargando ? 'Guardando...' : 'Guardar producto'}
        </button>
      </form>
    </div>
  );
};

export default FormularioProducto;
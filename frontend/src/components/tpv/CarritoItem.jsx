// CarritoItem.jsx - Cada producto en el carrito
const CarritoItem = ({ item, onCambiarCantidad, onEliminar }) => {
  return (
    <div style={{
      padding: '10px',
      backgroundColor: 'white',
      borderRadius: '6px',
      marginBottom: '8px',
      border: '1px solid #eee'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.nombre}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ${item.precio_unitario.toFixed(2)} c/u
          </div>
        </div>
        <button
          onClick={() => onEliminar(item.producto_id)}
          style={{
            background: 'none',
            border: 'none',
            color: '#E74C3C',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0 5px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onCambiarCantidad(item.producto_id, item.cantidad - 1)}
            style={{
              width: '28px',
              height: '28px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              background: 'white',
              fontWeight: 'bold'
            }}
          >
            −
          </button>
          <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold' }}>
            {item.cantidad}
          </span>
          <button
            onClick={() => onCambiarCantidad(item.producto_id, item.cantidad + 1)}
            style={{
              width: '28px',
              height: '28px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              background: 'white',
              fontWeight: 'bold'
            }}
          >
            +
          </button>
        </div>
        <div style={{ fontWeight: 'bold', color: '#FF6B00' }}>
          ${(item.cantidad * item.precio_unitario).toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default CarritoItem;
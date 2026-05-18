export default function RegistrarCliente() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--muted)',
            marginBottom: 6,
            letterSpacing: '0.1em'
          }}
        >
          CLIENTES
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 500 }}>
          Registrar Cliente 
          
        </h1>
      </div>

      {/* CARD */}
      <form
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 28,
          boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
          border: '1px solid #eee',
          display: 'grid',
          gap: 18
        }}
      >
     {/* NOMBRE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
          Nombre
        </label>
        <input
          type="text"
          placeholder="Ingrese nombre"
          style={{
            padding: '11px 12px',
            borderRadius: 10,
            border: '1px solid #ddd',
            fontSize: 14,
            transition: '0.2s',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid #111'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.05)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid #ddd'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* APELLIDO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
          Apellido
        </label>
        <input
          type="text"
          placeholder="Ingrese apellido"
          style={{
            padding: '11px 12px',
            borderRadius: 10,
            border: '1px solid #ddd',
            fontSize: 14,
            transition: '0.2s',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid #111'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.05)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid #ddd'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* DIRECCIÓN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
          Dirección
        </label>
        <input
          type="text"
          placeholder="Ingrese dirección"
          style={{
            padding: '11px 12px',
            borderRadius: 10,
            border: '1px solid #ddd',
            fontSize: 14,
            transition: '0.2s',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid #111'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.05)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid #ddd'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* TELÉFONO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
          Teléfono
        </label>
        <input
          type="text"
          placeholder="Ingrese teléfono"
          style={{
            padding: '11px 12px',
            borderRadius: 10,
            border: '1px solid #ddd',
            fontSize: 14,
            transition: '0.2s',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid #111'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.05)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid #ddd'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* EMAIL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
          Email
        </label>
        <input
          type="email"
          placeholder="Ingrese email"
          style={{
            padding: '11px 12px',
            borderRadius: 10,
            border: '1px solid #ddd',
            fontSize: 14,
            transition: '0.2s',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid #111'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.05)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid #ddd'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

        {/* BUTTON */}
        <button
          type="submit"
          style={{
            marginTop: 6,
            padding: '12px 14px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #111, #333)',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            transition: '0.2s',
            boxShadow: '0 6px 15px rgba(0,0,0,0.12)'
          }}
      onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.18)'
          }}

          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.12)'
          }}
        >
          Guardar cliente
        </button>
      </form>
    </div>
  );
}
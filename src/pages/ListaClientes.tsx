import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface Cliente {
  idcliente: number
  nombre:    string
  apellido:  string
  email:     string
  telefono:  string
  direccion: string
}

export function ListaClientesPage() {
  const [clientes, setClientes]   = useState<Cliente[]>([])
  const [busqueda, setBusqueda]   = useState('')
  const [editando, setEditando]   = useState<Cliente | null>(null)
  const [loading, setLoading]     = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [erroresModal, setErroresModal] = useState<Partial<Record<string, boolean>>>({})

  const OBLIGATORIOS = ['nombre', 'apellido', 'email']

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    setLoading(true)
    api.get('/clientes')
      .then(r => setClientes(r.data))
      .catch(() => showToast('No se pudieron cargar los clientes.', false))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = clientes.filter(c =>
    (c.nombre + ' ' + c.apellido).toLowerCase().includes(busqueda.toLowerCase())
  )

  const guardar = async () => {
    if (!editando) return

    // Validar campos obligatorios
    const nuevosErrores: Record<string, boolean> = {}
    OBLIGATORIOS.forEach(campo => {
      const val = editando[campo as keyof Cliente]
      if (!val || !String(val).trim()) nuevosErrores[campo] = true
    })
    if (Object.keys(nuevosErrores).length > 0) {
      setErroresModal(nuevosErrores)
      showToast('Debe completar todos los campos obligatorios.', false)
      return
    }
    setErroresModal({})

    setGuardando(true)
    try {
      const payload = Object.fromEntries(
        Object.entries({
          nombre:    editando.nombre,
          apellido:  editando.apellido,
          email:     editando.email,
          telefono:  editando.telefono,
          direccion: editando.direccion,
        }).filter(([, v]) => v !== undefined && v !== '')
      )

      const { data } = await api.patch(`/clientes/${editando.idcliente}`, payload)
      setClientes(prev => prev.map(c => c.idcliente === data.idcliente ? data : c))
      setEditando(null)
      showToast(`Cliente ${data.nombre} ${data.apellido} actualizado correctamente.`, true)
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message ?? 'Error al actualizar el cliente.'
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg
      const esEmailDuplicado = msg.toLowerCase().includes('email') &&
        (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('duplicad') || msg.toLowerCase().includes('ya est'))
      if (esEmailDuplicado) {
        setErroresModal({ email: true })
        showToast('El email ingresado ya está registrado.', false)
      } else {
        showToast(msg, false)
      }
    } finally {
      setGuardando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', borderRadius: 10,
    border: '1px solid #ddd', fontSize: 14, outline: 'none', width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 999,
          background: toast.ok ? '#16a34a' : '#dc2626',
          color: '#fff', borderRadius: 12, padding: '14px 20px',
          fontSize: 14, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          maxWidth: 360,
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.ok ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#8888a0', marginBottom: 6, letterSpacing: '.1em' }}>CLIENTES</div>
      <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 24 }}>Gestión de Clientes</h1>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar por nombre o apellido…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 36 }}
        />
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }}>🔍</span>
      </div>

      {/* Tabla */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eee', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#aaa', fontSize: 14 }}>Cargando clientes...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                {['Nombre', 'Email', 'Teléfono', 'Dirección', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#888', letterSpacing: '.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No se encontraron clientes</td></tr>
              ) : filtrados.map(c => (
                <tr key={c.idcliente} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '11px 14px', fontSize: 13.5 }}>{c.nombre} {c.apellido}</td>
                  <td style={{ padding: '11px 14px', fontSize: 13.5 }}>{c.email}</td>
                  <td style={{ padding: '11px 14px', fontSize: 13.5 }}>{c.telefono}</td>
                  <td style={{ padding: '11px 14px', fontSize: 13.5 }}>{c.direccion}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => { setEditando({ ...c }); setErroresModal({}) }}
                      style={{ border: '1px solid #ddd', background: 'transparent', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', fontSize: 14 }}>
                      ✎
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal edición */}
      {editando && (
        <div
          onClick={e => { if (e.target === e.currentTarget && !guardando) { setEditando(null); setErroresModal({}) } }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
        >
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 440, border: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 17, fontWeight: 500, margin: 0 }}>Editar cliente</h2>
              <button
                onClick={() => { if (!guardando) { setEditando(null); setErroresModal({}) } }}
                disabled={guardando}
                style={{ border: '1px solid #ddd', background: 'transparent', borderRadius: 8, padding: '4px 8px', cursor: guardando ? 'not-allowed' : 'pointer' }}
              >✕</button>
            </div>

            {(['nombre', 'apellido', 'email', 'telefono', 'direccion'] as const).map(campo => {
              const tieneError = !!erroresModal[campo]
              const obligatorio = OBLIGATORIOS.includes(campo)
              const labelMap: Record<string, string> = {
                nombre: 'Nombre', apellido: 'Apellido', email: 'Email',
                telefono: 'Teléfono', direccion: 'Dirección',
              }
              return (
                <div key={campo} style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: tieneError ? '#dc2626' : '#666' }}>
                    {labelMap[campo]}
                    {obligatorio && <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>}
                  </label>
                  <input
                    value={editando[campo]}
                    onChange={e => {
                      setEditando({ ...editando, [campo]: e.target.value })
                      if (erroresModal[campo]) setErroresModal(prev => ({ ...prev, [campo]: false }))
                    }}
                    disabled={guardando}
                    style={{
                      ...inputStyle,
                      opacity: guardando ? 0.6 : 1,
                      border: tieneError ? '1px solid #dc2626' : '1px solid #ddd',
                      boxShadow: tieneError ? '0 0 0 3px rgba(220,38,38,0.1)' : 'none',
                    }}
                  />
                  {tieneError && (
                    <span style={{ fontSize: 12, color: '#dc2626' }}>Este campo es obligatorio.</span>
                  )}
                </div>
              )
            })}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => { setEditando(null); setErroresModal({}) }}
                disabled={guardando}
                style={{ padding: '11px 18px', borderRadius: 10, border: '1px solid #ddd', background: 'transparent', cursor: guardando ? 'not-allowed' : 'pointer', fontSize: 14 }}
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                style={{
                  flex: 1, padding: 11, borderRadius: 10, border: 'none',
                  background: guardando ? '#888' : 'linear-gradient(135deg,#111,#333)',
                  color: '#fff', fontWeight: 500, fontSize: 14,
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

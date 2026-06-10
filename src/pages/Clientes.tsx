import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL as string
const API_KEY  = import.meta.env.VITE_API_KEY  as string

interface ClienteForm {
  nombre:    string
  apellido:  string
  direccion: string
  telefono:  string
  email:     string
}

const CAMPOS = [
  { label: 'Nombre',    name: 'nombre',    type: 'text',  placeholder: 'Ingrese nombre' },
  { label: 'Apellido',  name: 'apellido',  type: 'text',  placeholder: 'Ingrese apellido' },
  { label: 'Dirección', name: 'direccion', type: 'text',  placeholder: 'Ingrese dirección' },
  { label: 'Teléfono',  name: 'telefono',  type: 'text',  placeholder: 'Ingrese teléfono' },
  { label: 'Email',     name: 'email',     type: 'email', placeholder: 'Ingrese email' },
] as const

const FORM_INICIAL: ClienteForm = {
  nombre: '', apellido: '', direccion: '', telefono: '', email: ''
}

const OBLIGATORIOS: (keyof ClienteForm)[] = ['nombre', 'apellido', 'email']

export function ClientesPage() {
  const [form, setForm]       = useState<ClienteForm>(FORM_INICIAL)
  const [loading, setLoading] = useState(false)
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [errores, setErrores] = useState<Partial<Record<keyof ClienteForm, boolean>>>({})

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Limpiar error del campo al escribir
    if (errores[name as keyof ClienteForm]) {
      setErrores(prev => ({ ...prev, [name]: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación: detectar campos obligatorios vacíos
    const nuevosErrores: Partial<Record<keyof ClienteForm, boolean>> = {}
    OBLIGATORIOS.forEach(campo => {
      if (!form[campo].trim()) nuevosErrores[campo] = true
    })

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      showToast('Debe completar todos los campos obligatorios.', false)
      return
    }

    setErrores({})

    setLoading(true)
    try {
      const url = `${API_BASE.replace(/\/$/, '')}/clientes`
      const res = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key':    API_KEY,
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        // NestJS devuelve { message: '...' } en los BadRequestException
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message ?? 'Error al registrar el cliente.'
        showToast(msg, false)
        return
      }

      showToast(`Cliente ${data.nombre} ${data.apellido} registrado correctamente.`, true)
      setForm(FORM_INICIAL)
      setErrores({})
    } catch {
      showToast('No se pudo conectar con el servidor.', false)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '11px 12px',
    borderRadius: 10,
    border: '1px solid #ddd',
    fontSize: 14,
    outline: 'none',
    transition: 'border 0.15s, box-shadow 0.15s',
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto', position: 'relative' }}>

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

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#8888a0', marginBottom: 6, letterSpacing: '0.1em' }}>
          CLIENTES
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>Registrar Cliente</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff', borderRadius: 14, padding: 28,
          boxShadow: '0 10px 25px rgba(0,0,0,0.06)', border: '1px solid #eee',
          display: 'grid', gap: 18,
        }}
      >
        {CAMPOS.map(({ label, name, type, placeholder }) => {
          const obligatorio = OBLIGATORIOS.includes(name as keyof ClienteForm)
          const tieneError  = !!errores[name as keyof ClienteForm]
          return (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: tieneError ? '#dc2626' : '#444', fontWeight: 500 }}>
                {label}
                {obligatorio && (
                  <span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>
                )}
              </label>
              <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={form[name]}
                onChange={handleChange}
                disabled={loading}
                style={{
                  ...inputStyle,
                  opacity: loading ? 0.6 : 1,
                  border: tieneError ? '1px solid #dc2626' : '1px solid #ddd',
                  boxShadow: tieneError ? '0 0 0 3px rgba(220,38,38,0.1)' : 'none',
                }}
                onFocus={e => {
                  if (!tieneError) {
                    e.currentTarget.style.border = '1px solid #111'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.05)'
                  }
                }}
                onBlur={e => {
                  if (!errores[name as keyof ClienteForm]) {
                    e.currentTarget.style.border = '1px solid #ddd'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              />
              {tieneError && (
                <span style={{ fontSize: 12, color: '#dc2626' }}>
                  Este campo es obligatorio.
                </span>
              )}
            </div>
          )
        })}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 6, padding: '12px 14px', borderRadius: 10,
            border: 'none',
            background: loading ? '#888' : 'linear-gradient(135deg, #111, #333)',
            color: 'white', fontWeight: 600, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 15px rgba(0,0,0,0.12)',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.18)'
            }
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.12)'
          }}
        >
          {loading ? 'Guardando...' : 'Guardar cliente'}
        </button>
      </form>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

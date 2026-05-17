import React, {  useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'
import { useToast } from '../components/Toast'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!email || !password) { toast('Completá los campos', 'warn'); return }
    setLoading(true)
    try {
      await authService.login(email, password)
      toast('Bienvenido', 'success')
      navigate('/ventas/nueva')
    } catch (e: any) {
      toast(e.response?.data?.message ?? e.message ?? 'Error al iniciar sesión', 'error')
    } finally {
      setLoading(false)
    }
  }

 

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 36,
        width: '100%',
        maxWidth: 380,
      }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 6 }}>
            MUNDODIGITAL S.A.
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>
            Ventas <span style={{ color: 'var(--accent)' }}>G1</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Módulo de gestión de ventas
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={btnStyle(loading)}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: 14,
  width: '100%',
  outline: 'none',
}

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '11px',
  background: disabled ? 'var(--accent-dim)' : 'var(--accent)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: '#fff',
  fontWeight: 500,
  fontSize: 14,
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: 4,
  transition: 'opacity 0.15s',
})

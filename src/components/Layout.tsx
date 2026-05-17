import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'

interface NavItem {
  path: string
  label: string
  icon: string
}

const NAV: NavItem[] = [
  { path: '/ventas/nueva', label: 'Nueva Venta', icon: '＋' },
  { path: '/ventas',       label: 'Historial',   icon: '☰' },
  { path: '/clientes',     label: 'Clientes',    icon: '◉' },
]

export function Layout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    authService.logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        minWidth: 220,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
      }}>
        {/* Brand */}
        <div style={{ padding: '0 20px 28px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 6 }}>
            MUNDODIGITAL S.A.
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', lineHeight: 1.2 }}>
            Ventas <span style={{ color: 'var(--accent)' }}>G1</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
          {NAV.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/ventas'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 'var(--radius)',
                color: isActive ? 'var(--text)' : 'var(--muted)',
                background: isActive ? 'var(--surface2)' : 'transparent',
                fontWeight: isActive ? 500 : 400,
                transition: 'all 0.15s',
                fontSize: 13.5,
              })}
            >
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
            {authService.getNombre()}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '7px 12px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: 12,
              transition: 'all 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--muted)')}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  )
}

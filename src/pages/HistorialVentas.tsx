import { useEffect, useState } from 'react'
import type { VentaRegistrada } from '../services/ventas'
import { ventasService, formatPeso, formatFecha } from '../services/ventas'
import { useToast } from '../components/Toast'

export function HistorialVentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<VentaRegistrada[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ventasService.getVentas()
      .then(setVentas)
      .catch(() => toast('Error al cargar historial', 'error'))
      .finally(() => setLoading(false))
  }, [])



  
  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.1em' }}>
          OPERACIONES
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 500 }}>Historial de Ventas</h1>
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>Cargando…</div>
      ) : ventas.length === 0 ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px',
          textAlign: 'center',
          color: 'var(--muted)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
          <div>Aún no hay ventas registradas</div>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Fecha', 'Cliente ID', 'Items', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    color: 'var(--muted)',
                    fontSize: 11,
                    fontWeight: 500,
                    textAlign: 'left',
                    fontFamily: 'var(--mono)',
                    letterSpacing: '0.06em',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.idventa} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                    #{v.idventa}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{formatFecha(v.fechaventa)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{v.idcliente}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12 }}>
                    {(v.detalleventas ?? []).reduce((s, d) => s + d.cantidad, 0)} uds.
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)' }}>
                    {formatPeso(v.total? 0 : 0)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: v.estado === 'Realizada' ? 'var(--success)' : 'var(--danger)',
                      background: v.estado === 'Realizada' ? '#3ecf6a18' : '#f05b5b18',
                      padding: '3px 8px',
                      borderRadius: 99,
                    }}>
                      {v.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
  <div style={{ display: 'flex', gap: 8 }}>

    <button
      style={{
        border: 'none',
        background: '#2563eb22',
        color: '#2563eb',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
      }}
    >
      🔍
    </button>

    <button
      style={{
        border: 'none',
        background: '#dc262622',
        color: '#dc2626',
        borderRadius: 8,
        padding: '6px 10px',
        cursor: 'pointer',
      }}
    >
      🗑
    </button>

  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}



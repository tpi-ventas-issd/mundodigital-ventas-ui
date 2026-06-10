import { useEffect, useState } from 'react'
import type { Cliente, Producto, VentaRegistrada } from '../services/ventas'
import { ventasService, formatPeso, formatFecha } from '../services/ventas'
import { useToast } from '../components/Toast'
import { api } from '../services/api'

// ─── Colores de estado ──────────────────────────────────────────────────────────

const estadoColor = (estado: string) => {
  if (estado === 'Completada') return { color: '#16a34a', bg: '#16a34a18' }
  if (estado === 'Cancelada')  return { color: '#dc2626', bg: '#dc262618' }
  return { color: '#d97706', bg: '#d9770618' } // Confirmada
}

// ─── Modal de detalle ───────────────────────────────────────────────────────────

function DetalleModal({
  venta, cliente, productos, onClose,
}: {
  venta: VentaRegistrada
  cliente: Cliente | undefined
  productos: Producto[]
  onClose: () => void
}) {
  const col = estadoColor(venta.estado)


  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: '#000a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          width: '100%',
          maxWidth: 480,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>DETALLE DE VENTA</div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>Operación #{venta.idventa}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{formatFecha(venta.fechaventa)}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
          >×</button>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <Row label="Cliente" value={cliente ? `${cliente.nombre} ${cliente.apellido ?? ''}`.trim() : `ID ${venta.idcliente}`} />
          <Row label="Estado">
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 11,
              color: col.color, background: col.bg,
              padding: '3px 8px', borderRadius: 99,
            }}>
              {venta.estado.replace(/_/g, ' ')}
            </span>
          </Row>
          {venta.direccionentrega && <Row label="Dirección" value={venta.direccionentrega} />}
          {venta.indicacionesentrega && <Row label="Indicaciones" value={venta.indicacionesentrega} muted />}
        </div>

        {/* Productos */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 12 }}>PRODUCTOS</div>
          {(venta.detalleventas ?? []).map(d => {
            const nombreProd = productos.find(p => p.idproducto === d.idproducto)?.nombre ?? `ID #${d.idproducto}`
            return (
              <div key={d.iddetalle} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>{nombreProd} ×{d.cantidad}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                  {formatPeso(Number(d.preciounitario) * d.cantidad)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
          <span>Total</span>
          <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: 16 }}>
            {formatPeso(Number(venta.total))}
          </span>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, muted, children }: { label: string; value?: string; muted?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{label}</span>
      {children ?? <span style={{ color: muted ? 'var(--muted)' : 'var(--text)', fontStyle: muted ? 'italic' : 'normal', textAlign: 'right', maxWidth: '60%' }}>{value}</span>}
    </div>
  )
}

// ─── Modal de cancelación ───────────────────────────────────────────────────────

function CancelarModal({
  venta,
  onConfirm,
  onClose,
  loading,
}: {
  venta: VentaRegistrada
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px 32px', maxWidth: 380, width: '100%' }}
      >
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>CONFIRMAR CANCELACIÓN</div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>¿Cancelar venta #{venta.idventa}?</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Esta acción no se puede deshacer.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, padding: '10px', background: '#dc262622', border: '1px solid #dc262644', borderRadius: 'var(--radius)', color: '#dc2626', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {loading ? 'Cancelando…' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ───────────────────────────────────────────────────────────

export function HistorialVentasPage() {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<VentaRegistrada[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [ventaDetalle, setVentaDetalle] = useState<VentaRegistrada | null>(null)
  const [ventaCancelar, setVentaCancelar] = useState<VentaRegistrada | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState('')
  const [filtroCliente, setFiltroCliente] = useState<number | ''>('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroProducto, setFiltroProducto] = useState('')

  const cargar = () => {
    setLoading(true)
    Promise.all([
      ventasService.getVentas(),
      ventasService.getClientes(),
      ventasService.getProductos(),
    ]).then(([vs, cs, ps]) => {
      // Orden: más reciente primero
      setVentas([...vs].sort((a, b) => b.idventa - a.idventa))
      setClientes(cs)
      setProductos(ps)
    }).catch(() => toast('Error al cargar historial', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])



// ─── cancelar a envio ───────────────────────────────────────────────────────────

  const handleCancelar = async () => {
    if (!ventaCancelar) return
    setCancelando(true)
    try {
      // 1) Cancelar el envío ANTES de cancelar la venta
      try {
        const { data: envio } = await api.get(`/envios/venta/${ventaCancelar.idventa}`)
        if (envio && envio.estado !== 'Cancelado' && envio.estado !== 'Entregado') {
          await api.patch(`/envios/${envio.idenvio}/estado`, {
            estadonuevo: 'Cancelado',
            observaciones: 'Venta cancelada',
          })
        }
      } catch {
        // No hay envío asociado, se continúa igual
      }

      // 2) Cancelar la venta
      await ventasService.cancelarVenta(ventaCancelar.idventa)

      toast(`Venta #${ventaCancelar.idventa} cancelada`, 'success')
      setVentaCancelar(null)
      cargar()
    } catch (e: any) {
      toast(e.response?.data?.message ?? 'Error al cancelar', 'error')
    } finally {
      setCancelando(false)
    }
  }




  // ── Ventas filtradas ─────────────────────────────────────────────────────────
  const ventasFiltradas = ventas.filter(v => {
    const texto = busqueda.trim().toLowerCase()
    if (filtroCliente !== '' && v.idcliente !== filtroCliente) return false
    if (filtroEstado && v.estado !== filtroEstado) return false
    if (filtroProducto) {
      const termProd = filtroProducto.toLowerCase()
      const tieneProducto = (v.detalleventas ?? []).some(d => {
        const nombre = productos.find(p => p.idproducto === d.idproducto)?.nombre ?? ''
        return nombre.toLowerCase().includes(termProd)
      })
      if (!tieneProducto) return false
    }
    if (texto) {
      const idMatch = String(v.idventa).includes(texto)
      const c = clientes.find(c => c.idcliente === v.idcliente)
      const clienteNombre = c ? `${c.nombre} ${c.apellido ?? ''}`.toLowerCase() : ''
      const clienteMatch = clienteNombre.includes(texto)
      const estadoMatch = v.estado.replace(/_/g, ' ').toLowerCase().includes(texto)
      if (!idMatch && !clienteMatch && !estadoMatch) return false
    }
    return true
  })

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroCliente('')
    setFiltroEstado('')
    setFiltroProducto('')
  }

  const hayFiltros = busqueda !== '' || filtroCliente !== '' || filtroEstado !== '' || filtroProducto !== ''

  const nombreCliente = (idcliente: number) => {
    const c = clientes.find(c => c.idcliente === idcliente)
    if (!c) return `ID ${idcliente}`
    return `${c.nombre} ${c.apellido ?? ''}`.trim()
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.1em' }}>
            OPERACIONES
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 500 }}>Historial de Ventas</h1>
        </div>
        <button
          onClick={cargar}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '7px 14px', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--mono)' }}
        >
          ↻ Actualizar
        </button>
      </div>

      {/* ── Barra de búsqueda y filtros ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Búsqueda general */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted)', fontSize: 14, pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por ID, cliente o estado…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 32px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filtro por cliente */}
        <select
          value={filtroCliente}
          onChange={e => setFiltroCliente(e.target.value === '' ? '' : Number(e.target.value))}
          style={{
            padding: '9px 12px',
            background: 'var(--surface)',
            border: `1px solid ${filtroCliente !== '' ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            color: filtroCliente !== '' ? 'var(--accent)' : 'var(--muted)',
            fontSize: 13,
            cursor: 'pointer',
            outline: 'none',
            minWidth: 160,
          }}
        >
          <option value="">Todos los clientes</option>
          {clientes
            .slice()
            .sort((a, b) => `${a.nombre} ${a.apellido ?? ''}`.localeCompare(`${b.nombre} ${b.apellido ?? ''}`))
            .map(c => (
              <option key={c.idcliente} value={c.idcliente}>
                {`${c.nombre} ${c.apellido ?? ''}`.trim()}
              </option>
            ))}
        </select>

        {/* Filtro por estado */}
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{
            padding: '9px 12px',
            background: 'var(--surface)',
            border: `1px solid ${filtroEstado ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            color: filtroEstado ? 'var(--accent)' : 'var(--muted)',
            fontSize: 13,
            cursor: 'pointer',
            outline: 'none',
            minWidth: 140,
          }}
        >
          <option value="">Todos los estados</option>
          <option value="Confirmada">Confirmada</option>
          <option value="Entregada">Entregada</option>
          <option value="Cancelada">Cancelada</option>
        </select>

        {/* Búsqueda por producto */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted)', fontSize: 13, pointerEvents: 'none',
          }}>📦</span>
          <input
            type="text"
            placeholder="Buscar por producto…"
            value={filtroProducto}
            onChange={e => setFiltroProducto(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 32px',
              background: 'var(--surface)',
              border: `1px solid ${filtroProducto ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              color: filtroProducto ? 'var(--text)' : 'var(--muted)',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Botón limpiar filtros */}
        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            style={{
              padding: '9px 14px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--muted)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              whiteSpace: 'nowrap',
            }}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      {!loading && hayFiltros && (
        <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          {ventasFiltradas.length} resultado{ventasFiltradas.length !== 1 ? 's' : ''} de {ventas.length}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>Cargando…</div>
      ) : ventas.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
          <div>Aún no hay ventas registradas</div>
        </div>
      ) : ventasFiltradas.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
          <div style={{ marginBottom: 10 }}>Sin resultados para los filtros aplicados</div>
          <button
            onClick={limpiarFiltros}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Fecha', 'Cliente', 'Items', 'Total', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 11, fontWeight: 500, textAlign: 'left', fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.map(v => {
                const col = estadoColor(v.estado)
                const cancelable = v.estado !== 'Cancelada' && v.estado !== 'Completada'
                return (
                  <tr
                    key={v.idventa}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                      #{v.idventa}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      {formatFecha(v.fechaventa)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      {nombreCliente(v.idcliente)}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 12 }}>
                      {(() => {
                        const detalles = v.detalleventas ?? []
                        const totalUds = detalles.reduce((s, d) => s + d.cantidad, 0)
                        const tooltipText = detalles.map(d => {
                          const nombre = productos.find(p => p.idproducto === d.idproducto)?.nombre ?? `ID #${d.idproducto}`
                          return `${nombre} ×${d.cantidad}`
                        }).join('\n')
                        return (
                          <span
                            title={tooltipText}
                            style={{
                              cursor: 'help',
                              borderBottom: '1px dashed var(--border)',
                              paddingBottom: 1,
                            }}
                          >
                            {totalUds} uds.
                          </span>
                        )
                      })()}
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)' }}>
                      {formatPeso(Number(v.total))}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: col.color, background: col.bg, padding: '3px 8px', borderRadius: 99 }}>
                        {v.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setVentaDetalle(v)}
                          title="Ver detalle"
                          style={{ border: 'none', background: '#2563eb22', color: '#2563eb', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}
                        >
                          🔍
                        </button>
                        <button
                          onClick={() => cancelable && setVentaCancelar(v)}
                          title={cancelable ? 'Cancelar venta' : 'No se puede cancelar'}
                          style={{ border: 'none', background: cancelable ? '#dc262622' : 'var(--surface2)', color: cancelable ? '#dc2626' : 'var(--border2)', borderRadius: 8, padding: '6px 10px', cursor: cancelable ? 'pointer' : 'not-allowed', fontSize: 13 }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      {ventaDetalle && (
        <DetalleModal
          venta={ventaDetalle}
          cliente={clientes.find(c => c.idcliente === ventaDetalle.idcliente)}
          onClose={() => setVentaDetalle(null)}
          productos={productos}
        />
      )}
      {ventaCancelar && (
        <CancelarModal
          venta={ventaCancelar}
          onConfirm={handleCancelar}
          onClose={() => setVentaCancelar(null)}
          loading={cancelando}
        />
      )}
    </div>
  )
}
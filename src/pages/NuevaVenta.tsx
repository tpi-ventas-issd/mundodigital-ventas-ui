import React, { useEffect, useState } from 'react'
import {
  ventasService,
  Cliente, Producto, DetalleVentaPayload, VentaRegistrada,
  formatPeso, formatFecha,
} from '../services/ventas'
import { useToast } from '../components/Toast'

// ─── Sub-types ──────────────────────────────────────────────────────────────────

interface LineaVenta {
  producto: Producto
  cantidad: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const subtotal = (l: LineaVenta) => l.cantidad * l.producto.precio
const totalVenta = (lineas: LineaVenta[]) => lineas.reduce((s, l) => s + subtotal(l), 0)

// ─── Componente principal ───────────────────────────────────────────────────────

export function NuevaVentaPage() {
  const { toast } = useToast()

  // Data
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  // Form state
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [buscarProducto, setBuscarProducto] = useState('')
  const [lineas, setLineas] = useState<LineaVenta[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ventaConfirmada, setVentaConfirmada] = useState<VentaRegistrada | null>(null)

  // Load data
  useEffect(() => {
    Promise.all([
      ventasService.getClientes(),
      ventasService.getProductos(),
    ]).then(([cls, prods]) => {
      setClientes(cls)
      setProductos(prods)
      setLoading(false)
    }).catch(() => {
      toast('Error al cargar datos', 'error')
      setLoading(false)
    })
  }, [])

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(buscarProducto.toLowerCase()) &&
    !lineas.some(l => l.producto.idproducto === p.idproducto)
  )

  const agregarProducto = (prod: Producto) => {
    if (prod.stockactual === 0) {
      toast(`"${prod.nombre}" no tiene stock disponible`, 'error')
      return
    }
    setLineas(prev => [...prev, { producto: prod, cantidad: 1 }])
    setBuscarProducto('')
    setShowDropdown(false)
  }

  const actualizarCantidad = (idproducto: number, valor: number) => {
    const prod = productos.find(p => p.idproducto === idproducto)!
    if (valor < 1) return
    if (valor > prod.stockactual) {
      toast(`Stock disponible: ${prod.stockactual} unidades`, 'warn')
      return
    }
    setLineas(prev =>
      prev.map(l => l.producto.idproducto === idproducto ? { ...l, cantidad: valor } : l)
    )
  }

  const quitarLinea = (idproducto: number) => {
    setLineas(prev => prev.filter(l => l.producto.idproducto !== idproducto))
  }

  const handleConfirmar = async () => {
    if (!clienteId) { toast('Seleccioná un cliente', 'warn'); return }
    if (lineas.length === 0) { toast('Agregá al menos un producto', 'warn'); return }

    // Verificación de stock antes de enviar (CA: no registrar con stock insuficiente)
    for (const linea of lineas) {
      const ok = await ventasService.verificarStock(linea.producto.idproducto, linea.cantidad)
      if (!ok) {
        toast(`Stock insuficiente para "${linea.producto.nombre}"`, 'error')
        return
      }
    }

    setSubmitting(true)
    try {
      const detalles: DetalleVentaPayload[] = lineas.map(l => ({
        idproducto: l.producto.idproducto,
        cantidad: l.cantidad,
        preciounitario: l.producto.precio,
      }))
      const venta = await ventasService.registrarVenta({ idcliente: clienteId, detalles })
      setVentaConfirmada(venta)
      toast(`Venta #${venta.idventa} registrada con éxito`, 'success')
    } catch (e: any) {
      toast(e.response?.data?.message ?? e.message ?? 'Error al registrar la venta', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNuevaVenta = () => {
    setVentaConfirmada(null)
    setClienteId(null)
    setLineas([])
    setBuscarProducto('')
    // Refrescar stock
    ventasService.getProductos().then(setProductos)
  }

  // ─── Confirmación (estado final) ────────────────────────────────────────────

  if (ventaConfirmada) {
    return <ConfirmacionView venta={ventaConfirmada} onNueva={handleNuevaVenta} clientes={clientes} />
  }

  // ─── Carga ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={centerStyle}>
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          Cargando datos…
        </div>
      </div>
    )
  }

  // ─── Formulario principal ────────────────────────────────────────────────────

  const clienteSeleccionado = clientes.find(c => c.idcliente === clienteId)

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.1em' }}>
          NUEVA OPERACIÓN
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: 'var(--text)' }}>Registrar Venta</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* ── Columna izquierda ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Selección de cliente */}
          <Card title="Cliente">
            <select
              value={clienteId ?? ''}
              onChange={e => setClienteId(Number(e.target.value) || null)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">— Seleccioná un cliente —</option>
              {clientes.map(c => (
                <option key={c.idcliente} value={c.idcliente}>
                  {c.nombre} · {c.email}
                </option>
              ))}
            </select>
            {clienteSeleccionado && (
              <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>
                ID #{clienteSeleccionado.idcliente} · {clienteSeleccionado.email}
              </div>
            )}
          </Card>

          {/* Agregar productos */}
          <Card title="Productos">
            {/* Buscador */}
            <div style={{ position: 'relative', marginBottom: lineas.length > 0 ? 16 : 0 }}>
              <input
                placeholder="Buscar producto…"
                value={buscarProducto}
                onChange={e => { setBuscarProducto(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                style={inputStyle}
              />
              {showDropdown && buscarProducto && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  marginTop: 4,
                  zIndex: 100,
                  overflow: 'hidden',
                  maxHeight: 260,
                  overflowY: 'auto',
                }}>
                  {productosFiltrados.length === 0 ? (
                    <div style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 13 }}>
                      Sin resultados
                    </div>
                  ) : productosFiltrados.map(p => (
                    <button
                      key={p.idproducto}
                      onClick={() => agregarProducto(p)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'transparent',
                        border: 'none',
                        color: p.stockactual === 0 ? 'var(--muted)' : 'var(--text)',
                        cursor: p.stockactual === 0 ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseOver={e => { if (p.stockactual > 0) e.currentTarget.style.background = 'var(--surface)' }}
                      onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span>{p.nombre}</span>
                      <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>
                          {formatPeso(p.precio)}
                        </span>
                        <span style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          color: p.stockactual === 0 ? 'var(--danger)' : p.stockactual <= p.puntoreposicion ? 'var(--warn)' : 'var(--success)',
                        }}>
                          stock: {p.stockactual}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabla de líneas */}
            {lineas.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Producto', 'Precio unit.', 'Cant.', 'Subtotal', ''].map(h => (
                      <th key={h} style={{ padding: '6px 8px', color: 'var(--muted)', fontSize: 11, fontWeight: 500, textAlign: 'left', fontFamily: 'var(--mono)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineas.map(linea => (
                    <tr key={linea.producto.idproducto} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 8px', fontSize: 13 }}>
                        {linea.producto.nombre}
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                          stock disp.: {linea.producto.stockactual}
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                        {formatPeso(linea.producto.precio)}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => actualizarCantidad(linea.producto.idproducto, linea.cantidad - 1)} style={qtyBtn}>−</button>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, minWidth: 24, textAlign: 'center' }}>{linea.cantidad}</span>
                          <button onClick={() => actualizarCantidad(linea.producto.idproducto, linea.cantidad + 1)} style={qtyBtn}>＋</button>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)' }}>
                        {formatPeso(subtotal(linea))}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => quitarLinea(linea.producto.idproducto)}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}
                          title="Quitar"
                        >×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {lineas.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                Buscá y seleccioná productos para agregar a la venta
              </div>
            )}
          </Card>
        </div>

        {/* ── Columna derecha: resumen ── */}
        <div style={{ position: 'sticky', top: 32 }}>
          <Card title="Resumen">
            {lineas.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>
                Sin productos seleccionados
              </div>
            ) : (
              <>
                {lineas.map(l => (
                  <div key={l.producto.idproducto} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--muted)' }}>{l.producto.nombre} ×{l.cantidad}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{formatPeso(subtotal(l))}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0 16px', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>Total</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--accent)', fontWeight: 500 }}>
                    {formatPeso(totalVenta(lineas))}
                  </span>
                </div>
              </>
            )}

            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', padding: '6px 10px', background: 'var(--bg)', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Cliente</span>
                <span style={{ color: clienteId ? 'var(--text)' : 'var(--danger)' }}>
                  {clienteSeleccionado?.nombre ?? 'No seleccionado'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', padding: '6px 10px', background: 'var(--bg)', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Estado</span>
                <span style={{ color: 'var(--warn)' }}>Pendiente</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', padding: '6px 10px', background: 'var(--bg)', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Items</span>
                <span>{lineas.reduce((s, l) => s + l.cantidad, 0)} unidades</span>
              </div>
            </div>

            <button
              onClick={handleConfirmar}
              disabled={submitting || !clienteId || lineas.length === 0}
              style={{
                width: '100%',
                marginTop: 20,
                padding: '12px',
                background: submitting || !clienteId || lineas.length === 0 ? 'var(--accent-dim)' : 'var(--accent)',
                border: 'none',
                borderRadius: 'var(--radius)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: submitting || !clienteId || lineas.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
              }}
            >
              {submitting ? 'Registrando…' : 'Confirmar Venta'}
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Confirmación ───────────────────────────────────────────────────────────────

function ConfirmacionView({
  venta,
  onNueva,
  clientes,
}: {
  venta: VentaRegistrada
  onNueva: () => void
  clientes: Cliente[]
}) {
  const cliente = clientes.find(c => c.idcliente === venta.idcliente)

  return (
    <div style={{ padding: '48px 40px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>VENTA REGISTRADA</div>
        <h2 style={{ fontSize: 22, fontWeight: 500 }}>Operación #{venta.idventa}</h2>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{formatFecha(venta.fecha)}</div>
      </div>

      <Card title="Detalle">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
          <span style={{ color: 'var(--muted)' }}>Cliente</span>
          <span>{cliente?.nombre ?? `ID ${venta.idcliente}`}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--muted)' }}>Estado</span>
          <span style={{ color: 'var(--success)', fontFamily: 'var(--mono)', fontSize: 12 }}>● {venta.estado}</span>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {venta.detalles.map(d => (
            <div key={d.iddetalle} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>{d.producto.nombre} ×{d.cantidad}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{formatPeso(d.subtotal)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span>Total</span>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: 16 }}>{formatPeso(venta.total)}</span>
          </div>
        </div>
      </Card>

      <button
        onClick={onNueva}
        style={{
          width: '100%',
          marginTop: 20,
          padding: '12px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
          fontWeight: 500,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Registrar nueva venta
      </button>
    </div>
  )
}

// ─── Componentes auxiliares ─────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
    }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 14 }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '9px 12px',
  color: 'var(--text)',
  fontSize: 13.5,
  outline: 'none',
}

const qtyBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
}

const centerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
}

import { useEffect, useState } from 'react'
import type { Cliente, Producto, VentaRegistrada } from '../services/ventas'
import { ventasService, formatPeso, formatFecha } from '../services/ventas'
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

  // Dirección de entrega
  const [usarOtraDireccion, setUsarOtraDireccion] = useState(false)
  const [direccionEntrega, setDireccionEntrega] = useState('')

  // UI state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ventaConfirmada, setVentaConfirmada] = useState<VentaRegistrada | null>(null)

  const [indicacionesEntrega, setIndicacionesEntrega] = useState('')

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

  // Al cambiar cliente: pre-llenar dirección y resetear override
  const handleClienteChange = (id: number | null) => {
    setClienteId(id)
    setUsarOtraDireccion(false)
    const c = clientes.find(c => c.idcliente === id)
    setDireccionEntrega(c?.direccion ?? '')
  }

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

    for (const linea of lineas) {
      if (linea.cantidad > linea.producto.stockactual) {
        toast(`Stock insuficiente para ${linea.producto.nombre}`, 'error')
        return
      }
    }

    if (usarOtraDireccion && !direccionEntrega.trim()) {
      toast('Ingresá la dirección de entrega alternativa', 'warn')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        idCliente: clienteId!,
        detalles: lineas.map(l => ({
          idProducto: l.producto.idproducto,
          cantidad: l.cantidad,
        })),
        direccionEntrega: direccionEntrega.trim() || null,
        indicacionesEntrega: indicacionesEntrega.trim() || null,  // ← agregar
      }
      const res = await ventasService.registrarVenta(payload)
      console.log('RES:', JSON.stringify(res)) 
      setVentaConfirmada(res)
      toast(`Venta #${res.idventa} registrada con éxito`, 'success')
    } catch (e: any) {
      console.log('Error response:', e.response?.data)
      toast(e.response?.data?.message ?? 'Error al registrar venta', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNuevaVenta = () => {
    setVentaConfirmada(null)
    setClienteId(null)
    setLineas([])
    setBuscarProducto('')
    setDireccionEntrega('')
    setUsarOtraDireccion(false)
    ventasService.getProductos().then(setProductos)
    setIndicacionesEntrega('')
  }

  // ─── Confirmación ────────────────────────────────────────────────────────────


  if (ventaConfirmada) {
    return (
      <ConfirmacionView
        venta={ventaConfirmada}
        onNueva={handleNuevaVenta}
        clientes={clientes}
        lineas={lineas}
        direccionEntrega={direccionEntrega}
        indicacionesEntrega={indicacionesEntrega}
      />
    )
  }

  if (loading) {
    return (
      <div style={centerStyle}>
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          Cargando datos…
        </div>
      </div>
    )
  }

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
              onChange={e => handleClienteChange(Number(e.target.value) || null)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">— Seleccioná un cliente —</option>
              {clientes.map(c => (
                <option key={c.idcliente} value={c.idcliente}>
                  {c.nombre} {c.apellido ?? ''} · {c.email}
                </option>
              ))}
            </select>
            {clienteSeleccionado && (
              <div style={{ marginTop: 8, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>
                ID #{clienteSeleccionado.idcliente} · {clienteSeleccionado.email}
              </div>
            )}

            {/* ── Dirección de entrega ── */}
            {clienteSeleccionado && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 8, letterSpacing: '0.06em' }}>
                  DIRECCIÓN DE ENTREGA
                </div>

                {/* Dirección del cliente (solo lectura cuando no se cambia) */}
                {!usarOtraDireccion && (
                  <div style={{
                    padding: '9px 12px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: 13,
                    color: clienteSeleccionado.direccion ? 'var(--text)' : 'var(--muted)',
                    fontStyle: clienteSeleccionado.direccion ? 'normal' : 'italic',
                  }}>
                    {clienteSeleccionado.direccion ?? 'Sin dirección registrada'}
                  </div>
                )}

                {/* Input dirección alternativa */}
                {usarOtraDireccion && (
                  <input
                    placeholder="Ej: Av. Corrientes 1842 2°B, CABA"
                    value={direccionEntrega}
                    onChange={e => setDireccionEntrega(e.target.value)}
                    style={inputStyle}
                    maxLength={200}
                  />
                )}

                {/* Checkbox */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 10,
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--muted)',
                  userSelect: 'none',
                }}>
                  <input
                    type="checkbox"
                    checked={usarOtraDireccion}
                    onChange={e => {
                      setUsarOtraDireccion(e.target.checked)
                      // Al desmarcar, volver a la dirección del cliente
                      if (!e.target.checked) {
                        setDireccionEntrega(clienteSeleccionado?.direccion ?? '')
                      } else {
                        setDireccionEntrega('')
                      }
                    }}
                    style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                  />
                  Usar dirección diferente a la del cliente
                </label>

                {/* Indicaciones de entrega */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6, letterSpacing: '0.06em' }}>
                    INDICACIONES DE ENTREGA <span style={{ color: 'var(--border2)' }}>(opcional)</span>
                  </div>
                  <textarea
                    placeholder="Ej: Timbre 2°B, dejar con portería, llamar al llegar…"
                    value={indicacionesEntrega}
                    onChange={e => setIndicacionesEntrega(e.target.value)}
                    maxLength={200}
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: 60,
                      fontFamily: 'var(--sans)',
                    }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Agregar productos */}
          <Card title="Productos">
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
                    <div style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 13 }}>Sin resultados</div>
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
                      <td style={{ padding: '10px 8px', fontFamily: 'var(--mono)', fontSize: 12 }}>
                        {formatPeso(subtotal(linea))}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => quitarLinea(linea.producto.idproducto)}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}
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
              <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 0' }}>Sin productos seleccionados</div>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InfoRow label="Cliente" value={clienteSeleccionado?.nombre ?? 'No seleccionado'} warn={!clienteId} />
              <InfoRow label="Entrega" value={
                usarOtraDireccion
                  ? (direccionEntrega.trim() || 'Sin indicar')
                  : (clienteSeleccionado?.direccion ?? 'Sin dirección')
              } />
              <InfoRow label="Estado" value="Pendiente de entrega" color="var(--warn)" />
              <InfoRow label="Items" value={`${lineas.reduce((s, l) => s + l.cantidad, 0)} unidades`} />
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
              }}
            >
              {submitting ? 'Registrando…' : 'Confirmar Venta'}
            </button>
          </Card>
        </div>
      </div>

      {/* Listado de productos */}
      <div style={{ marginTop: 24 }}>
        <Card title="Listado de productos">
          <div style={{ display: 'grid', gap: 10 }}>
            {productos.map(p => (
              <div
                key={p.idproducto}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  background: 'var(--surface2)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                    Stock: {p.stockactual} · Reposición: {p.puntoreposicion}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>
                    {formatPeso(p.precio)}
                  </div>
                  <button
                    onClick={() => agregarProducto(p)}
                    disabled={p.stockactual === 0}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: p.stockactual === 0 ? 'var(--border)' : 'var(--surface)',
                      color: p.stockactual === 0 ? 'var(--muted)' : 'var(--text)',
                      cursor: p.stockactual === 0 ? 'not-allowed' : 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      border2: '1px solid var(--border2)',
                    } as React.CSSProperties}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── Confirmación ───────────────────────────────────────────────────────────────

function ConfirmacionView({
  venta, onNueva, clientes, lineas, direccionEntrega, indicacionesEntrega,
}: {
  venta: VentaRegistrada
  onNueva: () => void
  clientes: Cliente[]
  lineas: LineaVenta[]        // ← ¿está esto?
  direccionEntrega: string
  indicacionesEntrega: string
}) {
  const cliente = clientes.find(c => c.idcliente === venta.idcliente)

  return (
    <div style={{ padding: '48px 40px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>VENTA REGISTRADA</div>
        <h2 style={{ fontSize: 22, fontWeight: 500 }}>Operación #{venta.idventa}</h2>
        <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{formatFecha(venta.fechaventa)}</div>
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
          {lineas.map((l, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>{l.producto.nombre} ×{l.cantidad}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                {formatPeso(l.cantidad * l.producto.precio)}
              </span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span>Total</span>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: 16 }}>
              {formatPeso(Number(venta.total))}
            </span>
          </div>
        </div>
        {direccionEntrega && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
            <span style={{ color: 'var(--muted)' }}>Dirección entrega</span>
            <span style={{ textAlign: 'right', maxWidth: '60%' }}>{direccionEntrega}</span>
          </div>
        )}
        {indicacionesEntrega && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13 }}>
            <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Indicaciones</span>
            <span style={{ textAlign: 'right', maxWidth: '60%', color: 'var(--muted)', fontStyle: 'italic' }}>
              {indicacionesEntrega}
            </span>
          </div>
        )}
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

function InfoRow({ label, value, warn, color }: { label: string; value: string; warn?: boolean; color?: string }) {
  return (
    <div style={{
      fontSize: 11,
      color: 'var(--muted)',
      fontFamily: 'var(--mono)',
      padding: '6px 10px',
      background: 'var(--bg)',
      borderRadius: 6,
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
    }}>
      <span style={{ flexShrink: 0 }}>{label}</span>
      <span style={{
        color: color ?? (warn ? 'var(--danger)' : 'var(--text)'),
        textAlign: 'right',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  )
}

import type { CSSProperties } from 'react'

const inputStyle: CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '9px 12px',
  color: 'var(--text)',
  fontSize: 13.5,
  outline: 'none',
}

const qtyBtn: CSSProperties = {
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

const centerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
}
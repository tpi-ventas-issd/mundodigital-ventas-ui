import { api } from './api'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Cliente {
  idcliente: number
  nombre: string
  email: string
}

export interface Producto {
  idproducto: number
  nombre: string
  precio: number
  stockactual: number
  puntoreposicion: number
}

export interface DetalleVentaPayload {
  idproducto: number
  cantidad: number
  preciounitario: number
}

export interface RegistrarVentaPayload {
  idcliente: number
  detalles: DetalleVentaPayload[]
  idcupon?: string
}

export interface VentaRegistrada {
  idventa: number
  idcliente: number
  fecha: string
  total: number
  estado: 'Realizada' | 'Cancelada'
  detalles: Array<{
    iddetalle: number
    idproducto: number
    cantidad: number
    preciounitario: number
    subtotal: number
    producto: { nombre: string }
  }>
}

// ─── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_CLIENTES: Cliente[] = [
  { idcliente: 1, nombre: 'Ana García',      email: 'ana@mail.com'    },
  { idcliente: 2, nombre: 'Carlos López',    email: 'carlos@mail.com' },
  { idcliente: 3, nombre: 'María Fernández', email: 'maria@mail.com'  },
]

const MOCK_PRODUCTOS: Producto[] = [
  { idproducto: 1, nombre: 'Notebook Lenovo IdeaPad',    precio: 850000, stockactual: 12, puntoreposicion: 3 },
  { idproducto: 2, nombre: 'Monitor Samsung 24"',        precio: 320000, stockactual: 8,  puntoreposicion: 2 },
  { idproducto: 3, nombre: 'Teclado Mecánico Redragon',  precio: 95000,  stockactual: 0,  puntoreposicion: 5 },
  { idproducto: 4, nombre: 'Mouse Logitech MX Master',   precio: 72000,  stockactual: 20, puntoreposicion: 5 },
  { idproducto: 5, nombre: 'Auriculares Sony WH-1000',   precio: 215000, stockactual: 4,  puntoreposicion: 2 },
]

const MOCK_VENTAS: VentaRegistrada[] = []
let mockVentaId = 100

// ─── Service ───────────────────────────────────────────────────────────────────

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL

export const ventasService = {

  async getClientes(): Promise<Cliente[]> {
    if (USE_MOCK) return MOCK_CLIENTES
    const { data } = await api.get<Cliente[]>('/clientes')
    return data
  },

  async getCliente(id: number): Promise<Cliente> {
    if (USE_MOCK) {
      const c = MOCK_CLIENTES.find(c => c.idcliente === id)
      if (!c) throw new Error('Cliente no encontrado')
      return c
    }
    const { data } = await api.get<Cliente>(`/clientes/${id}`)
    return data
  },

  async getProductos(): Promise<Producto[]> {
    if (USE_MOCK) return MOCK_PRODUCTOS
    const { data } = await api.get<Producto[]>('/productos')
    return data
  },

  async verificarStock(idproducto: number, cantidad: number): Promise<boolean> {
    if (USE_MOCK) {
      const p = MOCK_PRODUCTOS.find(p => p.idproducto === idproducto)
      return (p?.stockactual ?? 0) >= cantidad
    }
    const { data } = await api.get<{ disponible: boolean }>(
      `/productos/${idproducto}/stock?cantidad=${cantidad}`
    )
    return data.disponible
  },

  async registrarVenta(payload: RegistrarVentaPayload): Promise<VentaRegistrada> {
    if (USE_MOCK) {
      for (const det of payload.detalles) {
        const prod = MOCK_PRODUCTOS.find(p => p.idproducto === det.idproducto)!
        if (prod.stockactual < det.cantidad)
          throw new Error(`Stock insuficiente para "${prod.nombre}"`)
        prod.stockactual -= det.cantidad
      }
      const venta: VentaRegistrada = {
        idventa: ++mockVentaId,
        idcliente: payload.idcliente,
        fecha: new Date().toISOString(),
        total: payload.detalles.reduce((sum, d) => sum + d.cantidad * d.preciounitario, 0),
        estado: 'Realizada',
        detalles: payload.detalles.map((d, i) => ({
          iddetalle: i + 1,
          idproducto: d.idproducto,
          cantidad: d.cantidad,
          preciounitario: d.preciounitario,
          subtotal: d.cantidad * d.preciounitario,
          producto: { nombre: MOCK_PRODUCTOS.find(p => p.idproducto === d.idproducto)!.nombre },
        })),
      }
      MOCK_VENTAS.unshift(venta)
      return venta
    }
    const { data } = await api.post<VentaRegistrada>('/ventas', payload)
    return data
  },

  async getVentas(): Promise<VentaRegistrada[]> {
    if (USE_MOCK) return MOCK_VENTAS
    const { data } = await api.get<VentaRegistrada[]>('/ventas')
    return data
  },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

export const formatPeso = (n: number) =>
 new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

//export const formatFecha = (iso: string) =>
  //new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))




export const formatFecha = (iso?: string) => {

  if (!iso) return '-'

  const fecha = new Date(iso)

  if (isNaN(fecha.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(fecha)

}
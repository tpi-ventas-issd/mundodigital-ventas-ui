import { api } from './api'

export interface AuthUser {
  token: string
  rol: 'SISTEMA' | 'ENCARGADO' | 'ADMIN'
  nombre: string
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const { data } = await api.post<AuthUser>('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('rol', data.rol)
    localStorage.setItem('nombre', data.nombre)
    return data
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('rol')
    localStorage.removeItem('nombre')
  },

  getToken: () => localStorage.getItem('token'),
  getRol: () => localStorage.getItem('rol') as AuthUser['rol'] | null,
  getNombre: () => localStorage.getItem('nombre') ?? 'Usuario',
  isAuthenticated: () => !!localStorage.getItem('token'),
}

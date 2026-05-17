import { Navigate } from 'react-router-dom'
import { authService } from '../services/auth'

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  console.log(localStorage.getItem('token'))

  return authService.isAuthenticated()
    ? <>{children}</>
    : <Navigate to="/login" replace />
}
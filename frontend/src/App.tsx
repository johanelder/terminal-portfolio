import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Shell from './components/Shell/Shell'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

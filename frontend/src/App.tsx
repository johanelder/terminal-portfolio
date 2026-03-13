import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Shell from './components/Shell/Shell'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

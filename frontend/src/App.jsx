import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import Issues from './pages/Issues'
import Sidebar from './components/Sidebar'

function PrivateLayout({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" />
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', background: '#f9fafb' }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
      <Route path="/issues" element={<PrivateLayout><Issues /></PrivateLayout>} />
    </Routes>
  )
}
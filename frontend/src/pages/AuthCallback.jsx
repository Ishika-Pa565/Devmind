import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')
    const existingToken = localStorage.getItem('token')
    console.log('AuthCallback', {
      href: window.location.href,
      hasToken: Boolean(token),
      tokenLen: token ? token.length : 0,
      error,
      hasExistingToken: Boolean(existingToken),
    })
    if (token) {
      localStorage.setItem('token', token)
      navigate('/', { replace: true })
      return
    }

    // In dev, effects can run more than once; if we already stored a token,
    // always continue to the app instead of bouncing back to /login.
    if (existingToken) {
      navigate('/', { replace: true })
      return
    } else {
      if (error) {
        navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }
  }, [])
  return <p style={{ padding:'2rem' }}>Signing you in...</p>
}
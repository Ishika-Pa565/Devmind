export default function Login() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const error = new URLSearchParams(window.location.search).get('error')

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:'1rem' }}>
      <h1 style={{ fontSize:'2rem', fontWeight:600 }}>DevMind</h1>
      <p style={{ color:'#6b7280' }}>Agentic bug triage for your GitHub repos</p>
      {error && (
        <p style={{ color:'#b91c1c', maxWidth: 520, textAlign:'center' }}>
          {error}
        </p>
      )}
      <a href={`${apiUrl}/auth/github?redirect=${encodeURIComponent(window.location.origin)}`}
        style={{ padding:'0.75rem 1.5rem', background:'#1f2937', color:'#fff', borderRadius:'8px', textDecoration:'none', fontWeight:500 }}>
        Sign in with GitHub
      </a>
    </div>
  )
}
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/issues', label: 'Issues' },
]

export default function Sidebar() {
  return (
    <nav style={{ width:'220px', background:'#1f2937', color:'#fff', padding:'1.5rem 1rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
      <p style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:'1rem', paddingLeft:'0.5rem' }}>DevMind</p>
      {links.map(l => (
        <NavLink key={l.to} to={l.to} end
          style={({ isActive }) => ({
            padding:'0.5rem 0.75rem', borderRadius:'6px', textDecoration:'none',
            color: isActive ? '#fff' : '#9ca3af',
            background: isActive ? '#374151' : 'transparent',
            fontWeight: isActive ? 500 : 400
          })}>
          {l.label}
        </NavLink>
      ))}
      <div style={{ marginTop:'auto' }}>
        <button onClick={() => { localStorage.removeItem('token'); window.location.href='/login' }}
          style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', padding:'0.5rem' }}>
          Sign out
        </button>
      </div>
    </nav>
  )
}
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io('http://localhost:4000')

const severityColors = {
  critical: '#991b1b', high: '#92400e', medium: '#1e40af', low: '#166534'
}

export default function Dashboard() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    socket.on('new_issue', (data) => {
      setEvents(prev => [{
        type: 'new', time: new Date().toLocaleTimeString(),
        message: `New issue: "${data.title}"`, repo: data.repo
      }, ...prev].slice(0, 30))
    })

    socket.on('issue_triaged', (data) => {
      setEvents(prev => [{
        type: 'triaged', time: new Date().toLocaleTimeString(),
        message: `Triaged: "${data.title}"`,
        severity: data.severity,
        component: data.component,
        isDuplicate: data.isDuplicate,
        repo: data.repo
      }, ...prev].slice(0, 30))
    })

    return () => {
      socket.off('new_issue')
      socket.off('issue_triaged')
    }
  }, [])

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>Live agent feed</h2>
      <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Real-time activity from all agents</p>

      {events.length === 0 && (
        <div style={{ background: '#f9fafb', border: '1px dashed #e5e7eb', borderRadius: '10px', padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
          Waiting for GitHub issues... Create one on your repo to see agents in action.
        </div>
      )}

      {events.map((e, i) => (
        <div key={i} style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
          padding: '0.875rem 1.25rem', marginBottom: '0.5rem',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: e.type === 'triaged'
              ? (severityColors[e.severity] || '#6b7280')
              : '#9ca3af'
          }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>{e.message}</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
              {e.repo}
              {e.severity && ` · ${e.severity}`}
              {e.component && ` · ${e.component}`}
              {e.isDuplicate && ' · ⚠️ duplicate'}
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#d1d5db', flexShrink: 0 }}>{e.time}</span>
        </div>
      ))}
    </div>
  )
}
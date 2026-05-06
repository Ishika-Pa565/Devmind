import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'

const socket = io('http://localhost:4000')

const api = axios.create({ baseURL: 'http://localhost:4000' })
api.interceptors.request.use(cfg => {
  cfg.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
  return cfg
})

const severityColors = {
  critical: { bg: '#fee2e2', text: '#991b1b' },
  high:     { bg: '#fef3c7', text: '#92400e' },
  medium:   { bg: '#dbeafe', text: '#1e40af' },
  low:      { bg: '#f0fdf4', text: '#166534' },
}

const componentColors = {
  auth: '#EEEDFE', ui: '#E1F5EE', api: '#FAEEDA',
  database: '#FAECE7', performance: '#E6F1FB',
  security: '#FCEBEB', infra: '#F1EFE8', other: '#F3F4F6',
}

export default function Issues() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: () => api.get('/api/issues').then(r => r.data),
    refetchInterval: 10000,
  })

  useEffect(() => {
    socket.on('issue_triaged', () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
    })
    socket.on('new_issue', () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
    })
    return () => {
      socket.off('issue_triaged')
      socket.off('new_issue')
    }
  }, [queryClient])

  if (isLoading) return <p style={{ padding: '2rem' }}>Loading issues...</p>

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Issues</h2>
      {data?.length === 0 && (
        <p style={{ color: '#9ca3af' }}>No issues yet. Create one on your GitHub repo!</p>
      )}
      {data?.map(issue => {
        const sev = severityColors[issue.severity]
        return (
          <div key={issue.id} style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: '10px', padding: '1rem 1.25rem',
            marginBottom: '0.75rem',
            borderLeft: sev ? `4px solid ${sev.text}` : '4px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 500, margin: 0 }}>{issue.title}</p>
                  {issue.is_duplicate && (
                    <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '20px', fontWeight: 500 }}>
                      duplicate
                    </span>
                  )}
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '4px 0 0' }}>
                  {issue.repo_full_name}
                </p>
                {issue.severity && (
                  <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: '6px 0 0', fontStyle: 'italic' }}>
                    {issue.reasoning || ''}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
                {issue.severity ? (
                  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: sev?.bg, color: sev?.text, fontWeight: 500 }}>
                    {issue.severity}
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#f3f4f6', color: '#6b7280' }}>
                    triaging...
                  </span>
                )}
                {issue.component_tag && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: componentColors[issue.component_tag] || '#f3f4f6', color: '#374151', fontWeight: 500 }}>
                    {issue.component_tag}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
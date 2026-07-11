import { useState, useEffect } from 'react'

type Domain = {
  id: string
  name: string
  cloudflareZoneId: string | null
  wildcardConfigured: boolean
  _count: { links: number }
}

type CfZone = { id: string; name: string }

export function DomainsPage({ token }: { token: string }) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [zones, setZones] = useState<CfZone[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [loadingZones, setLoadingZones] = useState(false)
  const [error, setError] = useState('')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const loadDomains = () => fetch('/api/domains', { headers }).then(r => r.json()).then(setDomains)

  useEffect(() => { loadDomains() }, [])

  const fetchZones = async () => {
    setLoadingZones(true)
    try {
      const res = await fetch('/api/cloudflare-zones', { headers })
      if (res.ok) setZones(await res.json())
    } catch {}
    setLoadingZones(false)
  }

  const handleOpenForm = () => {
    setShowForm(true)
    fetchZones()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const body: any = { name: name.trim().toLowerCase() }
    if (selectedZoneId) body.cloudflareZoneId = selectedZoneId

    const res = await fetch('/api/domains', { method: 'POST', headers, body: JSON.stringify(body) })
    if (!res.ok) {
      const err = await res.json()
      setError(err.cfError || err.error || 'Error al crear dominio')
      return
    }

    const result = await res.json()
    if (result.domain) {
      setDomains(prev => [...prev, result.domain])
    } else {
      setDomains(prev => [...prev, result])
    }
    setName('')
    setSelectedZoneId('')
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este dominio y todos sus links?')) return
    await fetch(`/api/domains/${id}`, { method: 'DELETE', headers })
    setDomains(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dominios</h2>
        <button
          onClick={handleOpenForm}
          className="px-3 py-1.5 text-sm border border-accent/30 text-accent rounded hover:bg-accent/10 transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Dominio'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded p-4 space-y-3 animate-in">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ej: upfunnel.click"
            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            autoFocus
          />

          <div>
            <select
              value={selectedZoneId}
              onChange={e => setSelectedZoneId(e.target.value)}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              <option value="">Solo en DB (sin Cloudflare)</option>
              {loadingZones && <option disabled>Cargando zonas...</option>}
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">
              Si seleccionás una zona, se configura DNS wildcard + Worker Route automáticamente.
            </p>
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          <button type="submit" className="px-4 py-1.5 text-sm bg-accent/10 text-accent border border-accent/30 rounded hover:bg-accent/20 transition-colors">
            Crear
          </button>
        </form>
      )}

      {domains.length === 0 ? (
        <p className="text-muted text-sm">No hay dominios registrados.</p>
      ) : (
        <div className="space-y-2">
          {domains.map(d => (
            <div key={d.id} className="bg-surface border border-border rounded px-4 py-3 flex items-center justify-between animate-in">
              <div>
                <span className="text-text font-medium">{d.name}</span>
                <span className="text-muted text-xs ml-2">
                  {d._count.links} links · {d.wildcardConfigured ? '✓ cloudflare configurado' : '○ solo DB'}
                </span>
              </div>
              <button
                onClick={() => handleDelete(d.id)}
                className="text-xs text-muted hover:text-danger transition-colors"
              >
                eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'

type Domain = { id: string; name: string }
type Link = {
  id: string
  subdomain: string
  destinationUrl: string
  active: boolean
  clicks: number
  createdAt: string
  domain: Domain
  domainId: string
}

export function LinksPage({ token }: { token: string }) {
  const [links, setLinks] = useState<Link[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [showForm, setShowForm] = useState(false)
  const [domainId, setDomainId] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchLinks = () => fetch('/api/links', { headers }).then(r => r.json()).then(setLinks)

  useEffect(() => {
    fetchLinks()
    fetch('/api/domains', { headers }).then(r => r.json()).then(setDomains)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/links', {
      method: 'POST',
      headers,
      body: JSON.stringify({ domainId, subdomain: subdomain.trim().toLowerCase(), destinationUrl: destinationUrl.trim() }),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || err.kvError || 'Error al crear link')
      return
    }

    await fetchLinks()
    setSubdomain('')
    setDestinationUrl('')
    setShowForm(false)
  }

  const handleToggle = async (link: Link) => {
    await fetch(`/api/links/${link.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ active: !link.active }),
    })
    await fetchLinks()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este link?')) return
    await fetch(`/api/links/${id}`, { method: 'DELETE', headers })
    await fetchLinks()
  }

  const copyToClipboard = (link: Link) => {
    const url = `https://${link.subdomain}.${link.domain.name}`
    navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(''), 2000)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Links</h2>
        <div className="flex gap-2">
          <a
            href={`/api/links/export`}
            onClick={e => { e.preventDefault(); fetch('/api/links/export', { headers }).then(r => r.blob()).then(b => { const url = URL.createObjectURL(b); const a = document.createElement('a'); a.href = url; a.download = 'redirect-links.csv'; a.click(); URL.revokeObjectURL(url) }) }}
            className="px-3 py-1.5 text-xs border border-border text-muted rounded hover:text-text transition-colors"
          >
            Export CSV
          </a>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 text-sm border border-accent/30 text-accent rounded hover:bg-accent/10 transition-colors"
          >
            {showForm ? 'Cancelar' : '+ Link'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded p-4 space-y-3 animate-in">
          <select
            value={domainId}
            onChange={e => setDomainId(e.target.value)}
            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            required
          >
            <option value="">Seleccionar dominio</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={subdomain}
              onChange={e => setSubdomain(e.target.value)}
              placeholder="subdominio"
              className="flex-1 bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
              required
            />
            <span className="text-muted text-xs">.{domains.find(d => d.id === domainId)?.name || 'dominio'}</span>
          </div>

          <input
            type="url"
            value={destinationUrl}
            onChange={e => setDestinationUrl(e.target.value)}
            placeholder="https://destino.com"
            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
            required
          />

          {error && <p className="text-danger text-xs">{error}</p>}

          <button type="submit" className="px-4 py-1.5 text-sm bg-accent/10 text-accent border border-accent/30 rounded hover:bg-accent/20 transition-colors">
            Crear Link
          </button>
        </form>
      )}

      {links.length === 0 ? (
        <p className="text-muted text-sm">No hay links. Creá el primero.</p>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_100px_80px_80px] gap-2 px-4 py-2 text-xs text-muted uppercase tracking-wider">
            <span>Link</span>
            <span>Destino</span>
            <span className="text-center">Clicks</span>
            <span className="text-center">Estado</span>
            <span></span>
          </div>

          {links.map(l => (
            <div
              key={l.id}
              className="grid grid-cols-[1fr_1fr_100px_80px_80px] gap-2 items-center bg-surface border border-border rounded px-4 py-2.5 animate-in group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm truncate">{l.subdomain}.{l.domain.name}</span>
                <button
                  onClick={() => copyToClipboard(l)}
                  className="text-xs text-muted hover:text-accent shrink-0 transition-colors"
                  title="Copiar URL"
                >
                  {copiedId === l.id ? '✓' : '⎘'}
                </button>
              </div>

              <span className="text-sm text-muted truncate">{l.destinationUrl}</span>

              <span className="text-sm text-center text-muted">{l.clicks.toLocaleString()}</span>

              <div className="flex justify-center">
                <button
                  onClick={() => handleToggle(l)}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    l.active
                      ? 'text-accent border-accent/30 bg-accent/5'
                      : 'text-muted border-border'
                  }`}
                >
                  {l.active ? 'on' : 'off'}
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <span className="text-xs text-muted">{formatDate(l.createdAt)}</span>
                <button
                  onClick={() => handleDelete(l.id)}
                  className="text-xs text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
    await fetch(`/api/links/${link.id}`, { method: 'PATCH', headers, body: JSON.stringify({ active: !link.active }) })
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Links</h2>
        <div className="flex gap-3">
          <a
            href={`/api/links/export`}
            onClick={e => {
              e.preventDefault()
              fetch('/api/links/export', { headers })
                .then(r => r.blob())
                .then(b => {
                  const url = URL.createObjectURL(b)
                  const a = document.createElement('a')
                  a.href = url; a.download = 'redirect-links.csv'; a.click()
                  URL.revokeObjectURL(url)
                })
            }}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-muted uf-border hover:text-text transition-colors"
          >
            Export CSV
          </a>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-accent bg-accent/10 uf-border hover:bg-accent/20 uf-glow transition-all"
          >
            {showForm ? 'Cancelar' : '+ Link'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface uf-border rounded-lg p-5 space-y-4 animate-in">
          <select
            value={domainId}
            onChange={e => setDomainId(e.target.value)}
            className="w-full bg-bg uf-border rounded-lg px-4 py-3 text-sm font-medium text-text focus:outline-none focus:border-accent transition-colors"
            required
          >
            <option value="">Seleccionar dominio</option>
            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={subdomain}
              onChange={e => setSubdomain(e.target.value)}
              placeholder="subdominio"
              className="flex-1 bg-bg uf-border rounded-lg px-4 py-3 text-sm font-medium text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
              required
            />
            <span className="text-muted text-xs font-medium shrink-0">.{domains.find(d => d.id === domainId)?.name || 'dominio'}</span>
          </div>

          <input
            type="url"
            value={destinationUrl}
            onChange={e => setDestinationUrl(e.target.value)}
            placeholder="https://destino.com"
            className="w-full bg-bg uf-border rounded-lg px-4 py-3 text-sm font-medium text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
            required
          />

          {error && <p className="text-danger text-xs font-medium">{error}</p>}

          <button type="submit" className="px-5 py-2.5 text-sm font-bold rounded-lg bg-accent text-bg hover:bg-[#00CCE0] transition-colors">
            Crear Link
          </button>
        </form>
      )}

      {/* Grid */}
      {links.length === 0 ? (
        <p className="text-muted text-sm font-medium">No hay links. Creá el primero.</p>
      ) : (
        <div className="space-y-1">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_100px_80px_80px] gap-3 px-5 py-3 text-[10px] text-muted font-bold uppercase tracking-widest">
            <span>Link</span>
            <span>Destino</span>
            <span className="text-center">Clicks</span>
            <span className="text-center">Estado</span>
            <span></span>
          </div>

          {links.map(l => (
            <div
              key={l.id}
              className="grid grid-cols-[1fr_1fr_100px_80px_80px] gap-3 items-center bg-surface uf-border rounded-lg px-5 py-3.5 animate-in group hover:border-accent/20 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold truncate">{l.subdomain}.{l.domain.name}</span>
                <button
                  onClick={() => copyToClipboard(l)}
                  className="text-xs text-muted hover:text-accent shrink-0 transition-colors"
                  title="Copiar URL"
                >
                  {copiedId === l.id ? (
                    <span className="text-accent font-bold">✓</span>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  )}
                </button>
              </div>

              <span className="text-sm text-muted truncate font-medium">{l.destinationUrl}</span>

              <span className="text-sm text-muted font-semibold text-center">{l.clicks.toLocaleString()}</span>

              <div className="flex justify-center">
                <button
                  onClick={() => handleToggle(l)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition-all ${
                    l.active
                      ? 'text-accent border-accent/30 bg-accent/5 uf-glow'
                      : 'text-muted border-border/50'
                  }`}
                >
                  {l.active ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3">
                <span className="text-[11px] font-medium text-muted">{formatDate(l.createdAt)}</span>
                <button
                  onClick={() => handleDelete(l.id)}
                  className="text-xs text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

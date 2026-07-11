import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import { LinkStats, StatsChart } from '../components/LinkStats'

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
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [domainId, setDomainId] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSubdomain, setEditSubdomain] = useState('')
  const [editDest, setEditDest] = useState('')

  const [page, setPage] = useState(1)
  const perPage = 20

  // Stats state per row
  const [statsOpen, setStatsOpen] = useState<string | null>(null)
  const [statsData, setStatsData] = useState<Record<string, { date: string; clicks: number }[]>>({})
  const [statsLoading, setStatsLoading] = useState<Record<string, boolean>>({})

  const { toast } = useToast()
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const fetchLinks = () => fetch('/api/links', { headers }).then(r => r.json()).then(setLinks)

  useEffect(() => {
    fetchLinks()
    fetch('/api/domains', { headers }).then(r => r.json()).then(setDomains)
  }, [])

  // ── Create ──────────────────────────────────────────────
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
      const msg = err.error || err.kvError || 'Error al crear link'
      setError(msg)
      toast('error', msg)
      return
    }
    await fetchLinks()
    setSubdomain('')
    setDestinationUrl('')
    setShowForm(false)
    toast('success', 'Link creado correctamente')
  }

  // ── Edit ────────────────────────────────────────────────
  const startEdit = (l: Link) => {
    setEditingId(l.id)
    setEditSubdomain(l.subdomain)
    setEditDest(l.destinationUrl)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditSubdomain('')
    setEditDest('')
    setError('')
  }

  const handleUpdate = async (id: string) => {
    const res = await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ subdomain: editSubdomain.trim().toLowerCase(), destinationUrl: editDest.trim() }),
    })
    if (!res.ok) {
      const msg = 'Error al actualizar'
      setError(msg)
      toast('error', msg)
      return
    }
    await fetchLinks()
    cancelEdit()
    toast('success', 'Link actualizado')
  }

  // ── Toggle / Delete / Copy ──────────────────────────────
  const handleToggle = async (link: Link) => {
    await fetch(`/api/links/${link.id}`, { method: 'PATCH', headers, body: JSON.stringify({ active: !link.active }) })
    await fetchLinks()
    toast('info', `Link ${link.active ? 'desactivado' : 'activado'}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este link?')) return
    await fetch(`/api/links/${id}`, { method: 'DELETE', headers })
    await fetchLinks()
    toast('success', 'Link eliminado')
  }

  const copyToClipboard = (link: Link) => {
    const url = `https://${link.subdomain}.${link.domain.name}`
    navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(''), 2000)
    toast('success', 'URL copiada al portapapeles')
  }

  // ── Stats ───────────────────────────────────────────────
  const toggleStats = async (linkId: string) => {
    if (statsOpen === linkId) { setStatsOpen(null); return }
    setStatsOpen(linkId)
    if (statsData[linkId]) return
    setStatsLoading(prev => ({ ...prev, [linkId]: true }))
    try {
      const res = await fetch(`/api/links/${linkId}/stats`, { headers })
      if (res.ok) {
        const data = await res.json()
        setStatsData(prev => ({ ...prev, [linkId]: data.clicksByDay }))
      }
    } catch {}
    setStatsLoading(prev => ({ ...prev, [linkId]: false }))
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })

  // ── Search filter ───────────────────────────────────────
  const q = search.toLowerCase()
  const filtered = links.filter(l =>
    l.subdomain.toLowerCase().includes(q) ||
    l.destinationUrl.toLowerCase().includes(q) ||
    l.domain.name.toLowerCase().includes(q)
  )

  // ── Pagination ──────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))

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
              fetch('/api/links/export', { headers }).then(r => r.blob()).then(b => {
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

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar por subdominio o URL..."
          className="w-full bg-surface uf-border rounded-lg pl-10 pr-4 py-3 text-sm font-medium text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Create form */}
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
      {paginated.length === 0 ? (
        <p className="text-muted text-sm font-medium">{search ? 'Sin resultados.' : 'No hay links. Creá el primero.'}</p>
      ) : (
        <div className="space-y-1">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_100px_80px_120px] gap-3 px-5 py-3 text-[10px] text-muted font-bold uppercase tracking-widest">
            <span>Link</span>
            <span>Destino</span>
            <span className="text-center">Clicks</span>
            <span className="text-center">Estado</span>
            <span className="text-right">Acciones</span>
          </div>

          {filtered.map(l => (
            <div key={l.id} className="bg-surface uf-border rounded-lg overflow-hidden animate-in group">
              {/* Edit mode */}
              {editingId === l.id ? (
                <div className="p-4 space-y-3">
                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={editSubdomain}
                      onChange={e => setEditSubdomain(e.target.value)}
                      className="flex-1 bg-bg uf-border rounded-lg px-3 py-2 text-sm font-medium text-text focus:outline-none focus:border-accent"
                      autoFocus
                    />
                    <span className="text-muted text-xs font-medium">.{l.domain.name}</span>
                  </div>
                  <input
                    type="url"
                    value={editDest}
                    onChange={e => setEditDest(e.target.value)}
                    className="w-full bg-bg uf-border rounded-lg px-3 py-2 text-sm font-medium text-text focus:outline-none focus:border-accent"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted uf-border hover:text-text transition-colors">Cancelar</button>
                    <button onClick={() => handleUpdate(l.id)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-accent text-bg hover:bg-[#00CCE0] transition-colors">Guardar</button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div>
                  <div className="px-5 py-3.5">
                    <div className="grid grid-cols-[1fr_1fr_100px_80px_120px] gap-3 items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold truncate">{l.subdomain}.{l.domain.name}</span>
                        <button
                          onClick={() => copyToClipboard(l)}
                          className="text-xs text-muted hover:text-accent shrink-0 transition-colors"
                          title="Copiar URL"
                        >
                          {copiedId === l.id ? (
                            <span className="text-accent font-bold">&#10003;</span>
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

                      <div className="flex items-center justify-end gap-2">
                        <LinkStats
                          linkId={l.id}
                          token={token}
                          expanded={statsOpen === l.id}
                          onToggle={() => toggleStats(l.id)}
                          stats={statsData[l.id] || null}
                          loading={statsLoading[l.id] || false}
                        />
                        <button
                          onClick={() => startEdit(l)}
                          className="text-xs text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
                          title="Editar"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          </svg>
                        </button>
                        <span className="text-[11px] font-medium text-muted">{formatDate(l.createdAt)}</span>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="text-xs text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                          title="Eliminar"
                        >
                          &#10005;
                        </button>
                      </div>
                    </div>
                  </div>

                  {statsOpen === l.id && (
                    <div className="px-5 pb-4">
                      <StatsChart stats={statsData[l.id] || null} loading={statsLoading[l.id] || false} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > perPage && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted uf-border disabled:opacity-30 hover:text-text transition-colors"
          >
            « Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1">
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted text-xs">...</span>}
                <button
                  onClick={() => goToPage(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    p === currentPage
                      ? 'bg-accent/10 text-accent uf-glow'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted uf-border disabled:opacity-30 hover:text-text transition-colors"
          >
            Siguiente »
          </button>
        </div>
      )}

      <p className="text-center text-[11px] text-muted font-medium">
        Mostrando {paginated.length} de {filtered.length} links
      </p>
    </div>
  )
}

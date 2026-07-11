import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'

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

  const { toast } = useToast()
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
      const msg = err.cfError || err.error || 'Error al crear dominio'
      setError(msg)
      toast('error', msg)
      return
    }

    const result = await res.json()
    if (result.domain) setDomains(prev => [...prev, result.domain])
    else setDomains(prev => [...prev, result])

    setName('')
    setSelectedZoneId('')
    setShowForm(false)
    toast('success', 'Dominio creado')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este dominio y todos sus links?')) return
    await fetch(`/api/domains/${id}`, { method: 'DELETE', headers })
    setDomains(prev => prev.filter(d => d.id !== id))
    toast('success', 'Dominio eliminado')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Dominios</h2>
        <button
          onClick={handleOpenForm}
          className="px-4 py-2 text-sm font-semibold rounded-lg text-accent bg-accent/10 uf-border hover:bg-accent/20 uf-glow transition-all"
        >
          {showForm ? 'Cancelar' : '+ Dominio'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface uf-border rounded-lg p-5 space-y-4 animate-in">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ej: upfunnel.click"
            className="w-full bg-bg uf-border rounded-lg px-4 py-3 text-sm font-medium text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
            autoFocus
          />

          <div>
            <select
              value={selectedZoneId}
              onChange={e => setSelectedZoneId(e.target.value)}
              className="w-full bg-bg uf-border rounded-lg px-4 py-3 text-sm font-medium text-text focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">Solo en DB (sin Cloudflare)</option>
              {loadingZones && <option disabled>Cargando zonas...</option>}
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <p className="text-xs text-muted mt-1.5 font-medium">
              Si seleccionás una zona, se configura DNS wildcard + Worker Route automáticamente.
            </p>
          </div>

          {error && <p className="text-danger text-xs font-medium">{error}</p>}

          <button type="submit" className="px-5 py-2.5 text-sm font-bold rounded-lg bg-accent text-bg hover:bg-[#00CCE0] transition-colors">
            Crear Dominio
          </button>
        </form>
      )}

      {domains.length === 0 ? (
        <p className="text-muted text-sm font-medium">No hay dominios registrados.</p>
      ) : (
        <div className="space-y-2">
          {domains.map(d => (
            <div key={d.id} className="bg-surface uf-border rounded-lg px-5 py-4 flex items-center justify-between animate-in">
              <div>
                <span className="text-text font-semibold">{d.name}</span>
                <span className="text-muted text-xs font-medium ml-3">
                  {d._count.links} links · {d.wildcardConfigured ? '✓ cloudflare configurado' : '○ solo DB'}
                </span>
              </div>
              <button
                onClick={() => handleDelete(d.id)}
                className="text-xs font-medium text-muted hover:text-danger transition-colors"
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

import { useState } from 'react'

export function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return
    // Validate by hitting the API
    fetch('/api/domains', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.ok) {
          localStorage.setItem('rl_token', token)
          onLogin(token)
        } else {
          setError('Token inválido')
        }
      })
      .catch(() => setError('Error de conexión'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-8 animate-in">
        <div className="text-center mb-6">
          <h1 className="text-accent font-bold text-xl tracking-wide">⌘ Redirect Link</h1>
          <p className="text-muted text-sm mt-1">Gestión de redirecciones</p>
        </div>

        <input
          type="password"
          value={token}
          onChange={e => { setToken(e.target.value); setError('') }}
          placeholder="API Token"
          className="w-full bg-surface border border-border rounded px-4 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          autoFocus
        />

        {error && <p className="text-danger text-xs">{error}</p>}

        <button
          type="submit"
          className="w-full bg-accent/10 text-accent border border-accent/30 rounded px-4 py-2.5 text-sm font-medium hover:bg-accent/20 transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}

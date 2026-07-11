import { useState } from 'react'

export function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) return
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
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 p-8 animate-in">
        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full uf-glow flex items-center justify-center mx-auto mb-4" style={{background: 'rgba(0, 229, 255, 0.1)'}}>
            <span className="text-accent font-extrabold text-lg">U</span>
          </div>
          <h1 className="text-text font-bold text-xl tracking-tight">Redirect Link</h1>
          <p className="text-muted text-sm mt-1.5 font-medium">Gestión de redirecciones</p>
        </div>

        <input
          type="password"
          value={token}
          onChange={e => { setToken(e.target.value); setError('') }}
          placeholder="API Token"
          className="w-full bg-surface uf-border rounded-lg px-4 py-3 text-sm font-medium text-text placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
          autoFocus
        />

        {error && <p className="text-danger text-xs font-medium text-center">{error}</p>}

        <button
          type="submit"
          className="w-full bg-accent/10 text-accent font-bold uf-border rounded-lg px-4 py-3 text-sm hover:bg-accent/20 uf-glow transition-all"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}

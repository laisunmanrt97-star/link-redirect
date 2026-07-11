import { useState } from 'react'
import { LinksPage } from './pages/LinksPage'
import { DomainsPage } from './pages/DomainsPage'
import { LoginPage } from './pages/LoginPage'

type Page = 'links' | 'domains'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('rl_token') || '')
  const [page, setPage] = useState<Page>('links')

  if (!token) return <LoginPage onLogin={setToken} />

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-accent font-bold text-lg tracking-wide">⌘ Redirect Link</h1>
          <nav className="flex gap-1">
            <button
              onClick={() => setPage('links')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                page === 'links' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-text'
              }`}
            >
              Links
            </button>
            <button
              onClick={() => setPage('domains')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                page === 'domains' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-text'
              }`}
            >
              Dominios
            </button>
          </nav>
        </div>
        <button
          onClick={() => { localStorage.removeItem('rl_token'); setToken('') }}
          className="text-xs text-muted hover:text-danger transition-colors"
        >
          salir
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 animate-in">
        {page === 'links' ? <LinksPage token={token} /> : <DomainsPage token={token} />}
      </main>
    </div>
  )
}

export default App

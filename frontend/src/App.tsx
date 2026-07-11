import { useState } from 'react'
import { LinksPage } from './pages/LinksPage'
import { DomainsPage } from './pages/DomainsPage'
import { LoginPage } from './pages/LoginPage'
import { ParticlesBackground } from './components/ParticlesBackground'

type Page = 'links' | 'domains'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('rl_token') || '')
  const [page, setPage] = useState<Page>('links')

  if (!token) return (
    <>
      <ParticlesBackground />
      <LoginPage onLogin={setToken} />
    </>
  )

  return (
    <div className="min-h-screen bg-bg relative">
      <ParticlesBackground />
      {/* Header */}
      <header className="uf-border px-6 py-4 flex items-center justify-between relative" style={{zIndex: 10, borderBottomWidth: 1}}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full uf-glow flex items-center justify-center" style={{background: 'rgba(0, 229, 255, 0.1)'}}>
              <span className="text-accent font-extrabold text-sm">U</span>
            </div>
            <div>
              <h1 className="text-text font-bold text-base tracking-tight">Redirect Link</h1>
              <p className="text-muted text-[10px] font-medium tracking-wider uppercase">by UpFunnel</p>
            </div>
          </div>
          <nav className="flex gap-1">
            <button
              onClick={() => setPage('links')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                page === 'links'
                  ? 'bg-accent/10 text-accent uf-glow'
                  : 'text-muted hover:text-text'
              }`}
            >
              Links
            </button>
            <button
              onClick={() => setPage('domains')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                page === 'domains'
                  ? 'bg-accent/10 text-accent uf-glow'
                  : 'text-muted hover:text-text'
              }`}
            >
              Dominios
            </button>
          </nav>
        </div>
        <button
          onClick={() => { localStorage.removeItem('rl_token'); setToken('') }}
          className="text-xs font-medium text-muted hover:text-danger transition-colors"
        >
          salir
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 animate-in relative" style={{zIndex: 10}}>
        {page === 'links' ? <LinksPage token={token} /> : <DomainsPage token={token} />}
      </main>
    </div>
  )
}

export default App

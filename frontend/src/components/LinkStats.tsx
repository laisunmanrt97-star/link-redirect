type DailyStat = { date: string; clicks: number }

export function LinkStats({ onToggle }: { linkId: string; token: string; expanded: boolean; onToggle: () => void; stats: DailyStat[] | null; loading: boolean }) {
  return (
    <button
      onClick={onToggle}
      className="text-xs text-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
      title="Ver estadísticas"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    </button>
  )
}

export function StatsChart({ stats, loading }: { stats: DailyStat[] | null; loading: boolean }) {
  const max = stats ? Math.max(...stats.map(s => s.clicks), 1) : 1

  return (
    <div className="animate-in pt-3">
      {loading ? (
        <p className="text-muted text-xs font-medium text-center">Cargando...</p>
      ) : stats ? (
        <div className="flex items-end gap-2 h-20">
          {stats.map(s => {
            const h = max > 0 ? (s.clicks / max) * 100 : 0
            return (
              <div key={s.date} className="flex-1 flex flex-col items-center gap-1.5 group/bar">
                <div
                  className="w-full rounded-t-sm transition-all relative"
                  style={{
                    height: `${Math.max(h, 3)}%`,
                    background: s.clicks > 0
                      ? `linear-gradient(to top, rgba(0,229,255,0.3), rgba(0,229,255,0.9))`
                      : 'rgba(148,163,184,0.1)',
                  }}
                >
                  {s.clicks > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-accent font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                      {s.clicks} click{s.clicks !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-muted font-medium">{s.date.slice(5)}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-muted text-xs font-medium text-center">Error al cargar stats</p>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTheme, setTheme } from '../lib/theme'
import AuthModal from './AuthModal'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [theme, setThemeState] = useState(getTheme())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  const links = [
    { to: '/', label: 'الرئيسية' },
    { to: '/podcasts', label: 'اعرف أكثر' },
  ]

  const handleSearch = async (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      await navigate(`/episodes?q=${encodeURIComponent(searchVal.trim())}`)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40" style={{ background: 'var(--bg-player)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between gap-4 h-20">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 overflow-hidden rounded-xl">
              <img src="/logo.png" alt="شعار الموقع" className="w-full h-full object-contain" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-sm md:text-base">
            {links.map(l => (
              <Link key={l.to} to={l.to} className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}>{l.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                className="input-field w-48"
                placeholder="ابحث عن حلقة..."
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
              />
              <button type="submit" className="flex items-center justify-center gap-2 px-3 h-11 rounded-xl transition-colors hover:bg-white/5" style={{ border: '1px solid var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg-card)' }} title="بحث">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <span className="hidden sm:inline text-sm font-semibold">بحث</span>
              </button>
            </form>
            <button onClick={toggleTheme} className="w-11 h-11 rounded-xl transition-colors hover:bg-white/5" style={{ border: '1px solid var(--border)', color: 'var(--text-2)', backgroundColor: 'var(--bg-card)' }} title={theme === 'dark' ? 'انتقل للوضع الفاتح' : 'انتقل للوضع الداكن'}>
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v2"/>
                  <path d="M12 19v2"/>
                  <path d="M4.22 4.22l1.42 1.42"/>
                  <path d="M18.36 18.36l1.42 1.42"/>
                  <path d="M1 12h2"/>
                  <path d="M21 12h2"/>
                  <path d="M4.22 19.78l1.42-1.42"/>
                  <path d="M18.36 5.64l1.42-1.42"/>
                  <circle cx="12" cy="12" r="5"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
                </svg>
              )}
            </button>
            {!user && (
              <button onClick={() => setShowAuth(true)} className="btn-primary px-5 py-2 text-sm">الدخول</button>
            )}
            <Link to="/admin" className="btn-ghost px-5 py-2 text-sm bg-slate-950 text-white border-transparent hover:bg-slate-900">لوحة التحكم</Link>
            {user && (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: 'var(--primary)' }}>
                  {user.email?.[0].toUpperCase()}
                </button>
                {showUserMenu && (
                  <div className="absolute top-12 left-0 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[180px] animate-scale-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-1)' }}>{user.email}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors" style={{ color: 'var(--text-2)' }} onClick={() => setShowUserMenu(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                      ملفي الشخصي
                    </Link>
                    <Link to="/favorites" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors" style={{ color: 'var(--text-2)' }} onClick={() => setShowUserMenu(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      المفضلة
                    </Link>
                    <Link to="/history" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors" style={{ color: 'var(--text-2)' }} onClick={() => setShowUserMenu(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
                      سجل الاستماع
                    </Link>
                    <div style={{ borderTop: '1px solid var(--border)' }} />
                    <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors" style={{ color: 'var(--text-2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-6h2v6zm0-8h-2V7h2v4z"/></svg>
                      المساعدة
                    </button>
                    <button onClick={() => { signOut(); setShowUserMenu(false) }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-500/10 transition-colors text-red-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed top-14 left-0 right-0 bottom-0 p-4" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
            <nav className="space-y-2">
              {links.map(l => (
                <Link key={l.to} to={l.to} className={`block py-3 px-4 rounded-lg ${location.pathname === l.to ? 'bg-white/10' : 'hover:bg-white/5'}`} onClick={() => setMobileMenuOpen(false)}>
                  {l.label}
                </Link>
              ))}
              <Link to="/favorites" className="block py-3 px-4 rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>المفضلة</Link>
              <Link to="/admin" className="block py-3 px-4 rounded-lg hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>لوحة التحكم</Link>
            </nav>

            {/* Mobile Search */}
            <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    className="w-full input-field pr-10"
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="ابحث عن حلقة..."
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  {searchVal && (
                    <button type="button" onClick={() => setSearchVal('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}

import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { PlayerProvider } from './hooks/usePlayer'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './components/Toast'
import Header from './components/Header'
import PlayerBar from './components/PlayerBar'
import HomePage from './pages/HomePage'
import PodcastsPage from './pages/PodcastsPage'
import PodcastDetailPage from './pages/PodcastDetailPage'
import EpisodesPage from './pages/EpisodesPage'
import AdminPage from './pages/AdminPage'
import FavoritesPage from './pages/FavoritesPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import './styles/globals.css'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>حدث خطأ</h1>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              عذراً، حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              إعادة تحميل
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <PlayerProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/podcasts" element={<PodcastsPage />} />
                    <Route path="/podcasts/:id" element={<PodcastDetailPage />} />
                    <Route path="/episodes" element={<EpisodesPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="*" element={
                      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
                        <div className="text-6xl mb-4">📻</div>
                        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>الصفحة غير موجودة</h1>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>الصفحة التي تبحث عنها غير موجودة</p>
                        <Link to="/" className="btn-primary">العودة للرئيسية</Link>
                      </div>
                    } />
                  </Routes>
                </main>
                <PlayerBar />
              </div>
            </PlayerProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

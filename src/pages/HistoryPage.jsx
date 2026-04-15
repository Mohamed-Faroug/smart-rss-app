import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../hooks/usePlayer'
import { formatDuration } from '../lib/rss'
import { Link } from 'react-router-dom'

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = now - date
  if (diff < 86400000) return 'اليوم'
  if (diff < 172800000) return 'أمس'
  return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
}

export default function HistoryPage() {
  const { user } = useAuth()
  const { playEpisode, currentEpisode, isPlaying } = usePlayer()
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (user) {
          const { data } = await supabase
            .from('listen_history')
            .select('episode_id, listened_at, episodes(*, podcasts(title, image_url))')
            .eq('user_id', user.id)
            .order('listened_at', { ascending: false })
            .limit(50)
          setEpisodes((data || []).map(r => ({ ...r.episodes, _listened_at: r.listened_at })))
        } else {
          // local history
          const histIds = JSON.parse(localStorage.getItem('listen_history') || '[]')
          if (histIds.length) {
            const { data } = await supabase
              .from('episodes')
              .select('*, podcasts(title, image_url)')
              .in('id', histIds)
            const sorted = histIds.map(id => data?.find(ep => ep.id === id)).filter(Boolean)
            setEpisodes(sorted)
          }
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [user])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200,241,53,0.1)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent-green)"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
        </div>
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>سجل الاستماع</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{episodes.length} حلقة استمعت إليها</p>
        </div>
      </div>

      {!user && (
        <div className="rounded-xl p-4 mb-6 flex items-center gap-3" style={{ background: 'rgba(200,241,53,0.08)', border: '1px solid rgba(200,241,53,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent-green)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          <p className="text-sm" style={{ color: 'var(--accent-green)' }}>سجّل دخولك لحفظ السجل بشكل دائم عبر أجهزتك</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : episodes.length === 0 ? (
        <div className="text-center py-24 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-5xl mb-4">🎧</div>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>لم تستمع لأي حلقة بعد</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>ابدأ الاستماع لتظهر الحلقات هنا</p>
          <Link to="/episodes" className="btn-primary">تصفح الحلقات</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {episodes.map((ep, i) => {
            const isActive = currentEpisode?.id === ep.id
            const image = ep.image_url || ep.podcasts?.image_url
            return (
              <div
                key={ep.id + i}
                className={`episode-row ${isActive ? 'active' : ''}`}
                onClick={() => playEpisode(ep, ep.podcasts)}
              >
                <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden" style={{ background: 'var(--bg-dark)' }}>
                  {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🎙️</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: isActive ? 'var(--accent-green)' : 'var(--text-primary)' }}>{ep.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ep.podcasts?.title}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {ep._listened_at && <span>{formatDate(ep._listened_at)}</span>}
                  <span>{formatDuration(ep.duration || 0)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

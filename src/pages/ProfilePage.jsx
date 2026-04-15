import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../hooks/usePlayer'
import { formatDuration } from '../lib/rss'
import { Link, Navigate } from 'react-router-dom'
import EpisodeCard from '../components/EpisodeCard'
import { getSessionHistory } from '../lib/session'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const { currentEpisode, podcast: currentPodcast, isPlaying, progress, currentTime, duration } = usePlayer()
  const [favorites, setFavorites] = useState([])
  const [history, setHistory] = useState([])
  const [totalHours, setTotalHours] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('history')
  const [editMode, setEditMode] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return <Navigate to="/" />

  useEffect(() => {
    setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || '')
    async function load() {
      setLoading(true)
      try {
        const favIds = JSON.parse(localStorage.getItem('fav_episodes') || '[]')
        if (favIds.length) {
          const { data } = await supabase.from('episodes').select('*, podcasts(title, image_url)').in('id', favIds).limit(20)
          setFavorites(data || [])
        }
        const sessionHistory = getSessionHistory()
        if (sessionHistory.length) {
          const ids = sessionHistory.map(h => h.id)
          const { data } = await supabase.from('episodes').select('*, podcasts(title, image_url)').in('id', ids).limit(30)
          setHistory(data || [])
          const total = sessionHistory.reduce((sum, h) => sum + (h.duration || 0), 0)
          setTotalHours(Math.round(total / 3600 * 10) / 10)
        }
      } finally { setLoading(false) }
    }
    load()
  }, [user])

  const saveName = async () => {
    setSaving(true)
    try {
      await supabase.auth.updateUser({ data: { display_name: displayName } })
    } catch {}
    setSaving(false)
    setEditMode(false)
  }

  const tabs = [
    { id: 'history', label: 'سجل الاستماع', icon: '🕐' },
    { id: 'favorites', label: 'المفضلة', icon: '♥' },
    { id: 'current', label: 'يُشغَّل الآن', icon: '▶' },
    { id: 'profile', label: 'الملف الشخصي', icon: '👤' },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-32">
      {/* Profile header */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl text-white flex-shrink-0" style={{ background: 'var(--primary)' }}>
            {(displayName || user.email)?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {editMode ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  className="input-field text-sm py-1.5"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="اسمك"
                  style={{ maxWidth: 200 }}
                />
                <button onClick={saveName} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                  {saving ? '...' : 'حفظ'}
                </button>
                <button onClick={() => setEditMode(false)} className="btn-ghost text-xs px-3 py-1.5">إلغاء</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-lg truncate" style={{ color: 'var(--text-1)' }}>{displayName || user.email}</p>
                <button onClick={() => setEditMode(true)} className="p-1 rounded-lg hover:bg-white/10 transition-colors" style={{ color: 'var(--text-3)' }} title="تعديل الاسم">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
              </div>
            )}
            <p className="text-xs truncate mb-3" style={{ color: 'var(--text-3)' }}>{user.email}</p>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-black text-xl" style={{ color: 'var(--primary)' }}>{history.length}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>حلقة استمعت</p>
              </div>
              <div className="h-8 w-px" style={{ background: 'var(--border)' }} />
              <div className="text-center">
                <p className="font-black text-xl" style={{ color: 'var(--primary)' }}>{totalHours}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>ساعة استماع</p>
              </div>
              <div className="h-8 w-px" style={{ background: 'var(--border)' }} />
              <div className="text-center">
                <p className="font-black text-xl" style={{ color: 'var(--primary)' }}>{favorites.length}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>مفضلة</p>
              </div>
            </div>
          </div>
          <button onClick={signOut} className="btn-ghost text-sm flex-shrink-0">تسجيل الخروج</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-full overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', scrollbarWidth: 'none' }}>
        {tabs.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
            style={{ background: tab === id ? 'var(--primary)' : 'transparent', color: tab === id ? '#fff' : 'var(--text-2)' }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex flex-col gap-2">{Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : tab === 'history' ? (
        <div>
          {history.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-4xl mb-3">🎧</p>
              <p style={{ color: 'var(--text-2)' }}>لم تستمع لأي حلقة بعد</p>
              <Link to="/episodes" className="btn-primary mt-4 inline-flex">تصفح الحلقات</Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{ color: 'var(--text-2)' }}>{history.length} حلقة استمعت إليها</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {history.map(ep => <EpisodeCard key={ep.id} episode={ep} podcast={ep.podcasts} />)}
              </div>
            </>
          )}
        </div>
      ) : tab === 'favorites' ? (
        <div>
          {favorites.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-4xl mb-3">💔</p>
              <p style={{ color: 'var(--text-2)' }}>لا توجد حلقات مفضلة بعد</p>
              <Link to="/episodes" className="btn-primary mt-4 inline-flex">تصفح الحلقات</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {favorites.map(ep => <EpisodeCard key={ep.id} episode={ep} podcast={ep.podcasts} />)}
            </div>
          )}
        </div>
      ) : tab === 'current' ? (
        <div>
          {!currentEpisode ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-4xl mb-3">▶️</p>
              <p style={{ color: 'var(--text-2)' }}>لا يوجد شيء يُشغَّل الآن</p>
              <Link to="/episodes" className="btn-primary mt-4 inline-flex">استمع الآن</Link>
            </div>
          ) : (
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold mb-4" style={{ color: 'var(--primary)' }}>يُشغَّل الآن</p>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg)' }}>
                  {currentEpisode.image_url || currentEpisode.image
                    ? <img src={currentEpisode.image_url || currentEpisode.image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🎙️</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: 'var(--text-1)' }}>{currentEpisode.title}</p>
                  <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-2)' }}>{currentPodcast?.title || currentEpisode.podcast_title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span>{formatDuration(Math.floor(currentTime))}</span>
                    <span>/</span>
                    <span>{formatDuration(Math.floor(duration))}</span>
                    {isPlaying && <span className="font-bold" style={{ color: 'var(--primary)' }}>● يُشغَّل</span>}
                  </div>
                </div>
              </div>
              <div className="progress-track h-2" style={{ cursor: 'default' }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                <span>تقدم الاستماع: {Math.round(progress)}%</span>
                <span>متبقي: {formatDuration(Math.floor(duration - currentTime))}</span>
              </div>
            </div>
          )}
        </div>
      ) : tab === 'profile' ? (
        <div className="flex flex-col gap-4">
          {/* Edit profile */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-1)' }}>تعديل الملف الشخصي</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-2)' }}>الاسم المعروض</label>
                <input
                  className="input-field"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="اسمك"
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-2)' }}>البريد الإلكتروني</label>
                <input className="input-field" value={user.email} disabled style={{ opacity: 0.6 }} />
              </div>
              <button onClick={saveName} disabled={saving} className="btn-primary w-fit">
                {saving ? 'يتم الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          </div>

          {/* Stats card */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-1)' }}>إحصائيات الاستماع</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'حلقة استمعت', value: history.length, icon: '🎧' },
                { label: 'ساعة استماع', value: totalHours, icon: '⏱️' },
                { label: 'في المفضلة', value: favorites.length, icon: '❤️' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="text-center rounded-xl p-3" style={{ background: 'var(--bg)' }}>
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="font-black text-2xl" style={{ color: 'var(--primary)' }}>{value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* محتوى مشابه */}
          {history.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h3 className="font-bold mb-3" style={{ color: 'var(--text-1)' }}>قد يعجبك أيضاً</h3>
              <div className="flex flex-col gap-1.5">
                {history.slice(0, 3).map(ep => <EpisodeCard key={`similar-${ep.id}`} episode={ep} podcast={ep.podcasts} compact />)}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

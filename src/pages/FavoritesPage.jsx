import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../hooks/usePlayer'
import { formatDuration } from '../lib/rss'
import { Link } from 'react-router-dom'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function FavoritesPage() {
  const { user, getFavorites } = useAuth()
  const { playEpisode, currentEpisode, isPlaying } = usePlayer()
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('published_at')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const favIds = await getFavorites()
        if (!favIds.length) { setEpisodes([]); return }
        const { data } = await supabase
          .from('episodes')
          .select('*, podcasts(title, image_url, author)')
          .in('id', favIds)
        setEpisodes(data || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [getFavorites])

  const filteredAndSortedEpisodes = useMemo(() => {
    let filtered = episodes.filter(ep =>
      ep.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.podcasts?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'podcast') return (a.podcasts?.title || '').localeCompare(b.podcasts?.title || '');
      if (sortBy === 'duration') return (a.duration || 0) - (b.duration || 0);
      // default: published_at desc
      return new Date(b.published_at) - new Date(a.published_at);
    });
    return filtered;
  }, [episodes, searchTerm, sortBy])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(200,241,53,0.1)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent-green)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </div>
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>المفضلة</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {searchTerm ? `${filteredAndSortedEpisodes.length} من ${episodes.length} حلقة` : `${episodes.length} حلقة محفوظة`}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <input
          type="text"
          placeholder="البحث في المفضلة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-lg border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="published_at">ترتيب حسب التاريخ</option>
          <option value="title">ترتيب حسب العنوان</option>
          <option value="podcast">ترتيب حسب البودكاست</option>
          <option value="duration">ترتيب حسب المدة</option>
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : episodes.length === 0 ? (
        <div className="text-center py-24 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-5xl mb-4">💔</div>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>لا توجد حلقات مفضلة</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>اضغط على قلب الحلقة لإضافتها للمفضلة</p>
          <Link to="/episodes" className="btn-primary">تصفح الحلقات</Link>
        </div>
      ) : filteredAndSortedEpisodes.length === 0 ? (
        <div className="text-center py-24 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>لا توجد نتائج</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>جرب كلمات بحث مختلفة</p>
          <button onClick={() => setSearchTerm('')} className="btn-primary">مسح البحث</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredAndSortedEpisodes.map((ep) => {
            const isActive = currentEpisode?.id === ep.id
            const image = ep.image_url || ep.podcasts?.image_url
            return (
              <div
                key={ep.id}
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
                  <span>{formatDate(ep.published_at)}</span>
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

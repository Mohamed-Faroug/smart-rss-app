import { useState, useEffect } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { useAuth } from '../hooks/useAuth'
import { formatDuration } from '../lib/rss'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' })
}

function shareEpisode(e, episode) {
  e.stopPropagation()
  const text = `استمع إلى: ${episode.title}`
  if (navigator.share) navigator.share({ title: episode.title, text, url: window.location.href }).catch(() => {})
  else navigator.clipboard?.writeText(window.location.href).catch(() => {})
}

export default function EpisodeCard({ episode, podcast, compact = false, showRank = null }) {
  const { playEpisode, currentEpisode, isPlaying, addToQueue } = usePlayer()
  const { toggleFavorite, getFavorites } = useAuth()
  const [isFav, setIsFav] = useState(false)

  const isCurrentlyPlaying = currentEpisode?.id === episode.id && isPlaying
  const isCurrentEpisode = currentEpisode?.id === episode.id
  const image = episode.image_url || episode.image || podcast?.image_url || podcast?.image
  const dur = episode.duration > 0 ? formatDuration(episode.duration) : null

  useEffect(() => {
    getFavorites().then(favs => setIsFav(favs.includes(episode.id))).catch(() => {})
  }, [episode.id])

  const handleFav = async (e) => {
    e.stopPropagation()
    const result = await toggleFavorite(episode.id)
    setIsFav(result)
  }

  // Compact row style
  if (compact) {
    return (
      <div className={`episode-row group ${isCurrentEpisode ? 'active' : ''}`} onClick={() => playEpisode(episode, podcast)}>
        {showRank && <span className="text-sm font-black w-5 text-center flex-shrink-0" style={{ color: isCurrentEpisode ? 'var(--primary)' : 'var(--text-3)' }}>{showRank}</span>}
        <div className="relative flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
          {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🎙️</div>}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.55)' }}>
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              {isCurrentlyPlaying
                ? <svg width="10" height="10" viewBox="0 0 24 24" fill="#000"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <svg width="10" height="10" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z"/></svg>
              }
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: isCurrentEpisode ? 'var(--primary)' : 'var(--text-1)' }}>{episode.title}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{podcast?.title || episode.podcasts?.title || ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {dur && <span className="text-xs" style={{ color: 'var(--text-3)' }}>{dur}</span>}
          {/* Share button on hover */}
          <button onClick={(e) => shareEpisode(e, episode)} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10" style={{ color: 'var(--text-2)' }} title="مشاركة">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
          </button>
        </div>
      </div>
    )
  }

  // Full card
  return (
    <div className={`episode-row group ${isCurrentEpisode ? 'active' : ''}`} onClick={() => playEpisode(episode, podcast)}>
      <div className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
        {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🎙️</div>}
        {/* Mini play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow">
            {isCurrentlyPlaying
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="#000"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z"/></svg>
            }
          </div>
        </div>
        {isCurrentlyPlaying && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="flex gap-0.5 items-end h-5">
              {[60,100,40,80].map((h, i) => <div key={i} className="waveform-bar" style={{ width: '2px', height: `${h}%`, animationDelay: `${i*0.15}s` }} />)}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {podcast && <p className="text-xs font-semibold mb-0.5 truncate" style={{ color: 'var(--primary)' }}>{podcast.title}</p>}
        <p className="font-bold text-sm truncate" style={{ color: isCurrentEpisode ? 'var(--primary)' : 'var(--text-1)' }}>{episode.title}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--text-3)' }}>
          {episode.published_at && <span>{formatDate(episode.published_at)}</span>}
          {dur && <><span>·</span><span>{dur}</span></>}
        </div>
      </div>

      {/* Actions on hover */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleFav} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors" title="مفضلة">
          <svg width="15" height="15" viewBox="0 0 24 24" fill={isFav ? 'var(--primary)' : 'none'} stroke={isFav ? 'var(--primary)' : 'var(--text-2)'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button onClick={(e) => shareEpisode(e, episode)} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors" title="مشاركة" style={{ color: 'var(--text-2)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); addToQueue(episode) }} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors" title="إضافة للطابور" style={{ color: 'var(--text-2)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
        </button>
      </div>
    </div>
  )
}

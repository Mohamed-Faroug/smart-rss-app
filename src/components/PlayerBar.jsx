import { useState, useRef } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { useAuth } from '../hooks/useAuth'
import { formatDuration } from '../lib/rss'

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2]

// Full player overlay (slides up)
function FullPlayer({ onClose }) {
  const { currentEpisode, podcast, isPlaying, currentTime, duration, playbackRate, isLoading, progress, togglePlay, seek, setRate, skipForward, skipBackward, volume, setVolume } = usePlayer()
  const { toggleFavorite } = useAuth()
  const image = currentEpisode?.image_url || currentEpisode?.image || podcast?.image_url

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    seek(((e.clientX - rect.left) / rect.width) * duration)
  }

  const nextRate = () => {
    const idx = RATES.indexOf(playbackRate)
    setRate(RATES[(idx + 1) % RATES.length])
  }

  const share = () => {
    if (navigator.share) navigator.share({ title: currentEpisode?.title, url: window.location.href }).catch(() => {})
    else navigator.clipboard?.writeText(window.location.href).catch(() => {})
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col animate-slide-up" style={{ background: 'var(--player-bg)' }}>
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <button onClick={onClose} style={{ color: 'var(--text-2)' }} className="flex items-center gap-1 text-sm font-semibold">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
          الآن يُستمع
        </button>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--player-button-bg)', color: 'var(--text-2)' }}>✕</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
        <div className="relative w-56 h-56 rounded-full overflow-hidden shadow-2xl" style={{ border: '3px solid rgba(250,84,28,0.3)' }}>
          {image
            ? <img src={image} alt={currentEpisode?.title} className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '20s' }} />
            : <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: 'var(--bg-card)' }}>🎙️</div>
          }
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--player-overlay)' }}>
              <div className="flex gap-1 items-end h-8">
                {[40,70,100,60,80].map((h, i) => (
                  <div key={i} className="waveform-bar" style={{ width: '3px', height: `${h}%`, animationDelay: `${i*0.12}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-1)' }}>{currentEpisode?.title}</h2>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{podcast?.title || currentEpisode?.podcast_title || ''}</p>
        </div>

        <div className="flex items-center gap-6" style={{ color: 'var(--text-2)' }}>
          <button onClick={() => toggleFavorite(currentEpisode.id)} className="player-action-btn" title="المفضلة">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <button onClick={share} className="player-action-btn" title="مشاركة">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
          </button>
          <button onClick={nextRate} className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--player-button-bg)', color: 'var(--player-button-text)' }}>
            {playbackRate}x
          </button>
        </div>

        <div className="w-full max-w-sm">
          <div className="progress-track h-1.5 cursor-pointer" onClick={handleSeek}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-3)' }}>
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => setVolume(volume === 0 ? 1 : 0)} style={{ color: 'var(--player-button-text)' }} className="player-action-btn">
            {volume === 0
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0 0 14 8.2V11l2.45 2.45c.04-.3.05-.6.05-.9zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A9.77 9.77 0 0 0 21 12c0-5.52-3.78-10.18-9-11.38v2.05A8 8 0 0 1 19 12zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.2v7.55c1.48-.73 2.5-2.25 2.5-4.25zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            }
          </button>
          <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="flex-1 max-w-xs" />
        </div>

        <div className="flex items-center gap-7">
          <button onClick={() => skipBackward(15)} style={{ color: 'var(--player-button-text)' }} className="player-action-btn p-1.5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              <text x="12" y="15" textAnchor="middle" fontSize="5.5" fill="currentColor" fontWeight="bold">15</text>
            </svg>
          </button>
          <button onClick={togglePlay} disabled={isLoading} className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95" style={{ background: 'var(--player-button-bg)', color: 'var(--text-1)' }}>
            {isLoading
              ? <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              : isPlaying
                ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            }
          </button>
          <button onClick={() => skipForward(30)} style={{ color: 'var(--player-button-text)' }} className="player-action-btn p-1.5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
              <text x="12" y="15" textAnchor="middle" fontSize="5.5" fill="currentColor" fontWeight="bold">30</text>
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-around py-4 px-8" style={{ borderTop: '1px solid var(--player-border)' }}>
        <button className="flex flex-col items-center gap-1 text-xs player-action-btn" style={{ color: 'var(--player-button-text)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          مفضلاتي
        </button>
        <button className="flex flex-col items-center gap-1 text-xs player-action-btn" style={{ color: 'var(--player-button-text)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          بحث
        </button>
        <button onClick={onClose} className="flex flex-col items-center gap-1 text-xs" style={{ color: 'var(--primary)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          الشاشة
        </button>
      </div>
    </div>
  )
}

function shareEpisode(episode) {
  if (navigator.share) navigator.share({ title: episode.title, url: window.location.href }).catch(() => {})
  else navigator.clipboard?.writeText(window.location.href).catch(() => {})
}

export default function PlayerBar() {
  const { currentEpisode, podcast, isPlaying, currentTime, duration, volume, playbackRate, isLoading, progress, togglePlay, seek, setVolume, setRate, skipForward, skipBackward, showFullPlayer, toggleFullPlayer } = usePlayer()

  if (!currentEpisode) return null

  const image = currentEpisode.image_url || currentEpisode.image || podcast?.image_url

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    seek((e.clientX - rect.left) / rect.width * duration)
  }

  const nextRate = () => {
    const idx = RATES.indexOf(playbackRate)
    setRate(RATES[(idx + 1) % RATES.length])
  }

  return (
    <>
      {showFullPlayer && <FullPlayer onClose={toggleFullPlayer} />}

      <div className="player-bar">
        {/* Thin seek bar at top */}
        <div className="progress-track rounded-none h-[2px] cursor-pointer" onClick={handleSeek} style={{ borderRadius: 0 }}>
          <div className="progress-fill rounded-none transition-none" style={{ width: `${progress}%`, borderRadius: 0 }} />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-2.5">
          <div className="flex items-center gap-3">
            {/* Circular album art */}
            <button onClick={toggleFullPlayer} className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)', border: '2px solid rgba(250,84,28,0.3)' }}>
                {image
                  ? <img src={image} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-lg">🎙️</div>
                }
              </div>
              {isPlaying && (
                <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5 items-end h-3">
                  {[60,100,40,80].map((h, i) => <div key={i} className="waveform-bar" style={{ width: '2px', height: `${h}%`, animationDelay: `${i * 0.15}s` }} />)}
                </div>
              )}
            </button>

            {/* Info */}
            <button onClick={toggleFullPlayer} className="flex-1 min-w-0 text-right">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--text-1)' }}>{currentEpisode.title}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>{podcast?.title || currentEpisode.podcast_title || ''}</p>
            </button>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => skipBackward(15)} className="player-action-btn p-1.5" style={{ color: 'var(--text-2)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="12" y="15" textAnchor="middle" fontSize="5.5" fill="currentColor" fontWeight="bold">15</text></svg>
              </button>
              <button onClick={togglePlay} disabled={isLoading} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0" style={{ background: 'var(--player-button-bg)', color: 'var(--text-1)' }}>
                {isLoading
                  ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                  : isPlaying
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                }
              </button>
              <button onClick={() => skipForward(30)} className="player-action-btn p-1.5" style={{ color: 'var(--text-2)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="12" y="15" textAnchor="middle" fontSize="5.5" fill="currentColor" fontWeight="bold">30</text></svg>
              </button>
            </div>

            {/* Time */}
            <div className="hidden sm:flex items-center gap-1 text-xs tabular-nums" style={{ color: 'var(--text-3)' }}>
              <span>{formatDuration(Math.floor(currentTime))}</span>
              <span>/</span>
              <span>{formatDuration(Math.floor(duration))}</span>
            </div>

            {/* Speed */}
            <button onClick={nextRate} className="hidden md:flex items-center justify-center rounded-lg px-2 py-1 text-xs font-bold transition-colors min-w-[3rem] player-action-btn" style={{ color: 'var(--text-2)' }}>
              {playbackRate}x
            </button>

            {/* Share */}
            <button onClick={() => shareEpisode(currentEpisode)} className="hidden sm:flex p-1.5 player-action-btn" style={{ color: 'var(--text-2)' }} title="مشاركة">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
            </button>

            {/* Favorite */}
            <button onClick={() => toggleFavorite(currentEpisode.id)} className="hidden sm:flex p-1.5 player-action-btn" style={{ color: 'var(--text-2)' }} title="المفضلة">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>

            {/* Volume */}
            <div className="hidden md:flex items-center gap-1.5">
              <button onClick={() => setVolume(volume === 0 ? 1 : 0)} style={{ color: 'var(--text-2)' }} className="player-action-btn">
                {volume === 0
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0 0 14 8.2V11l2.45 2.45c.04-.3.05-.6.05-.9zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A9.77 9.77 0 0 0 21 12c0-5.52-3.78-10.18-9-11.38v2.05A8 8 0 0 1 19 12zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.2v7.55c1.48-.73 2.5-2.25 2.5-4.25zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                }
              </button>
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-12" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function PodcastCard({ podcast, showEpisodeCount = false, episodeCount }) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <Link to={`/podcasts/${podcast.id}`} className="group block">
      <div className="podcast-tile aspect-square mb-2 overflow-hidden relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {podcast.image_url ? (
          <>
            <img
              src={podcast.image_url}
              alt={podcast.title}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-blue-100 to-purple-100">🎙️</div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="black">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        {/* Episode count badge */}
        {showEpisodeCount && episodeCount !== undefined && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {episodeCount} حلقة
          </div>
        )}

        {/* New badge */}
        {podcast.created_at && new Date(podcast.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            جديد
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-bold line-clamp-2 leading-tight" style={{ color: 'var(--text-primary)' }}>{podcast.title}</p>
        {podcast.author && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{podcast.author}</p>}
        {podcast.description && (
          <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {podcast.description.length > 100 ? `${podcast.description.substring(0, 100)}...` : podcast.description}
          </p>
        )}
      </div>
    </Link>
  )
}

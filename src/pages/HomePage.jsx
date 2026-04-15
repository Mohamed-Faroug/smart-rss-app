import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../hooks/usePlayer'
import { formatDuration } from '../lib/rss'
import { getContinueListening } from '../lib/session'
import EpisodeCard from '../components/EpisodeCard'

// Horizontal scroll card for "continue listening"
function ContinueCard({ ep }) {
  const { playEpisode, currentEpisode, isPlaying } = usePlayer()
  const isActive = currentEpisode?.id === ep.id
  const resumeEp = {
    id: ep.id, title: ep.title, audio_url: ep.audioUrl, image_url: ep.image,
    duration: ep.duration, published_at: ep.publishedAt, podcast_id: ep.podcastId,
    podcast_title: ep.podcastTitle,
  }
  return (
    <div
      className="group cursor-pointer flex-shrink-0 w-52 rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      onClick={() => playEpisode(resumeEp, { title: ep.podcastTitle, id: ep.podcastId })}
    >
      <div className="relative h-32 overflow-hidden">
        {ep.image
          ? <img src={ep.image} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'var(--bg)' }}>🎙️</div>
        }
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)' }} />
        {isActive && isPlaying && (
          <div className="absolute top-2 right-2 flex gap-0.5 items-end h-4">
            {[60,100,40,80].map((h, i) => <div key={i} className="waveform-bar" style={{ width: '2px', height: `${h}%`, animationDelay: `${i*0.15}s` }} />)}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold truncate mb-0.5" style={{ color: 'var(--primary)' }}>{ep.podcastTitle}</p>
        <p className="text-sm font-bold line-clamp-2 leading-snug mb-2" style={{ color: 'var(--text-1)' }}>{ep.title}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{formatDuration(ep.duration || 0)}</span>
          {ep.progress > 0 && (
            <div className="flex-1 progress-track h-0.5">
              <div className="progress-fill" style={{ width: `${ep.progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PodcastCircle({ podcast }) {
  return (
    <Link to={`/podcasts/${podcast.id}`} className="group flex flex-col items-center gap-2 text-center">
      <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-105" style={{ border: '2px solid var(--border)' }}>
        {podcast.image_url
          ? <img src={podcast.image_url} alt={podcast.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--bg-card)', color: 'var(--text-2)' }}>غير<br/>معروف</div>
        }
        <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <p className="text-xs font-semibold line-clamp-2 max-w-[90px]" style={{ color: 'var(--text-1)' }}>{podcast.title}</p>
    </Link>
  )
}

export default function HomePage() {
  const [latestEpisodes, setLatestEpisodes] = useState([])
  const [topEpisodes, setTopEpisodes] = useState([])
  const [allPodcasts, setAllPodcasts] = useState([])
  const [stats, setStats] = useState({ podcasts: 0, episodes: 0 })
  const [loading, setLoading] = useState(true)
  const [continueList, setContinueList] = useState([])
  const { playEpisode } = usePlayer()

  const [discoverEpisodes, setDiscoverEpisodes] = useState([])
  const [discoverLoading, setDiscoverLoading] = useState(false)

  const loadDiscover = async () => {
    setDiscoverLoading(true)
    try {
      const { data } = await supabase.from('episodes').select('*, podcasts(title, image_url, author)').order('RANDOM()').limit(6)
      setDiscoverEpisodes(data || [])
    } catch (e) { console.error(e) }
    finally { setDiscoverLoading(false) }
  }

  useEffect(() => {
    setContinueList(getContinueListening().slice(0, 5))
    async function load() {
      try {
        const [epRes, allPodRes, pCnt, eCnt, discoverRes] = await Promise.all([
          supabase.from('episodes').select('*, podcasts(title, image_url, author)').order('published_at', { ascending: false }).limit(5),
          supabase.from('podcasts').select('*').order('created_at', { ascending: false }).limit(12),
          supabase.from('podcasts').select('id', { count: 'exact', head: true }),
          supabase.from('episodes').select('id', { count: 'exact', head: true }),
          supabase.from('episodes').select('*, podcasts(title, image_url, author)').order('RANDOM()').limit(6),
        ])
        setLatestEpisodes(epRes.data || [])
        setTopEpisodes((epRes.data || []).slice(0, 5))
        setAllPodcasts(allPodRes.data || [])
        setDiscoverEpisodes(discoverRes.data || [])
        setStats({ podcasts: pCnt.count || 0, episodes: eCnt.count || 0 })
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleRandom = () => {
    if (!latestEpisodes.length) return
    const ep = latestEpisodes[Math.floor(Math.random() * latestEpisodes.length)]
    playEpisode(ep, ep.podcasts)
  }

  const filteredPodcasts = allPodcasts

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-32">
      {/* Hero */}
      <section className="mb-10 animate-fade-up">
        <div className="relative overflow-hidden rounded-2xl px-7 py-12 md:px-14 md:py-16 text-right" style={{ background: 'var(--hero-bg)', border: '1px solid var(--border)' }}>
          <div className="absolute top-0 left-0 w-72 h-72 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, var(--hero-accent), transparent)', filter: 'blur(60px)', transform: 'translate(-20%,-30%)' }} />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4" style={{ background: 'rgba(250,84,28,0.1)', border: '1px solid rgba(250,84,28,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                {stats.episodes > 0 ? `أكثر من ${stats.episodes} حلقة` : 'ترتيب'}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3" style={{ color: '#fff' }}>أفكار تستحق التأمل، ومحادثات تستحق الاستماع من صنّاع البودكاست، لمحبّي البودكاست</h1>
            <p className="text-sm md:text-base mb-7 max-w-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              هل فكرت يومًا في تحسين تجربة سماعك للبودكاست؟ كان هذا هاجسنا طوال العامين الماضيين. أن نطوّر تجربة فريدة تنافس أشهر تطبيقات العالم. بعد مئات التجارب، والكثير من المواعيد المؤجلة.
              أخيرًا، هنا ترتيب
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/podcasts" className="btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                ابدأ الاستماع
              </Link>
              <button onClick={handleRandom} className="btn-ghost border-white/20 text-white/70 hover:text-white">
                حلقة عشوائية
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Continue Listening */}
      {continueList.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">أكمل الاستماع</h2>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(250,84,28,0.1)', color: 'var(--primary)' }}>{continueList.length} حلقة</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {continueList.map(ep => <ContinueCard key={ep.id} ep={ep} />)}
          </div>
        </section>
      )}

      {/* Discover New */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">اكتشف جديد</h2>
          <button onClick={loadDiscover} disabled={discoverLoading} className="text-sm font-semibold disabled:opacity-50" style={{ color: 'var(--primary)' }}>
            {discoverLoading ? 'جاري التحميل...' : 'عشوائي آخر'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(loading || discoverLoading)
            ? Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)
            : discoverEpisodes.map(ep => (
              <div
                key={ep.id}
                className="group cursor-pointer rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                onClick={() => playEpisode(ep, ep.podcasts)}
              >
                <div className="relative h-32 overflow-hidden">
                  {ep.image_url || ep.podcasts?.image_url
                    ? <img src={ep.image_url || ep.podcasts?.image_url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'var(--bg)' }}>🎙️</div>
                  }
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--primary)' }}>{ep.podcasts?.title}</p>
                  <p className="text-sm font-bold line-clamp-2 leading-snug" style={{ color: 'var(--text-1)' }}>{ep.title}</p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{formatDuration(ep.duration || 0)}</p>
                </div>
              </div>
            ))
          }
        </div>
      </section>

      {/* Most Listened */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">الأكثر استماعاً</h2>
          <Link to="/episodes" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>عرض الكل</Link>
        </div>
        <div className="flex flex-col gap-1.5">
          {loading
            ? Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)
            : topEpisodes.map((ep, i) => (
              <EpisodeCard key={ep.id} episode={ep} podcast={ep.podcasts} compact showRank={i + 1} />
            ))
          }
        </div>
      </section>

      {/* Latest episodes */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">أضيفت مؤخراً</h2>
          <Link to="/episodes" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>عرض الكل</Link>
        </div>
        <div className="flex flex-col gap-1.5">
          {loading
            ? Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)
            : latestEpisodes.map(ep => (
              <EpisodeCard key={ep.id} episode={ep} podcast={ep.podcasts} />
            ))
          }
        </div>
      </section>

      {/* Madihoon circles */}
      {allPodcasts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">المادحون</h2>
            <Link to="/podcasts" className="text-sm font-bold rounded-full px-3 py-1" style={{ background: 'var(--primary)', color: '#fff' }}>
              عرض الكل ›
            </Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {loading
              ? Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="skeleton w-20 h-20 rounded-full" />
                  <div className="skeleton h-3 w-16 rounded" />
                </div>
              ))
              : allPodcasts.slice(0, 8).map(p => <PodcastCircle key={p.id} podcast={p} />)
            }
          </div>
        </section>
      )}

      {/* All Podcasts - 3 per row */}
      {(filteredPodcasts.length > 0 || loading) && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">جميع البودكاست</h2>
            <Link to="/podcasts" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>عرض الكل</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {loading
              ? Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
              : filteredPodcasts.slice(0, 3).map(p => (
                <Link key={p.id} to={`/podcasts/${p.id}`}
                  className="group flex items-center gap-3 p-3 rounded-2xl transition-all"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🎙️</div>
                    }
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text-1)' }}>{p.title}</p>
                    {p.author && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-3)' }}>{p.author}</p>}
                    {p.category && <span className="badge-primary mt-1.5 text-xs">{p.category}</span>}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-3)" className="flex-shrink-0" style={{ transform: 'rotate(180deg)' }}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                </Link>
              ))
            }
          </div>
        </section>
      )}

      {!loading && latestEpisodes.length === 0 && (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <span className="text-6xl block mb-4">🎙️</span>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>لا توجد حلقات بعد</h3>
          <p className="mb-6" style={{ color: 'var(--text-2)' }}>أضف RSS Feed لبدء نشر الحلقات</p>
          <Link to="/admin" className="btn-primary">إضافة RSS Feed</Link>
        </div>
      )}
    </div>
  )
}

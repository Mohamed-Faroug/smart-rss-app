import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import EpisodeCard from '../components/EpisodeCard'
import { useAuth } from '../hooks/useAuth'

export default function PodcastDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [podcast, setPodcast] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('newest')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [podRes, epRes] = await Promise.all([
          supabase.from('podcasts').select('*').eq('id', id).single(),
          supabase.from('episodes').select('*').eq('podcast_id', id).order('published_at', { ascending: false }),
        ])
        setPodcast(podRes.data)
        setEpisodes(epRes.data || [])
        
        // Check subscription
        if (user) {
          const { data } = await supabase
            .from('user_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('podcast_id', id)
            .single()
          setIsSubscribed(!!data)
        }
      } finally { setLoading(false) }
    }
    load()
  }, [id, user])

  const toggleSubscription = async () => {
    if (!user) return
    try {
      if (isSubscribed) {
        await supabase
          .from('user_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('podcast_id', id)
        setIsSubscribed(false)
      } else {
        await supabase
          .from('user_subscriptions')
          .insert({ user_id: user.id, podcast_id: id })
        setIsSubscribed(true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const sortedEpisodes = [...episodes].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.published_at) - new Date(b.published_at)
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    if (sortBy === 'duration') return (a.duration || 0) - (b.duration || 0)
    return new Date(b.published_at) - new Date(a.published_at) // newest
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [podRes, epRes] = await Promise.all([
          supabase.from('podcasts').select('*').eq('id', id).single(),
          supabase.from('episodes').select('*').eq('podcast_id', id).order('published_at', { ascending: false }).limit(50),
        ])
        setPodcast(podRes.data)
        setEpisodes(epRes.data || [])
      } finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="skeleton h-40 rounded-2xl mb-6" />
      <div className="flex flex-col gap-3">{Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
    </div>
  )

  if (!podcast) return (
    <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>البودكاست غير موجود</div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-32">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-10 mb-8 flex flex-col md:flex-row gap-6 items-start md:items-end"
        style={{ background: 'linear-gradient(135deg, #1a2535 0%, #0d1117 100%)', border: '1px solid var(--border)' }}>
        <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl" style={{ background: 'var(--bg-card)' }}>
          {podcast.image_url
            ? <img src={podcast.image_url} alt={podcast.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-5xl">🎙️</div>
          }
        </div>
        <div className="flex-1">
          {podcast.category && <span className="badge-green text-xs mb-2 block w-fit">{podcast.category}</span>}
          <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{podcast.title}</h1>
          {podcast.author && <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{podcast.author}</p>}
          <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'var(--text-muted)' }}>{podcast.description}</p>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{episodes.length} حلقة</span>
            {user && (
              <button
                onClick={toggleSubscription}
                className={`btn-ghost text-sm ${isSubscribed ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : ''}`}
              >
                {isSubscribed ? 'إلغاء الاشتراك' : 'اشتراك'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">الحلقات</h2>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="input-field text-sm"
        >
          <option value="newest">الأحدث أولاً</option>
          <option value="oldest">الأقدم أولاً</option>
          <option value="title">حسب العنوان</option>
          <option value="duration">حسب المدة</option>
        </select>
      </div>
      <div className="flex flex-col gap-2 stagger">
        {sortedEpisodes.map(ep => <EpisodeCard key={ep.id} episode={ep} podcast={podcast} />)}
        {episodes.length === 0 && (
          <div className="text-center py-16 card-dark rounded-2xl">
            <p style={{ color: 'var(--text-secondary)' }}>لا توجد حلقات لهذا البودكاست بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}

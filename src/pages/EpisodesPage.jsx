import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import EpisodeCard from '../components/EpisodeCard'
import { usePlayer } from '../hooks/usePlayer'

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const podcastFilter = searchParams.get('podcast') || ''
  const dateFilter = searchParams.get('date') || ''
  const { playEpisode } = usePlayer()
  const PER_PAGE = 20

  useEffect(() => {
    setPage(1)
  }, [q, podcastFilter, dateFilter])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let query = supabase
          .from('episodes')
          .select('*, podcasts(title, image_url, author)', { count: 'exact' })
          .order('published_at', { ascending: false })
          .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
        
        if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        if (podcastFilter) query = query.eq('podcast_id', podcastFilter)
        if (dateFilter) {
          const now = new Date()
          let startDate
          if (dateFilter === 'today') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          else if (dateFilter === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          else if (dateFilter === 'month') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (startDate) query = query.gte('published_at', startDate.toISOString())
        }
        
        const { data, count } = await query
        setEpisodes(data || [])
        setTotal(count || 0)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [page, q, podcastFilter, dateFilter])

  const handleRandom = () => {
    if (!episodes.length) return
    const ep = episodes[Math.floor(Math.random() * episodes.length)]
    playEpisode(ep, ep.podcasts)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            {q ? `نتائج: "${q}"` : 'جميع الحلقات'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{total} حلقة</p>
        </div>
        <button onClick={handleRandom} className="btn-ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          عشوائي
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold block mb-2" style={{ color: 'var(--text-secondary)' }}>البحث</label>
          <input
            type="text"
            placeholder="ابحث في العناوين والوصف..."
            value={q}
            onChange={e => {
              const newParams = new URLSearchParams(searchParams)
              if (e.target.value) newParams.set('q', e.target.value)
              else newParams.delete('q')
              setSearchParams(newParams)
            }}
            className="input-field w-full"
          />
        </div>
        <div className="min-w-[150px]">
          <label className="text-xs font-bold block mb-2" style={{ color: 'var(--text-secondary)' }}>التاريخ</label>
          <select
            value={dateFilter}
            onChange={e => {
              const newParams = new URLSearchParams(searchParams)
              if (e.target.value) newParams.set('date', e.target.value)
              else newParams.delete('date')
              setSearchParams(newParams)
            }}
            className="input-field w-full"
          >
            <option value="">جميع الأوقات</option>
            <option value="today">اليوم</option>
            <option value="week">هذا الأسبوع</option>
            <option value="month">هذا الشهر</option>
          </select>
        </div>
        <div className="min-w-[150px]">
          <label className="text-xs font-bold block mb-2" style={{ color: 'var(--text-secondary)' }}>البودكاست</label>
          <select
            value={podcastFilter}
            onChange={e => {
              const newParams = new URLSearchParams(searchParams)
              if (e.target.value) newParams.set('podcast', e.target.value)
              else newParams.delete('podcast')
              setSearchParams(newParams)
            }}
            className="input-field w-full"
          >
            <option value="">جميع البودكاست</option>
            {/* Would need to load podcast options */}
          </select>
        </div>
        {(q || dateFilter || podcastFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="btn-ghost text-sm"
            >
              مسح الفلاتر
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 stagger">
        {loading
          ? Array(10).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
          : episodes.map(ep => <EpisodeCard key={ep.id} episode={ep} podcast={ep.podcasts} />)
        }
        {!loading && episodes.length === 0 && (
          <div className="text-center py-20 card-dark rounded-2xl">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>لا توجد نتائج</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>جرب كلمة بحث أخرى</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > PER_PAGE && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost">السابق</button>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{page} / {Math.ceil(total / PER_PAGE)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / PER_PAGE)} className="btn-ghost">التالي</button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PodcastCard from '../components/PodcastCard'

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let query = supabase.from('podcasts').select('*').order('created_at', { ascending: false })
        if (search) query = query.ilike('title', `%${search}%`)
        const { data } = await query
        setPodcasts(data || [])
      } finally { setLoading(false) }
    }
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-32">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>جميع البودكاست</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{podcasts.length} بودكاست</p>
        </div>
        <div className="relative w-48">
          <input className="input-dark py-2 text-sm" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 stagger">
        {loading
          ? Array(12).fill(0).map((_, i) => (
            <div key={i}>
              <div className="skeleton aspect-square rounded-2xl mb-2" />
              <div className="skeleton h-3 rounded mb-1" />
              <div className="skeleton h-3 rounded w-2/3" />
            </div>
          ))
          : podcasts.map(p => <PodcastCard key={p.id} podcast={p} />)
        }
        {!loading && podcasts.length === 0 && (
          <div className="col-span-full text-center py-20">
            <div className="text-4xl mb-3">🎙️</div>
            <p style={{ color: 'var(--text-secondary)' }}>لا توجد بودكاست بعد</p>
          </div>
        )}
      </div>
    </div>
  )
}

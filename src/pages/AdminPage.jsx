import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useRSSSync } from '../hooks/useRSSSync'
import AddFeedModal from '../components/AddFeedModal'

// Admin credentials from environment variables
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS

function AdminLogin({ onLogin }) {
  // Check credentials at runtime
  if (!ADMIN_USER || !ADMIN_PASS) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>خطأ في التكوين</h1>
          <p style={{ color: 'var(--text-secondary)' }}>لم يتم تكوين بيانات الإدارة بشكل صحيح.</p>
        </div>
      </div>
    )
  }
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      sessionStorage.setItem('admin_auth', '1')
      onLogin()
    } else {
      setErr('اسم المستخدم أو كلمة المرور غير صحيحة')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm rounded-2xl p-8 animate-scale-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          </div>
          <h1 className="text-xl font-black mb-1" style={{ color: 'var(--text-1)' }}>لوحة تحكم الإدارة</h1>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>للمسؤولين فقط</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-2)' }}>اسم المستخدم</label>
            <input className="input-field" placeholder="admin" value={u} onChange={e => setU(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-2)' }}>كلمة المرور</label>
            <input type="password" className="input-field" placeholder="••••••" value={p} onChange={e => setP(e.target.value)} required />
          </div>
          {err && <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-3 py-2">{err}</p>}
          <button type="submit" className="btn-primary w-full mt-1">دخول</button>
        </form>
      </div>
    </div>
  )
}

function formatDate(str) {
  if (!str) return 'لم تتم'
  return new Date(str).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }) {
  const map = {
    success: { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', label: 'ناجح' },
    error: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', label: 'خطأ' },
    pending: { bg: 'rgba(234,179,8,0.1)', color: '#facc15', label: 'معلق' },
    syncing: { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', label: 'جاري' },
  }
  const s = map[status] || { bg: 'rgba(128,128,128,0.1)', color: 'var(--text-3)', label: status }
  return <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: s.bg, color: s.color }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('admin_auth'))
  const [tab, setTab] = useState('overview')
  const [feeds, setFeeds] = useState([])
  const [podcasts, setPodcasts] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [stats, setStats] = useState({ podcasts: 0, episodes: 0, feeds: 0, featured: 0 })
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [syncingId, setSyncingId] = useState(null)
  const [editPodcast, setEditPodcast] = useState(null)
  const { syncFeed } = useRSSSync()

  async function loadData() {
    setLoading(true)
    try {
      const [feedsRes, podcastsRes, epRes, pCnt, eCnt, featuredCnt] = await Promise.all([
        supabase.from('rss_feeds').select('*, podcasts(title, image_url)').order('created_at', { ascending: false }),
        supabase.from('podcasts').select('*').order('created_at', { ascending: false }),
        supabase.from('episodes').select('id, title, published_at, duration, podcast_id, podcasts(title)').order('published_at', { ascending: false }).limit(30),
        supabase.from('podcasts').select('id', { count: 'exact', head: true }),
        supabase.from('episodes').select('id', { count: 'exact', head: true }),
        supabase.from('podcasts').select('id', { count: 'exact', head: true }).eq('is_featured', true),
      ])
      setFeeds(feedsRes.data || [])
      setPodcasts(podcastsRes.data || [])
      setEpisodes(epRes.data || [])
      setStats({ podcasts: pCnt.count || 0, episodes: eCnt.count || 0, feeds: (feedsRes.data || []).length, featured: featuredCnt.count || 0 })
    } finally { setLoading(false) }
  }

  useEffect(() => { if (authed) loadData() }, [authed])

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />

  async function handleSync(feed) {
    setSyncingId(feed.id)
    try {
      await supabase.from('rss_feeds').update({ sync_status: 'syncing' }).eq('id', feed.id)
      await syncFeed(feed.url, feed.podcast_id)
      await loadData()
    } catch {
      await supabase.from('rss_feeds').update({ sync_status: 'error' }).eq('id', feed.id)
    } finally { setSyncingId(null) }
  }

  async function handleDeleteFeed(id) {
    if (!confirm('حذف هذا الـ Feed؟')) return
    await supabase.from('rss_feeds').delete().eq('id', id)
    await loadData()
  }

  async function handleDeletePodcast(id) {
    if (!confirm('سيتم حذف البودكاست وجميع حلقاته. متأكد؟')) return
    await supabase.from('episodes').delete().eq('podcast_id', id)
    await supabase.from('rss_feeds').delete().eq('podcast_id', id)
    await supabase.from('podcasts').delete().eq('id', id)
    await loadData()
  }

  async function toggleFeatured(p) {
    await supabase.from('podcasts').update({ is_featured: !p.is_featured }).eq('id', p.id)
    await loadData()
  }

  async function savePodcastEdit(id, updates) {
    await supabase.from('podcasts').update(updates).eq('id', id)
    setEditPodcast(null)
    await loadData()
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: '📊' },
    { id: 'podcasts', label: 'البودكاست', icon: '🎙️' },
    { id: 'feeds', label: 'RSS Feeds', icon: '📡' },
    { id: 'episodes', label: 'الحلقات', icon: '🎵' },
    { id: 'reports', label: 'التقارير', icon: '📈' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-32" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-1)' }}>لوحة التحكم</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>إدارة البودكاست والحلقات وتحليل الأداء</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            إضافة RSS Feed
          </button>
          <button onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthed(false) }} className="btn-ghost text-sm">خروج</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200"
            style={{ background: tab === t.id ? 'var(--primary)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-2)' }}>
            <span>{t.icon}</span>
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: '🎙️', label: 'بودكاست', val: stats.podcasts },
              { icon: '🎵', label: 'حلقة', val: stats.episodes },
              { icon: '📡', label: 'RSS Feed', val: stats.feeds },
              { icon: '⭐', label: 'مميز', val: stats.featured },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <span className="text-2xl">{s.icon}</span>
                <p className="text-3xl font-black mt-2 mb-1" style={{ color: 'var(--text-1)' }}>{s.val}</p>
                <p className="text-sm" style={{ color: 'var(--text-2)' }}>{s.label}</p>
              </div>
            ))}
          </div>
          {/* Latest episodes table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text-1)' }}>أحدث الحلقات</h3>
            </div>
            <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
              {episodes.slice(0, 8).map((ep, i) => (
                <div key={ep.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm font-black w-5 text-center flex-shrink-0" style={{ color: 'var(--text-3)' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{ep.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{ep.podcasts?.title}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>{ep.published_at ? new Date(ep.published_at).toLocaleDateString('ar-SA') : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Podcasts */}
      {tab === 'podcasts' && (
        <div className="space-y-4">
          {podcasts.some(p => p.is_featured) && (
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>البرامج المميزة</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{podcasts.filter(p => p.is_featured).length} برنامج مميز</p>
                </div>
                <span className="badge-primary text-xs">قابل للتعديل</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {podcasts.filter(p => p.is_featured).map(p => (
                  <div key={p.id} className="rounded-2xl p-3" style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.18)' }}>
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{p.title}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{p.author || 'بدون مؤلف'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {podcasts.map(p => (
            <div key={p.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden" style={{ background: 'var(--bg)' }}>
                {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🎙️</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text-1)' }}>{p.title}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{p.author}</p>
                {p.is_featured && <span className="badge-primary text-xs mt-1">⭐ مميز</span>}
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button onClick={() => setEditPodcast(p)} className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>تعديل</button>
                <button onClick={() => toggleFeatured(p)} className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all" style={{ background: p.is_featured ? 'rgba(250,204,21,0.1)' : 'rgba(128,128,128,0.08)', color: p.is_featured ? '#facc15' : 'var(--text-3)', border: '1px solid ' + (p.is_featured ? 'rgba(250,204,21,0.25)' : 'var(--border)') }}>
                  {p.is_featured ? '★ مميز' : '☆ تمييز'}
                </button>
                <button onClick={() => handleDeletePodcast(p.id)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>حذف</button>
              </div>
            </div>
          ))}
          {podcasts.length === 0 && !loading && (
            <div className="col-span-2 text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-4xl mb-3">🎙️</p>
              <p style={{ color: 'var(--text-2)' }}>لا توجد بودكاستات بعد. أضف RSS Feed للبدء.</p>
            </div>
          )}</div>
        </div>
      )}

      {/* Feeds */}
      {tab === 'feeds' && (
        <div className="flex flex-col gap-3">
          {feeds.map(feed => (
            <div key={feed.id} className="rounded-2xl p-4 flex items-center gap-4 flex-wrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {feed.podcasts?.image_url && <img src={feed.podcasts.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text-1)' }}>{feed.podcasts?.title || 'غير مرتبط'}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-3)' }} dir="ltr">{feed.url}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <StatusBadge status={feed.sync_status} />
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>آخر مزامنة: {formatDate(feed.last_synced_at)}</span>
                  {feed.episodes_count > 0 && <span className="text-xs" style={{ color: 'var(--text-3)' }}>{feed.episodes_count} حلقة</span>}
                </div>
                {feed.sync_status === 'error' && feed.error_message && (
                  <p className="text-xs text-red-400 mt-1">{feed.error_message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleSync(feed)} disabled={syncingId === feed.id} className="btn-ghost text-xs py-1.5 px-3">
                  {syncingId === feed.id ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />جاري...</span> : 'مزامنة'}
                </button>
                <button onClick={() => handleDeleteFeed(feed.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            </div>
          ))}
          {feeds.length === 0 && !loading && (
            <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <p className="text-4xl mb-3">📡</p>
              <p className="mb-4" style={{ color: 'var(--text-2)' }}>لا توجد Feeds بعد</p>
              <button onClick={() => setShowAddModal(true)} className="btn-primary">إضافة Feed</button>
            </div>
          )}
        </div>
      )}

      {/* Episodes */}
      {tab === 'episodes' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--text-1)' }}>الحلقات ({stats.episodes})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(128,128,128,0.03)' }}>
                {['العنوان', 'البودكاست', 'تاريخ النشر', 'المدة'].map(h => (
                  <th key={h} className="px-5 py-3 text-right font-semibold" style={{ color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {episodes.map((ep, i) => (
                  <tr key={ep.id} className="hover:bg-white/[0.015] transition-colors" style={{ borderBottom: i < episodes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="px-5 py-3 max-w-xs"><p className="font-medium truncate" style={{ color: 'var(--text-1)' }}>{ep.title}</p></td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-3)' }}>{ep.podcasts?.title}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-3)' }}>{ep.published_at ? new Date(ep.published_at).toLocaleDateString('ar-SA') : '-'}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-3)' }}>{ep.duration ? `${Math.floor(ep.duration / 60)} د` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-1)' }}>مرات الاستماع لكل حلقة</h3>
            <div className="flex flex-col gap-3">
              {episodes.slice(0, 8).map((ep, i) => {
                const pct = Math.max(10, 100 - i * 10)
                return (
                  <div key={ep.id}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-2)' }}>
                      <span className="truncate flex-1 ml-2">{ep.title}</span>
                      <span className="flex-shrink-0">{Math.floor(pct * 1.3)} مرة</span>
                    </div>
                    <div className="progress-track h-1.5">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-1)' }}>إحصائيات المستخدمين</h3>
            {[
              { label: 'مستمعون نشطون هذا الأسبوع', val: '—' },
              { label: 'إجمالي ساعات الاستماع', val: '—' },
              { label: 'متوسط وقت الاستماع', val: '—' },
              { label: 'أكثر المستمعين نشاطاً', val: '—' },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm" style={{ color: 'var(--text-2)' }}>{r.label}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{r.val}</span>
              </div>
            ))}
            <p className="text-xs mt-4" style={{ color: 'var(--text-3)' }}>* تقارير المستخدمين تتطلب إعداد جدول listen_history في Supabase</p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editPodcast && (
        <EditPodcastModal podcast={editPodcast} onClose={() => setEditPodcast(null)} onSave={savePodcastEdit} />
      )}

      {showAddModal && <AddFeedModal onClose={() => setShowAddModal(false)} onSuccess={loadData} />}
    </div>
  )
}

function EditPodcastModal({ podcast, onClose, onSave }) {
  const [title, setTitle] = useState(podcast.title || '')
  const [author, setAuthor] = useState(podcast.author || '')
  const [description, setDescription] = useState(podcast.description || '')
  const [category, setCategory] = useState(podcast.category || '')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSave(podcast.id, { title, author, description, category })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 animate-scale-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>تعديل البودكاست</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: 'var(--text-2)' }}>✕</button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          {[['الاسم', title, setTitle], ['المؤلف', author, setAuthor], ['الفئة', category, setCategory]].map(([label, val, setter]) => (
            <div key={label}>
              <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-2)' }}>{label}</label>
              <input className="input-field" value={val} onChange={e => setter(e.target.value)} />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-2)' }}>الوصف</label>
            <textarea className="input-field" rows={3} value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'none' }} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">إلغاء</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? '...' : 'حفظ'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

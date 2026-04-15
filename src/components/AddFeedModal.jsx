import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRSSSync } from '../hooks/useRSSSync'

export default function AddFeedModal({ onClose, onSuccess }) {
  const [url, setUrl] = useState('')
  const [featured, setFeatured] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progressMsg, setProgressMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const { syncFeed } = useRSSSync()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setError('')
    setProgressMsg('جاري التحقق من الرابط...')
    setLoading(true)
    try {
      const { data: existing } = await supabase.from('rss_feeds').select('id').eq('url', url.trim()).single()
      if (existing) { setError('هذا الـ Feed موجود بالفعل'); setProgressMsg(''); return }

      setProgressMsg('جاري جلب وتحليل RSS Feed...')

      // Create feed record first
      await supabase.from('rss_feeds').insert({ url: url.trim(), sync_status: 'syncing' })

      setProgressMsg('جاري حفظ الحلقات...')
      await syncFeed(url.trim(), null, featured)
      setSuccess(true)
      setTimeout(() => { onSuccess?.(); onClose() }, 1200)
    } catch (err) {
      // Remove failed feed record
      await supabase.from('rss_feeds').delete().eq('url', url.trim()).catch(() => {})
      setError(err.message || 'فشل في إضافة الـ Feed')
      setProgressMsg('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 animate-scale-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>إضافة RSS Feed</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: 'var(--text-2)' }}>✕</button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-bold" style={{ color: 'var(--text-1)' }}>تمت الإضافة بنجاح!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-2)' }}>رابط RSS Feed</label>
              <input type="url" className="input-field" placeholder="https://feeds.example.com/podcast/rss"
                value={url} onChange={e => setUrl(e.target.value)} required dir="ltr" />
            </div>
            <label className="inline-flex items-center gap-3 rounded-2xl px-4 py-3 border border-slate-300" style={{ background: 'var(--bg-card)' }}>
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" checked={featured} onChange={e => setFeatured(e.target.checked)} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>تمييز هذا البرنامج كمميز</span>
            </label>
            <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(250,84,28,0.06)', border: '1px solid rgba(250,84,28,0.15)', color: 'var(--text-2)' }}>
              💡 أدخل رابط RSS لبودكاست مثل Anchor أو Buzzsprout أو Spotify for Podcasters وسيتم استيراد جميع الحلقات تلقائياً.
              <br/><br/>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>في حال ظهور خطأ CORS، يحاول النظام تلقائياً عدة خوادم وسيطة.</span>
            </div>
            {progressMsg && !error && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                {progressMsg}
              </div>
            )}
            {error && (
              <div className="rounded-xl px-3 py-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                ⚠️ {error}
                {error.includes('CORS') || error.includes('fetch') ? (
                  <p className="text-xs mt-1" style={{ color: 'rgba(248,113,113,0.7)' }}>تأكد من أن الرابط صحيح ويدعم الوصول العام، أو جرب نسخ الـ RSS URL من تطبيق البودكاست مباشرةً.</p>
                ) : null}
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">إلغاء</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />يتم المعالجة...</span> : 'إضافة Feed'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

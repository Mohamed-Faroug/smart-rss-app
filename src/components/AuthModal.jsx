import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        onClose()
      } else {
        await signUp(email, password)
        setSuccess('تم إنشاء الحساب! تحقق من بريدك الإلكتروني.')
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ، حاول مجدداً')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 animate-fade-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <p style={{ color: 'var(--text-secondary)' }}>{success}</p>
            <button onClick={onClose} className="btn-primary mt-4 text-sm py-2">إغلاق</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>البريد الإلكتروني</label>
              <input type="email" className="input-dark" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>كلمة المرور</label>
              <input type="password" className="input-dark" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? '...' : mode === 'login' ? 'دخول' : 'إنشاء حساب'}
            </button>
            <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              {mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب؟ '}
              <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="font-bold" style={{ color: 'var(--accent-green)' }}>
                {mode === 'login' ? 'سجّل الآن' : 'ادخل'}
              </button>
            </p>
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              يمكنك الاستماع بدون تسجيل دخول
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

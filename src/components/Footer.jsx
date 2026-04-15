import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <footer className="py-10 mt-12" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)' }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-3)' }}>صفحاتنا على شبكات التواصل</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5" style={{ color: 'var(--text-1)' }}>ترتيب</h2>
          <div className="flex flex-wrap justify-center items-center gap-4 text-xl text-slate-500 mb-6">
            <a href="#" className="transition-colors hover:text-[#FA541C]">✕</a>
            <a href="#" className="transition-colors hover:text-[#1877F2]">𐌟</a>
            <a href="#" className="transition-colors hover:text-[#000]">𝕥</a>
            <a href="#" className="transition-colors hover:text-[#FF0000]">▣</a>
            <a href="#" className="transition-colors hover:text-[#0A66C2]">in</a>
            <a href="#" className="transition-colors hover:text-[#E1306C]">ﮎ</a>
          </div>
          <div className="border-t" style={{ borderColor: 'var(--border)' }}></div>
          <div className="mt-6 text-xs text-slate-500">© 2025 ترتيب · منبّهات ومحتوى عربي جديد كل يوم</div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          style={{ background: 'var(--primary)', color: 'white' }}
          aria-label="العودة إلى الأعلى"
        >
          ↑
        </button>
      )}
    </>
  )
}

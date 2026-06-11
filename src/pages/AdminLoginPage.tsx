import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// ─── AdminLoginPage ───────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError('')

    const { error } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password)

    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard-guru')
    }

    setLoading(false)
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12 font-sans"
      style={{
        background: `repeating-linear-gradient(
          45deg,
          #FFE135,
          #FFE135 4px,
          #FFFEF7 4px,
          #FFFEF7 20px
        )`,
      }}
    >
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="border-4 border-brutal-black bg-brutal-yellow shadow-brutal-xl">
          {/* Card header */}
          <div className="border-b-4 border-brutal-black bg-brutal-black px-6 py-4">
            <h1 className="text-2xl font-black text-brutal-yellow">
              {mode === 'login' ? '👨🏫 Login Guru' : '📝 Daftar Guru'}
            </h1>
            <p className="text-xs font-bold text-brutal-yellow/60 mt-0.5 uppercase tracking-widest">
              JAK PLUENG! Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            <div className="space-y-1">
              <label
                htmlFor="admin-email"
                className="block text-xs font-black uppercase tracking-widest text-brutal-black"
              >
                Gmail
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@gmail.com"
                required
                className="w-full border-4 border-brutal-black bg-brutal-white px-4 py-2.5 text-sm font-bold text-brutal-black placeholder:text-brutal-black/30 focus:outline-none focus:ring-2 focus:ring-brutal-black focus:ring-offset-2"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="admin-password"
                className="block text-xs font-black uppercase tracking-widest text-brutal-black"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border-4 border-brutal-black bg-brutal-white px-4 py-2.5 text-sm font-bold text-brutal-black placeholder:text-brutal-black/30 focus:outline-none focus:ring-2 focus:ring-brutal-black focus:ring-offset-2"
              />
            </div>

            {/* Error message */}
            {error && (
              <p style={{ color: '#FF6B6B', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>
                ⚠️ {error}
              </p>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full border-4 border-brutal-black bg-brutal-black py-3 text-base font-black text-brutal-yellow shadow-brutal transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Memuat...' : mode === 'login' ? 'Masuk →' : 'Daftar →'}
            </button>

            {/* Toggle mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
                  setError('')
                }}
                style={{
                  fontSize: '13px',
                  color: 'rgba(26,26,46,0.6)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                }}
              >
                {mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
              </button>
            </div>
          </form>
        </div>

        {/* Back link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-black text-brutal-black underline decoration-2 underline-offset-2 hover:text-brutal-coral transition-colors"
          >
            ← Kembali ke halaman utama
          </button>
        </div>
      </div>
    </div>
  )
}

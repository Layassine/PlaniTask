import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const features = [
    t('login_feature_1'),
    t('login_feature_2'),
    t('login_feature_3'),
    t('login_feature_4'),
    t('login_feature_5'),
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message ?? t('login_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-pink-500 via-purple-600 to-blue-600 flex-col justify-center px-16 text-white">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">PlaniTask</h1>
          <p className="text-xl text-white/80">{t('login_tagline')}</p>
        </div>
        <ul className="space-y-4">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
              <span className="text-white/90">{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-16 text-white/50 text-sm">{t('login_copyright')}</div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0F172A]">{t('login_title')}</h2>
            <p className="text-[#64748B] mt-2">{t('login_subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('login_email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('login_password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-[#0EA5E9] hover:underline">
                {t('login_forgot')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? t('login_loading') : t('login_button')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#64748B]">
            {t('login_no_account')}{' '}
            <Link to="/signup" className="text-[#0EA5E9] font-medium hover:underline">
              {t('login_create')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

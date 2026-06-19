import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

function getPasswordStrength(password: string, t: (k: string) => string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const labels = ['', t('signup_weak'), t('signup_medium'), t('signup_strong'), t('signup_very_strong')]
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400']
  return { score, label: labels[score] ?? '', color: colors[score] ?? '' }
}

export default function SignUpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = getPasswordStrength(form.password, t)

  const stats = [
    { value: '10K+', label: t('signup_stat_teams') },
    { value: '99.9%', label: t('signup_stat_uptime') },
    { value: '4.9★', label: t('signup_stat_rating') },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.prenom.trim() || !form.nom.trim()) {
      setError('Le prénom et le nom sont obligatoires')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (form.password !== form.confirm) {
      setError(t('signup_pw_mismatch'))
      return
    }
    setLoading(true)
    try {
      await register({ prenom: form.prenom, nom: form.nom, email: form.email, motDePasse: form.password })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message ?? t('signup_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex-col justify-center px-16 text-white">
        <h1 className="text-4xl font-bold mb-4">PlaniTask</h1>
        <p className="text-xl text-white/80 mb-12">{t('signup_tagline')}</p>
        <div className="grid grid-cols-3 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-white/70 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0F172A]">{t('signup_title')}</h2>
            <p className="text-[#64748B] mt-2">{t('signup_start')}</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t('signup_firstname'), name: 'prenom', placeholder: 'Jean' },
                { label: t('signup_lastname'), name: 'nom', placeholder: 'Dupont' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{f.label}</label>
                  <input name={f.name} required value={(form as any)[f.name]} onChange={handleChange} placeholder={f.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent" />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('signup_email')}</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="vous@exemple.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('signup_password')}</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={handleChange} placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent pr-12" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-[#64748B]">{t('signup_strength')} {strength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('signup_confirm')}</label>
              <input name="confirm" type="password" required value={form.confirm} onChange={handleChange} placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:opacity-90 transition disabled:opacity-60">
              {loading ? t('signup_loading') : t('signup_button')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#64748B]">
            {t('signup_have_account')}{' '}
            <Link to="/login" className="text-[#0EA5E9] font-medium hover:underline">{t('signup_login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

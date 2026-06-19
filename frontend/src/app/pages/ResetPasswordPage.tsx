import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import axiosInstance from '../api/axiosConfig'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-2">Lien invalide</h2>
          <p className="text-[#64748B] text-sm mb-6">Ce lien de réinitialisation est invalide ou a expiré.</p>
          <Link to="/forgot-password" className="text-sm text-[#0EA5E9] hover:underline">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return }
    setLoading(true)
    try {
      await axiosInstance.post('/auth/reset-password', { token, nouveauMotDePasse: password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Lien invalide ou expiré')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0F172A] mb-8 transition">
          <ArrowLeft size={16} /> Retour à la connexion
        </Link>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Mot de passe modifié !</h2>
            <p className="text-[#64748B] text-sm">
              Votre mot de passe a été réinitialisé avec succès. Redirection vers la connexion...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <KeyRound size={24} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Nouveau mot de passe</h2>
              <p className="text-[#64748B] text-sm mt-2">
                Choisissez un nouveau mot de passe sécurisé (minimum 6 caractères).
              </p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent pr-12"
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
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Confirmer le mot de passe</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:opacity-90 transition disabled:opacity-60">
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

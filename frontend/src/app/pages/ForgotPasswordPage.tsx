import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle, ExternalLink } from 'lucide-react'
import axiosInstance from '../api/axiosConfig'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [demoLink, setDemoLink] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDemoLink(null)
    setLoading(true)
    try {
      const res = await axiosInstance.post('/auth/forgot-password', { email })
      if (res.data.demoLink) {
        setDemoLink(res.data.demoLink)
      }
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Erreur lors de l'envoi")
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

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Demande envoyée</h2>
            <p className="text-[#64748B] text-sm">
              Si un compte existe avec <strong>{email}</strong>, un lien de réinitialisation a été envoyé.
            </p>

            {demoLink && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Mode démo — email non configuré
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  En production, ce lien serait envoyé par email. Cliquez dessus directement :
                </p>
                <a
                  href={demoLink}
                  className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 break-all"
                >
                  <ExternalLink size={14} className="flex-shrink-0" />
                  <span>{demoLink}</span>
                </a>
              </div>
            )}

            <Link to="/login" className="mt-6 inline-block text-sm text-[#0EA5E9] hover:underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <Mail size={24} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Mot de passe oublié ?</h2>
              <p className="text-[#64748B] text-sm mt-2">
                Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.
              </p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Adresse email</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:opacity-90 transition disabled:opacity-60">
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

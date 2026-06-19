import React, { useEffect, useState } from 'react'
import { Mail, Phone, Briefcase, Loader } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { tacheApi, Tache } from '../api/tacheApi'
import axiosInstance from '../api/axiosConfig'

interface ProfilData {
  id: number; nom: string; prenom: string; email: string; avatar?: string
  poste?: string; telephone?: string; bio?: string; dateInscription?: string
  nbTachesAssignees: number; nbTachesTerminees: number; nbProjets: number
  productivite: number; tachesParMois: { mois: string; taches: number }[]
}

const prioriteBadge: Record<string, string> = {
  HAUTE: 'bg-red-50 text-red-700', CRITIQUE: 'bg-red-100 text-red-800',
  MOYENNE: 'bg-yellow-50 text-yellow-700', BASSE: 'bg-blue-50 text-blue-700',
}

export default function UserProfile() {
  const { t, i18n } = useTranslation()
  const { utilisateur } = useAuth()
  const [profil, setProfil] = useState<ProfilData | null>(null)
  const [tachesActives, setTachesActives] = useState<Tache[]>([])
  const [loading, setLoading] = useState(true)

  const statutLabel: Record<string, string> = {
    A_FAIRE: t('status_a_faire'), EN_COURS: t('status_en_cours'), EN_REVUE: t('status_en_revue'),
    BLOQUEE: t('status_bloquee'), TERMINE: t('status_termine'),
  }

  useEffect(() => {
    Promise.all([
      axiosInstance.get<ProfilData>('/utilisateurs/me'),
      tacheApi.getMesTaches(),
    ]).then(([profilRes, tachesRes]) => {
      setProfil(profilRes.data)
      setTachesActives(tachesRes.data.filter((t) => t.statut !== 'TERMINE').slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const fullName = profil ? `${profil.prenom} ${profil.nom}` : (utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Utilisateur')
  const initiales = profil
    ? `${profil.prenom?.[0] ?? ''}${profil.nom?.[0] ?? ''}`.toUpperCase()
    : (utilisateur ? `${utilisateur.prenom?.[0] ?? ''}${utilisateur.nom?.[0] ?? ''}`.toUpperCase() : 'U')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size={32} className="animate-spin text-purple-500" />
      </div>
    )
  }

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR'
  const tachesParMoisData = profil?.tachesParMois ?? []
  const dateInscription = profil?.dateInscription
    ? new Date(profil.dateInscription).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">{t('profile_title')}</h1>
        <p className="text-[#64748B] mt-1">{t('profile_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-3xl mb-4">
              {initiales}
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">{fullName}</h2>
            <p className="text-sm text-[#64748B] mt-1">{profil?.poste ?? t('profile_no_position')}</p>
            {dateInscription && (
              <p className="text-xs text-[#94A3B8] mt-1">{t('profile_member_since')} {dateInscription}</p>
            )}
          </div>

          <hr className="border-gray-100" />

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('profile_projects'), value: profil?.nbProjets ?? 0 },
              { label: t('profile_tasks'), value: profil?.nbTachesAssignees ?? 0 },
              { label: t('profile_done'), value: profil?.nbTachesTerminees ?? 0 },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-[#0F172A]">{s.value}</div>
                <div className="text-xs text-[#64748B] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-[#64748B] flex-shrink-0" />
              <span className="text-[#0F172A] truncate">{profil?.email ?? utilisateur?.email ?? '—'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-[#64748B] flex-shrink-0" />
              <span className="text-[#64748B]">{profil?.telephone ?? t('profile_not_filled')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase size={16} className="text-[#64748B] flex-shrink-0" />
              <span className="text-[#64748B]">{profil?.poste ?? t('profile_not_filled')}</span>
            </div>
          </div>

          {profil?.bio && (
            <>
              <hr className="border-gray-100" />
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">{t('profile_bio')}</p>
                <p className="text-sm text-[#64748B]">{profil.bio}</p>
              </div>
            </>
          )}
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#0F172A]">{t('profile_productivity')}</h3>
              <span className="text-2xl font-bold text-purple-600">{profil?.productivite ?? 0}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all" style={{ width: `${profil?.productivite ?? 0}%` }} />
            </div>
            <p className="text-xs text-[#64748B] mt-2">
              {profil?.nbTachesTerminees ?? 0} tâche{(profil?.nbTachesTerminees ?? 0) !== 1 ? 's' : ''} terminée{(profil?.nbTachesTerminees ?? 0) !== 1 ? 's' : ''} sur {profil?.nbTachesAssignees ?? 0}
            </p>
          </div>

          {tachesParMoisData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">{t('profile_tasks_month')}</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={tachesParMoisData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="taches" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EC4899" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-4">
              Tâches en cours ({tachesActives.length})
            </h3>
            {tachesActives.length === 0 ? (
              <p className="text-sm text-[#64748B] text-center py-4">{t('profile_no_active')}</p>
            ) : (
              <div className="space-y-3">
                {tachesActives.map((tache) => (
                  <div key={tache.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#0F172A] truncate">{tache.titre}</span>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioriteBadge[tache.priorite] ?? 'bg-gray-100 text-gray-600'}`}>
                            {tache.priorite}
                          </span>
                          <span className="text-xs text-[#94A3B8]">{statutLabel[tache.statut] ?? tache.statut}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full" style={{ width: `${tache.progression}%` }} />
                        </div>
                        <span className="text-xs text-[#64748B] w-8">{tache.progression}%</span>
                      </div>
                      {tache.projetNom && <p className="text-xs text-[#64748B] mt-0.5">{tache.projetNom}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

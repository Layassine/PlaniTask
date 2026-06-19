import React, { useEffect, useState } from 'react'
import { Users, Plus, Trash2, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { membreApi, Membre, RoleProjet } from '../api/membreApi'
import { tacheApi, Tache } from '../api/tacheApi'
import { useProjet, Projet } from '../context/ProjetContext'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axiosConfig'

interface MembreEtendu {
  utilisateurId: number
  nom: string
  prenom: string
  email: string
  avatar?: string
  projets: { projetId: number; nom: string; role: RoleProjet }[]
  tachesAssignees: number
  tachesTerminees: number
}

interface UtilisateurSimple { id: number; nom: string; prenom: string; email: string }

const roleBadge: Record<string, string> = {
  CHEF_DE_PROJET: 'bg-pink-100 text-pink-700', MEMBRE: 'bg-blue-100 text-blue-700',
}

function WorkloadBar({ value }: { value: number }) {
  const color = value >= 85 ? 'from-red-400 to-red-600' : value >= 60 ? 'from-orange-400 to-yellow-400' : 'from-green-400 to-teal-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-[#64748B] w-8">{value}%</span>
    </div>
  )
}

export default function Team() {
  const { t } = useTranslation()
  const { utilisateur: currentUser } = useAuth()
  const { projets } = useProjet()
  const [membres, setMembres] = useState<MembreEtendu[]>([])
  const [loading, setLoading] = useState(true)

  const [projetGestion, setProjetGestion] = useState<Projet | null>(null)
  const [membresProjet, setMembresProjet] = useState<Membre[]>([])
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurSimple[]>([])
  const [addUserId, setAddUserId] = useState('')
  const [addRole, setAddRole] = useState<RoleProjet>('MEMBRE')
  const [loadingGestion, setLoadingGestion] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [gestionError, setGestionError] = useState('')

  useEffect(() => {
    if (projets.length === 0) { setLoading(false); return }

    Promise.all([
      ...projets.map((p) =>
        membreApi.getByProjet(p.id)
          .then((r) => r.data.map((m) => ({ ...m, projetId: p.id, projetNom: p.nom })))
          .catch(() => [])
      ),
      tacheApi.getMesTaches().catch(() => ({ data: [] as Tache[] })).then((r) => ('data' in r ? r.data : r)),
    ]).then((results) => {
      const tachesAll = results[results.length - 1] as Tache[]
      const allMembres = results.slice(0, -1) as (Membre & { projetId: number; projetNom: string })[][]

      const map = new Map<number, MembreEtendu>()
      for (const projMembres of allMembres) {
        for (const m of projMembres) {
          if (!map.has(m.utilisateurId)) {
            map.set(m.utilisateurId, {
              utilisateurId: m.utilisateurId, nom: m.nom, prenom: m.prenom,
              email: m.email, avatar: m.avatar, projets: [], tachesAssignees: 0, tachesTerminees: 0,
            })
          }
          const entry = map.get(m.utilisateurId)!
          if (!entry.projets.some((p) => p.projetId === m.projetId)) {
            entry.projets.push({ projetId: m.projetId, nom: m.projetNom, role: m.role })
          }
        }
      }
      for (const tache of tachesAll) {
        if (tache.assigneeId && map.has(tache.assigneeId)) {
          const entry = map.get(tache.assigneeId)!
          entry.tachesAssignees++
          if (tache.statut === 'TERMINE') entry.tachesTerminees++
        }
      }
      setMembres(Array.from(map.values()))
    }).finally(() => setLoading(false))
  }, [projets.length])

  useEffect(() => {
    axiosInstance.get<UtilisateurSimple[]>('/utilisateurs').then((r) => setUtilisateurs(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!projetGestion) { setMembresProjet([]); return }
    setLoadingGestion(true)
    setGestionError('')
    setShowAddForm(false)
    membreApi.getByProjet(projetGestion.id)
      .then((r) => setMembresProjet(r.data))
      .catch(() => setMembresProjet([]))
      .finally(() => setLoadingGestion(false))
  }, [projetGestion?.id])

  const estChefDuProjet = !loadingGestion && membresProjet.some(
    (m) => m.utilisateurId === currentUser?.id && m.role === 'CHEF_DE_PROJET'
  )

  const ajouterMembre = async () => {
    if (!projetGestion || !addUserId) return
    setGestionError('')
    try {
      const res = await membreApi.ajouter(projetGestion.id, Number(addUserId), addRole)
      setMembresProjet((prev) => [...prev, res.data])
      setAddUserId('')
      setShowAddForm(false)
    } catch (err: any) {
      setGestionError(err.response?.data?.message ?? t('common_error'))
    }
  }

  const retirerMembre = async (userId: number) => {
    if (!projetGestion) return
    setGestionError('')
    try {
      await membreApi.retirer(projetGestion.id, userId)
      setMembresProjet((prev) => prev.filter((m) => m.utilisateurId !== userId))
    } catch (err: any) {
      setGestionError(err.response?.data?.message ?? t('common_error'))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const utilisateursNonMembres = utilisateurs.filter(
    (u) => !membresProjet.some((m) => m.utilisateurId === u.id)
  )

  const roleLabel: Record<string, string> = {
    CHEF_DE_PROJET: t('role_chef'), MEMBRE: t('role_membre'),
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">{t('team_title')}</h1>
        <p className="text-[#64748B] mt-1">
          {membres.length} membre{membres.length !== 1 ? 's' : ''} dans vos projets
        </p>
      </div>

      {membres.length === 0 ? (
        <div className="text-center py-16 text-[#64748B]">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="font-medium">{t('team_no_members')}</p>
          <p className="text-sm mt-1">{t('team_no_members_hint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {membres.map((m) => {
            const workload = m.tachesAssignees > 0
              ? Math.round((m.tachesAssignees - m.tachesTerminees) / m.tachesAssignees * 100)
              : 0
            return (
              <div key={m.utilisateurId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {m.prenom[0]}{m.nom[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F172A]">{m.prenom} {m.nom}</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">{m.email}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#64748B] mb-1.5">
                    <span>{t('team_workload')}</span>
                  </div>
                  <WorkloadBar value={workload} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[#0F172A]">{m.tachesAssignees}</div>
                    <div className="text-xs text-[#64748B] mt-0.5">{t('team_assigned')}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-[#0F172A]">{m.tachesTerminees}</div>
                    <div className="text-xs text-[#64748B] mt-0.5">{t('team_done')}</div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">{t('team_projects')}</p>
                  <div className="space-y-1.5">
                    {m.projets.map((p) => (
                      <div key={p.projetId} className="flex items-center justify-between">
                        <span className="text-sm text-[#0F172A] truncate">{p.nom}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${roleBadge[p.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {roleLabel[p.role] ?? p.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {projets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
              <UserPlus size={20} className="text-purple-500" />
              {t('team_manage')}
            </h2>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('team_select_project')}</label>
            <select
              value={projetGestion?.id ?? ''}
              onChange={(e) => {
                const p = projets.find((x) => x.id === Number(e.target.value)) ?? null
                setProjetGestion(p)
                setShowAddForm(false)
              }}
              className="w-full max-w-xs px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white"
            >
              <option value="">{t('team_choose_project')}</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>

          {projetGestion && (
            <>
              {gestionError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {gestionError}
                </div>
              )}

              {loadingGestion ? (
                <div className="flex items-center justify-center h-20">
                  <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {estChefDuProjet ? (
                    <div className="mb-4">
                      {showAddForm ? (
                        <div className="flex gap-3 items-end flex-wrap p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex-1 min-w-[180px]">
                            <label className="block text-xs font-medium text-[#64748B] mb-1">{t('team_user')}</label>
                            <select
                              value={addUserId}
                              onChange={(e) => setAddUserId(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                            >
                              <option value="">{t('team_select_user')}</option>
                              {utilisateursNonMembres.map((u) => (
                                <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.email})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#64748B] mb-1">{t('team_role')}</label>
                            <select
                              value={addRole}
                              onChange={(e) => setAddRole(e.target.value as RoleProjet)}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                            >
                              <option value="MEMBRE">{t('role_membre')}</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={ajouterMembre}
                              disabled={!addUserId}
                              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                            >
                              {t('common_add')}
                            </button>
                            <button
                              onClick={() => { setShowAddForm(false); setAddUserId(''); setGestionError('') }}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-[#64748B] hover:bg-gray-50"
                            >
                              {t('common_cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="flex items-center gap-2 px-4 py-2 border border-dashed border-purple-300 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 transition"
                        >
                          <Plus size={16} /> {t('team_add_member')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                      Seul le chef de projet peut ajouter ou retirer des membres.
                    </div>
                  )}

                  {membresProjet.length === 0 ? (
                    <p className="text-sm text-[#64748B] py-4 text-center">{t('team_no_project_members')}</p>
                  ) : (
                    <ul className="space-y-2">
                      {membresProjet.map((m) => (
                        <li key={m.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-sm">
                              {m.prenom[0]}{m.nom[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#0F172A]">{m.prenom} {m.nom}</p>
                              <p className="text-xs text-[#64748B]">{m.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleBadge[m.role] ?? 'bg-gray-100 text-gray-600'}`}>
                              {roleLabel[m.role] ?? m.role}
                            </span>
                            {m.role !== 'CHEF_DE_PROJET' && estChefDuProjet && (
                              <button
                                onClick={() => retirerMembre(m.utilisateurId)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                title={t('team_remove')}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Download, CheckCircle2, Plus, X, Trash2, Pencil, Check } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import axiosInstance from '../api/axiosConfig'
import { useAuth } from '../context/AuthContext'
import { useProjet, Projet } from '../context/ProjetContext'
import { tacheApi, Tache, TacheRequest, StatutTache } from '../api/tacheApi'
import { membreApi, Membre, RoleProjet } from '../api/membreApi'
import { rapportApi, FormatRapport } from '../api/rapportApi'

interface JalonDto { id: number; nom: string; dateEcheance?: string; atteint: boolean; projetId: number }
interface UtilisateurSimple { id: number; nom: string; prenom: string; email: string }

const statutBadge: Record<string, string> = {
  A_FAIRE: 'bg-gray-100 text-gray-600', EN_COURS: 'bg-blue-100 text-blue-700',
  EN_REVUE: 'bg-orange-100 text-orange-700', BLOQUEE: 'bg-red-100 text-red-700', TERMINE: 'bg-green-100 text-green-700',
}
const statutLabel: Record<string, string> = {
  A_FAIRE: 'À faire', EN_COURS: 'En cours', EN_REVUE: 'En révision', BLOQUEE: 'Bloqué', TERMINE: 'Terminé',
}
const roleBadge: Record<string, string> = {
  CHEF_DE_PROJET: 'bg-pink-100 text-pink-700', MEMBRE: 'bg-blue-100 text-blue-700',
}
const statutProjetBadge: Record<string, string> = {
  EN_COURS: 'bg-green-100 text-green-700', A_RISQUE: 'bg-orange-100 text-orange-700',
  EN_RETARD: 'bg-red-100 text-red-700', TERMINE: 'bg-gray-100 text-gray-600', EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
}
const statutProjetLabel: Record<string, string> = {
  EN_COURS: 'En cours', A_RISQUE: 'À risque', EN_RETARD: 'En retard', TERMINE: 'Terminé', EN_ATTENTE: 'En attente',
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { utilisateur } = useAuth()
  const { refreshProjet: refreshProjetCtx } = useProjet()
  const [projet, setProjet] = useState<Projet | null>(null)
  const [taches, setTaches] = useState<Tache[]>([])
  const [membres, setMembres] = useState<Membre[]>([])
  const [jalons, setJalons] = useState<JalonDto[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members' | 'milestones'>('overview')
  const [loading, setLoading] = useState(true)
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurSimple[]>([])
  const [showAddMembre, setShowAddMembre] = useState(false)
  const [addMembreId, setAddMembreId] = useState('')
  const [showAddJalon, setShowAddJalon] = useState(false)
  const [jalonForm, setJalonForm] = useState({ nom: '', dateEcheance: '' })
  const [editJalonId, setEditJalonId] = useState<number | null>(null)
  const [editJalonForm, setEditJalonForm] = useState({ nom: '', dateEcheance: '' })
  const [showExport, setShowExport] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const numId = Number(id)

  useEffect(() => {
    if (!numId) return
    setLoading(true)
    Promise.all([
      axiosInstance.get<Projet>(`/projets/${numId}`),
      tacheApi.getByProjet(numId),
      membreApi.getByProjet(numId),
      axiosInstance.get<JalonDto[]>(`/projets/${numId}/jalons`),
      axiosInstance.get<UtilisateurSimple[]>('/utilisateurs'),
    ]).then(([pRes, tRes, mRes, jRes, uRes]) => {
      setProjet(pRes.data)
      setTaches(tRes.data)
      setMembres(mRes.data)
      setJalons(jRes.data)
      setUtilisateurs(uRes.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [numId])

  const refreshTaches = () => tacheApi.getByProjet(numId).then((r) => setTaches(r.data)).catch(() => {})
  const refreshProjet = () => axiosInstance.get<Projet>(`/projets/${numId}`).then((r) => setProjet(r.data)).catch(() => {})

  const toggleTache = async (t: Tache) => {
    const newStatut: StatutTache = t.statut === 'TERMINE' ? 'A_FAIRE' : 'TERMINE'
    try {
      await tacheApi.update(t.id, { titre: t.titre, projetId: numId, statut: newStatut })
      await refreshTaches()
      await refreshProjet()
      refreshProjetCtx(numId)
    } catch {}
  }

  const toggleJalon = async (j: JalonDto) => {
    try {
      await axiosInstance.patch(`/projets/${numId}/jalons/${j.id}/atteint`)
      setJalons((prev) => prev.map((x) => x.id === j.id ? { ...x, atteint: !x.atteint } : x))
    } catch {}
  }

  const ajouterMembre = async () => {
    if (!addMembreId) return
    try {
      const res = await membreApi.ajouter(numId, Number(addMembreId), 'MEMBRE')
      setMembres((p) => [...p, res.data])
      setShowAddMembre(false)
      setAddMembreId('')
    } catch {}
  }

  const retirerMembre = async (userId: number) => {
    try {
      await membreApi.retirer(numId, userId)
      setMembres((p) => p.filter((m) => m.utilisateurId !== userId))
    } catch {}
  }

  const supprimerJalon = async (jalonId: number) => {
    try {
      await axiosInstance.delete(`/projets/${numId}/jalons/${jalonId}`)
      setJalons((prev) => prev.filter((j) => j.id !== jalonId))
    } catch {}
  }

  const startEditJalon = (j: JalonDto) => {
    setEditJalonId(j.id)
    setEditJalonForm({ nom: j.nom, dateEcheance: j.dateEcheance ?? '' })
  }

  const modifierJalon = async () => {
    if (editJalonId === null) return
    try {
      const res = await axiosInstance.put<JalonDto>(`/projets/${numId}/jalons/${editJalonId}`, editJalonForm)
      setJalons((prev) => prev.map((j) => j.id === editJalonId ? res.data : j))
      setEditJalonId(null)
    } catch {}
  }

  const ajouterJalon = async () => {
    if (!jalonForm.nom.trim()) return
    try {
      const res = await axiosInstance.post<JalonDto>(`/projets/${numId}/jalons`, jalonForm)
      setJalons((p) => [...p, res.data])
      setShowAddJalon(false)
      setJalonForm({ nom: '', dateEcheance: '' })
    } catch {}
  }

  const genererRapport = async (format: FormatRapport) => {
    setExportLoading(true)
    try {
      const res = await rapportApi.generer(numId, format)
      const blob = new Blob([res.data.contenu ?? ''], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${res.data.nom}.txt`; a.click()
      URL.revokeObjectURL(url)
    } catch {}
    setExportLoading(false)
    setShowExport(false)
  }

  if (loading || !projet) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  const avancement = Math.round(projet.avancement)
  const estChef = utilisateur?.id === projet.proprietaireId
  const barData = [
    { label: 'À faire', value: taches.filter((t) => t.statut === 'A_FAIRE').length, fill: '#94A3B8' },
    { label: 'En cours', value: taches.filter((t) => t.statut === 'EN_COURS').length, fill: '#6366F1' },
    { label: 'En révision', value: taches.filter((t) => t.statut === 'EN_REVUE').length, fill: '#F59E0B' },
    { label: 'Terminé', value: taches.filter((t) => t.statut === 'TERMINE').length, fill: '#10B981' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              {projet.couleur && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: projet.couleur }} />}
              <h1 className="text-3xl font-bold text-[#0F172A]">{projet.nom}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutProjetBadge[projet.statut] ?? ''}`}>
                {statutProjetLabel[projet.statut] ?? projet.statut}
              </span>
            </div>
            {projet.description && <p className="text-[#64748B] text-sm mt-0.5">{projet.description}</p>}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button onClick={() => setShowExport((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-[#0F172A] hover:bg-gray-50 transition">
              <Download size={16} /> {exportLoading ? 'Export...' : 'Exporter'}
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20 w-36">
                {(['HTML', 'PDF', 'CSV'] as FormatRapport[]).map((f) => (
                  <button key={f} onClick={() => genererRapport(f)}
                    className="w-full text-left px-4 py-2 text-sm text-[#0F172A] hover:bg-gray-50">{f}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Avancement', value: `${avancement}%` },
          { label: 'Tâches', value: `${projet.nombreTachesTerminees}/${projet.nombreTaches}` },
          { label: 'Membres', value: `${projet.nombreMembres}` },
          { label: 'Échéance', value: projet.dateFin ? new Date(projet.dateFin).toLocaleDateString('fr-FR') : '—' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-[#0F172A]">{c.value}</div>
            <div className="text-xs text-[#64748B] mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-[#0F172A]">Progression globale</span>
          <span className="text-sm font-bold text-[#0F172A]">{avancement}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all" style={{ width: `${avancement}%` }} />
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { key: 'overview', label: 'Vue générale' },
            { key: 'tasks', label: `Tâches (${taches.length})` },
            { key: 'members', label: `Membres (${membres.length})` },
            { key: 'milestones', label: `Jalons (${jalons.length})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-purple-500 text-purple-600' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Distribution des tâches</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Informations</h2>
            <div className="space-y-3">
              {[
                { label: 'Propriétaire', value: projet.proprietairePrenom && projet.proprietaireNom ? `${projet.proprietairePrenom} ${projet.proprietaireNom}` : '—' },
                { label: 'Date début', value: projet.dateDebut ? new Date(projet.dateDebut).toLocaleDateString('fr-FR') : '—' },
                { label: 'Date fin', value: projet.dateFin ? new Date(projet.dateFin).toLocaleDateString('fr-FR') : '—' },
                { label: 'Tâches en retard', value: String(projet.nombreTachesEnRetard) },
                { label: 'Jalons atteints', value: `${projet.nombreJalonsAtteints}/${projet.nombreJalons}` },
              ].map((r) => (
                <div key={r.label} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-sm text-[#64748B]">{r.label}</span>
                  <span className={`text-sm font-medium ${r.label === 'Tâches en retard' && projet.nombreTachesEnRetard > 0 ? 'text-red-500' : 'text-[#0F172A]'}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {taches.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]"><p>Aucune tâche dans ce projet</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-8 px-4 py-3" />
                  {['Tâche', 'Assigné', 'Statut', 'Priorité', 'Échéance', 'Progression'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {taches.map((t) => (
                  <tr key={t.id} className={`hover:bg-gray-50 ${t.enRetard ? 'bg-red-50/20' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={t.statut === 'TERMINE'} onChange={() => toggleTache(t)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${t.statut === 'TERMINE' ? 'line-through text-[#64748B]' : 'text-[#0F172A]'}`}>{t.titre}</span>
                      {t.enRetard && <span className="ml-1 text-xs text-red-500">● Retard</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748B]">
                      {t.assigneeId ? `${t.assigneePrenom} ${t.assigneeNom}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutBadge[t.statut] ?? ''}`}>{statutLabel[t.statut]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{t.priorite}</td>
                    <td className={`px-4 py-3 text-sm ${t.enRetard ? 'text-red-500 font-medium' : 'text-[#64748B]'}`}>
                      {t.dateFin ? new Date(t.dateFin).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full" style={{ width: `${t.progression}%` }} />
                        </div>
                        <span className="text-xs text-[#64748B]">{t.progression}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0F172A]">Membres de l'équipe</h2>
            <button onClick={() => setShowAddMembre(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90">
              <Plus size={16} /> Ajouter
            </button>
          </div>
          {showAddMembre && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex gap-3">
                <select value={addMembreId} onChange={(e) => setAddMembreId(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]">
                  <option value="">Sélectionner un utilisateur</option>
                  {utilisateurs.filter((u) => !membres.some((m) => m.utilisateurId === u.id)).map((u) => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.email})</option>
                  ))}
                </select>
                <button onClick={ajouterMembre} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Ajouter</button>
                <button onClick={() => setShowAddMembre(false)} className="p-2 text-gray-500 hover:text-gray-700"><X size={18} /></button>
              </div>
            </div>
          )}
          <ul className="space-y-3">
            {membres.length === 0 ? <p className="text-sm text-[#64748B]">Aucun membre</p> : membres.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-sm">
                    {m.prenom[0]}{m.nom[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{m.prenom} {m.nom}</p>
                    <p className="text-xs text-[#64748B]">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleBadge[m.role] ?? 'bg-gray-100 text-gray-600'}`}>{m.role}</span>
                  <button onClick={() => retirerMembre(m.utilisateurId)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0F172A]">Jalons du projet</h2>
            {estChef && (
              <button onClick={() => setShowAddJalon(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90">
                <Plus size={16} /> Ajouter
              </button>
            )}
          </div>
          {showAddJalon && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex gap-3">
                <input value={jalonForm.nom} onChange={(e) => setJalonForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Nom du jalon"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                <input type="date" value={jalonForm.dateEcheance} onChange={(e) => setJalonForm((p) => ({ ...p, dateEcheance: e.target.value }))}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                <button onClick={ajouterJalon} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Ajouter</button>
                <button onClick={() => setShowAddJalon(false)} className="p-2 text-gray-500"><X size={18} /></button>
              </div>
            </div>
          )}
          <ul className="space-y-3">
            {jalons.length === 0 ? <p className="text-sm text-[#64748B]">Aucun jalon</p> : jalons.map((j) => (
              <li key={j.id} className="py-2 border-b border-gray-50 last:border-0">
                {editJalonId === j.id ? (
                  <div className="flex items-center gap-2">
                    <input value={editJalonForm.nom} onChange={(e) => setEditJalonForm((p) => ({ ...p, nom: e.target.value }))}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                    <input type="date" value={editJalonForm.dateEcheance} onChange={(e) => setEditJalonForm((p) => ({ ...p, dateEcheance: e.target.value }))}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                    <button onClick={modifierJalon} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"><Check size={16} /></button>
                    <button onClick={() => setEditJalonId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {estChef && (
                      <button onClick={() => toggleJalon(j)}>
                        <CheckCircle2 size={20} className={j.atteint ? 'text-green-500' : 'text-gray-300'} />
                      </button>
                    )}
                    {!estChef && <CheckCircle2 size={20} className={j.atteint ? 'text-green-500' : 'text-gray-300'} />}
                    <span className={`text-sm flex-1 ${j.atteint ? 'text-[#64748B] line-through' : 'text-[#0F172A] font-medium'}`}>{j.nom}</span>
                    {j.dateEcheance && <span className="text-xs text-[#64748B]">{new Date(j.dateEcheance).toLocaleDateString('fr-FR')}</span>}
                    {estChef && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditJalon(j)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => supprimerJalon(j.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

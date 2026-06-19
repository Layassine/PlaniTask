import React, { useEffect, useState } from 'react'
import { Plus, Search, X, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tacheApi, Tache, TacheRequest, StatutTache, PrioriteTache } from '../api/tacheApi'
import { useProjet } from '../context/ProjetContext'
import { useAuth } from '../context/AuthContext'
import { membreApi } from '../api/membreApi'

const prioriteBadge: Record<string, string> = {
  HAUTE: 'bg-red-50 text-red-700', CRITIQUE: 'bg-red-100 text-red-800',
  MOYENNE: 'bg-yellow-50 text-yellow-700', BASSE: 'bg-blue-50 text-blue-700',
}
const statutBadge: Record<string, string> = {
  A_FAIRE: 'bg-gray-100 text-gray-600', EN_COURS: 'bg-blue-100 text-blue-700',
  EN_REVUE: 'bg-orange-100 text-orange-700', BLOQUEE: 'bg-red-100 text-red-700', TERMINE: 'bg-green-100 text-green-700',
}

interface UtilisateurSimple { id: number; nom: string; prenom: string; email: string }

function TacheModal({ onClose, onSaved, tacheInitiale, projetIdDefault }: {
  onClose: () => void; onSaved: (t: Tache) => void; tacheInitiale?: Tache; projetIdDefault?: number
}) {
  const { t } = useTranslation()
  const { utilisateur } = useAuth()
  const { projets: tousProjets } = useProjet()
  const projets = tacheInitiale
    ? tousProjets
    : tousProjets.filter((p) => p.proprietaireId === utilisateur?.id)
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurSimple[]>([])
  const [form, setForm] = useState<TacheRequest>(
    tacheInitiale
      ? { titre: tacheInitiale.titre, description: tacheInitiale.description, projetId: tacheInitiale.projetId, assigneeId: tacheInitiale.assigneeId ?? null, statut: tacheInitiale.statut, priorite: tacheInitiale.priorite, dateDebut: tacheInitiale.dateDebut, dateFin: tacheInitiale.dateFin, tempsEstime: tacheInitiale.tempsEstime, progression: tacheInitiale.progression }
      : { titre: '', projetId: projetIdDefault ?? (projets[0]?.id ?? 0), statut: 'A_FAIRE', priorite: 'MOYENNE', progression: 0 }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const statutLabel: Record<string, string> = {
    A_FAIRE: t('status_a_faire'), EN_COURS: t('status_en_cours'), EN_REVUE: t('status_en_revue'),
    BLOQUEE: t('status_bloquee'), TERMINE: t('status_termine'),
  }

  useEffect(() => {
    if (!form.projetId) { setUtilisateurs([]); return }
    membreApi.getByProjet(form.projetId)
      .then((r) => setUtilisateurs(r.data.map((m) => ({ id: m.utilisateurId, nom: m.nom, prenom: m.prenom, email: m.email }))))
      .catch(() => setUtilisateurs([]))
  }, [form.projetId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const today = new Date().toISOString().split('T')[0]
    const newErrors: Record<string, string> = {}
    if (!form.titre.trim()) newErrors.titre = t('task_title_required')
    if (!form.projetId) newErrors.projetId = t('task_project_required')
    if (form.progression !== undefined && (form.progression < 0 || form.progression > 100)) {
      newErrors.progression = 'La progression doit être entre 0 et 100'
    }
    if (form.tempsEstime !== undefined && form.tempsEstime < 0) {
      newErrors.tempsEstime = 'Le temps estimé ne peut pas être négatif'
    }
    if (!isEdit && form.dateDebut && form.dateDebut < today) {
      newErrors.dateDebut = "La date de début doit être aujourd'hui ou dans le futur"
    }
    if (!isEdit && form.dateFin && form.dateFin < today) {
      newErrors.dateFin = "La date d'échéance doit être dans le futur"
    }
    if (form.dateDebut && form.dateFin && form.dateFin < form.dateDebut) {
      newErrors.dateFin = "La date d'échéance doit être après la date de début"
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    setLoading(true)
    try {
      let res
      if (tacheInitiale) { res = await tacheApi.update(tacheInitiale.id, form) } else { res = await tacheApi.create(form) }
      onSaved(res.data); onClose()
    } catch (err: any) {
      setError(err.response?.data?.message ?? t('common_error'))
    } finally {
      setLoading(false)
    }
  }

  const set = (k: keyof TacheRequest, v: any) => setForm((p) => ({ ...p, [k]: v }))
  const isEdit = !!tacheInitiale

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-[#0F172A]">{isEdit ? t('task_edit') : t('task_new')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('task_title_label')}</label>
            <input value={form.titre} onChange={(e) => set('titre', e.target.value)} placeholder="Ex: Développer l'API"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${errors.titre ? 'border-red-400' : 'border-gray-300'}`} />
            {errors.titre && <p className="text-red-500 text-xs mt-1">{errors.titre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('task_desc_label')}</label>
            <textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('task_project_label')}</label>
              <select value={form.projetId} onChange={(e) => setForm((p) => ({ ...p, projetId: Number(e.target.value), assigneeId: null }))} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white">
                <option value="">{t('task_choose')}</option>
                {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('task_assignee_label')}</label>
              <select value={form.assigneeId ?? ''} onChange={(e) => set('assigneeId', e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white">
                <option value="">{t('task_unassigned')}</option>
                {utilisateurs.map((u) => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('task_priority_label')}</label>
              <select value={form.priorite} onChange={(e) => set('priorite', e.target.value as PrioriteTache)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white">
                <option value="BASSE">{t('priority_basse')}</option>
                <option value="MOYENNE">{t('priority_moyenne')}</option>
                <option value="HAUTE">{t('priority_haute')}</option>
                <option value="CRITIQUE">{t('priority_critique')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('task_status_label')}</label>
              <select value={form.statut} onChange={(e) => set('statut', e.target.value as StatutTache)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white">
                {Object.entries(statutLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('task_date_start')}</label>
              <input type="date" value={form.dateDebut ?? ''}
                min={!isEdit ? new Date().toISOString().split('T')[0] : undefined}
                onChange={(e) => set('dateDebut', e.target.value || undefined)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${errors.dateDebut ? 'border-red-400' : 'border-gray-300'}`} />
              {errors.dateDebut && <p className="text-red-500 text-xs mt-1">{errors.dateDebut}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('task_date_end')}</label>
              <input type="date" value={form.dateFin ?? ''}
                min={!isEdit ? new Date().toISOString().split('T')[0] : undefined}
                onChange={(e) => set('dateFin', e.target.value || undefined)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${errors.dateFin ? 'border-red-400' : 'border-gray-300'}`} />
              {errors.dateFin && <p className="text-red-500 text-xs mt-1">{errors.dateFin}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('task_time_label')}</label>
            <input type="number" min="0" step="0.5" value={form.tempsEstime ?? ''} onChange={(e) => set('tempsEstime', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Ex: 8" className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${errors.tempsEstime ? 'border-red-400' : 'border-gray-300'}`} />
            {errors.tempsEstime && <p className="text-red-500 text-xs mt-1">{errors.tempsEstime}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
              Progression — <span className="text-purple-600 font-semibold">{form.statut === 'TERMINE' ? 100 : (form.progression ?? 0)}%</span>
            </label>
            <input
              type="range" min="0" max="100" step="5"
              value={form.statut === 'TERMINE' ? 100 : (form.progression ?? 0)}
              disabled={form.statut === 'TERMINE'}
              onChange={(e) => set('progression', Number(e.target.value))}
              className="w-full accent-purple-600 disabled:opacity-50"
            />
            {errors.progression && <p className="text-red-500 text-xs mt-1">{errors.progression}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-[#64748B] hover:bg-gray-50">
              {t('common_cancel')}
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60">
              {loading ? t('task_saving') : isEdit ? t('task_save') : t('task_create_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const PAGE_SIZE = 15

export default function Tasks() {
  const { t, i18n } = useTranslation()
  const { utilisateur } = useAuth()
  const { projets } = useProjet()
  const [taches, setTaches] = useState<Tache[]>([])
  const [search, setSearch] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtrePriorite, setFiltrePriorite] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTache, setEditTache] = useState<Tache | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR'

  const peutModifier = (tache: Tache) => {
    const projet = projets.find((p) => p.id === tache.projetId)
    return utilisateur?.id === projet?.proprietaireId || tache.assigneeId === utilisateur?.id
  }

  const statutLabel: Record<string, string> = {
    A_FAIRE: t('status_a_faire'), EN_COURS: t('status_en_cours'), EN_REVUE: t('status_en_revue'),
    BLOQUEE: t('status_bloquee'), TERMINE: t('status_termine'),
  }

  const load = () => {
    setLoading(true)
    tacheApi.getMesTaches().then((r) => setTaches(r.data)).catch(() => setTaches([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = taches.filter((tache) => {
    const s = search.toLowerCase()
    return (
      (tache.titre.toLowerCase().includes(s) || (tache.projetNom ?? '').toLowerCase().includes(s)) &&
      (!filtreStatut || tache.statut === filtreStatut) &&
      (!filtrePriorite || tache.priorite === filtrePriorite)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async (id: number) => {
    try { await tacheApi.delete(id); setTaches((prev) => prev.filter((t) => t.id !== id)) } catch {}
    setConfirmDeleteId(null)
  }

  const initiales = (nom?: string, prenom?: string) => `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <div className="space-y-6">
      {showModal && <TacheModal onClose={() => setShowModal(false)} onSaved={(tache) => { setTaches((p) => [tache, ...p]); setShowModal(false) }} />}
      {editTache && <TacheModal tacheInitiale={editTache} onClose={() => setEditTache(null)} onSaved={(tache) => { setTaches((prev) => prev.map((x) => x.id === tache.id ? tache : x)); setEditTache(null) }} />}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{t('task_delete_title')}</h3>
            <p className="text-sm text-[#64748B] mb-5">{t('common_irreversible')}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-[#64748B] hover:bg-gray-50">
                {t('common_cancel')}
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                {t('common_delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">{t('nav_tasks')}</h1>
          <p className="text-[#64748B] mt-1">{taches.length} tâche{taches.length !== 1 ? 's' : ''}</p>
        </div>
        {projets.some((p) => p.proprietaireId === utilisateur?.id) && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:opacity-90 transition">
            <Plus size={18} /> {t('task_new')}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder={t('task_search')} value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
        </div>
        <select value={filtreStatut} onChange={(e) => { setFiltreStatut(e.target.value); setPage(1) }}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white">
          <option value="">{t('task_all_statuts')}</option>
          {Object.entries(statutLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filtrePriorite} onChange={(e) => { setFiltrePriorite(e.target.value); setPage(1) }}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white">
          <option value="">{t('task_all_priorities')}</option>
          <option value="CRITIQUE">{t('priority_critique')}</option>
          <option value="HAUTE">{t('priority_haute')}</option>
          <option value="MOYENNE">{t('priority_moyenne')}</option>
          <option value="BASSE">{t('priority_basse')}</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#64748B]">
          <p className="font-medium">{t('task_none')}</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-purple-600 hover:underline">{t('task_create')}</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[t('task_header_task'), t('task_header_assigned'), t('task_header_priority'), t('task_header_status'), t('task_header_deadline'), t('task_header_progress'), t('task_header_project'), ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((tache) => (
                <tr key={tache.id} className={`hover:bg-gray-50 transition-colors ${tache.enRetard ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${tache.statut === 'TERMINE' ? 'line-through text-[#64748B]' : 'text-[#0F172A]'}`}>{tache.titre}</span>
                    {tache.enRetard && <span className="ml-2 text-xs text-red-500 font-medium">● {t('task_late')}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {tache.assigneeId ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white text-xs font-bold">
                          {initiales(tache.assigneeNom, tache.assigneePrenom)}
                        </div>
                        <span className="text-sm text-[#0F172A]">{tache.assigneePrenom} {tache.assigneeNom}</span>
                      </div>
                    ) : <span className="text-sm text-[#94A3B8]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioriteBadge[tache.priorite] ?? ''}`}>{tache.priorite}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutBadge[tache.statut] ?? ''}`}>{statutLabel[tache.statut]}</span>
                  </td>
                  <td className={`px-4 py-3 text-sm ${tache.enRetard ? 'text-red-500 font-medium' : 'text-[#64748B]'}`}>
                    {tache.dateFin ? new Date(tache.dateFin).toLocaleDateString(locale) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full" style={{ width: `${tache.progression}%` }} />
                      </div>
                      <span className="text-xs text-[#64748B]">{tache.progression}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">{tache.projetNom ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {peutModifier(tache) && (
                        <button onClick={() => setEditTache(tache)} className="p-1.5 rounded hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition">
                          <Pencil size={13} />
                        </button>
                      )}
                      <button onClick={() => setConfirmDeleteId(tache.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-[#64748B]">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-[#64748B] hover:bg-gray-50 disabled:opacity-40">
                {t('task_previous')}
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${page === p ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' : 'border border-gray-300 text-[#64748B] hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-[#64748B] hover:bg-gray-50 disabled:opacity-40">
                {t('task_next')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

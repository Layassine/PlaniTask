import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, X, Calendar, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useProjet, Projet, ProjetRequest } from '../context/ProjetContext'
import { useAuth } from '../context/AuthContext'

const statutBadge: Record<string, string> = {
  EN_COURS: 'bg-green-100 text-green-700',
  A_RISQUE: 'bg-orange-100 text-orange-700',
  EN_RETARD: 'bg-red-100 text-red-700',
  TERMINE: 'bg-gray-100 text-gray-600',
  EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
}

const COULEURS = ['#6366F1', '#EC4899', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6']

function ProjetModal({
  onClose, onSaved, projetToEdit,
}: {
  onClose: () => void
  onSaved: () => void
  projetToEdit?: Projet
}) {
  const { t } = useTranslation()
  const { creerProjet, modifierProjet } = useProjet()
  const [form, setForm] = useState<ProjetRequest>(
    projetToEdit
      ? { nom: projetToEdit.nom, description: projetToEdit.description ?? '', couleur: projetToEdit.couleur ?? COULEURS[0], dateDebut: projetToEdit.dateDebut, dateFin: projetToEdit.dateFin }
      : { nom: '', description: '', couleur: COULEURS[0] }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isEdit = !!projetToEdit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const today = new Date().toISOString().split('T')[0]
    const newErrors: Record<string, string> = {}
    if (!form.nom.trim()) newErrors.nom = t('proj_name_required')
    if (!isEdit && form.dateDebut && form.dateDebut < today) {
      newErrors.dateDebut = "La date de début doit être aujourd'hui ou dans le futur"
    }
    if (!isEdit && form.dateFin && form.dateFin < today) {
      newErrors.dateFin = 'La date de fin doit être dans le futur'
    }
    if (form.dateDebut && form.dateFin && form.dateFin <= form.dateDebut) {
      newErrors.dateFin = 'La date de fin doit être après la date de début'
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    setLoading(true)
    try {
      if (projetToEdit) { await modifierProjet(projetToEdit.id, form) } else { await creerProjet(form) }
      onSaved(); onClose()
    } catch (err: any) {
      setError(err.response?.data?.message ?? t('common_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#0F172A]">{isEdit ? t('proj_edit') : t('proj_new')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('proj_name_label')}</label>
            <input value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Ex: Refonte site web"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${errors.nom ? 'border-red-400' : 'border-gray-300'}`} />
            {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('proj_description')}</label>
            <textarea value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3}
              placeholder="Décrivez votre projet..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('proj_date_start')}</label>
              <input type="date" value={form.dateDebut ?? ''}
                min={!isEdit ? new Date().toISOString().split('T')[0] : undefined}
                onChange={(e) => setForm((p) => ({ ...p, dateDebut: e.target.value || undefined }))}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${errors.dateDebut ? 'border-red-400' : 'border-gray-300'}`} />
            {errors.dateDebut && <p className="text-red-500 text-xs mt-1">{errors.dateDebut}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('proj_date_end')}</label>
              <input type="date" value={form.dateFin ?? ''}
                min={!isEdit ? new Date().toISOString().split('T')[0] : undefined}
                onChange={(e) => setForm((p) => ({ ...p, dateFin: e.target.value || undefined }))}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${errors.dateFin ? 'border-red-400' : 'border-gray-300'}`} />
              {errors.dateFin && <p className="text-red-500 text-xs mt-1">{errors.dateFin}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">{t('proj_color')}</label>
            <div className="flex gap-2 flex-wrap">
              {COULEURS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((p) => ({ ...p, couleur: c }))}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.couleur === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-[#64748B] hover:bg-gray-50 transition">
              {t('common_cancel')}
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-60">
              {loading ? t('proj_saving') : isEdit ? t('proj_save') : t('proj_create_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectCard({ projet, onClick, onEdit, onDelete, estChef }: {
  projet: Projet; onClick: () => void; onEdit: (e: React.MouseEvent) => void; onDelete: (e: React.MouseEvent) => void; estChef: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR'
  const statutLabel: Record<string, string> = {
    EN_COURS: t('projet_en_cours'), A_RISQUE: t('projet_a_risque'), EN_RETARD: t('projet_en_retard'),
    TERMINE: t('projet_termine'), EN_ATTENTE: t('projet_en_attente'),
  }
  const avancement = Math.round(projet.avancement)
  const dot = projet.couleur || '#6366F1'
  return (
    <div onClick={onClick} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md hover:border-purple-100 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
          <h3 className="font-semibold text-[#0F172A] text-base leading-tight truncate">{projet.nom}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutBadge[projet.statut] ?? 'bg-gray-100 text-gray-600'}`}>
            {statutLabel[projet.statut] ?? projet.statut}
          </span>
          {estChef && (
            <>
              <button onClick={onEdit} className="p-1 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition" title={t('common_edit')}>
                <Pencil size={13} />
              </button>
              <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title={t('common_delete')}>
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
      {projet.description && <p className="text-sm text-[#64748B] mb-4 line-clamp-2">{projet.description}</p>}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-[#64748B] mb-1.5">
          <span>{t('proj_progress')}</span>
          <span>{avancement}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full" style={{ width: `${avancement}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-[#64748B]">
        <span>{projet.nombreTachesTerminees}/{projet.nombreTaches} tâches</span>
        <span>{projet.nombreMembres} membre{projet.nombreMembres !== 1 ? 's' : ''}</span>
        {projet.dateFin && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {new Date(projet.dateFin).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Projects() {
  const { t, i18n } = useTranslation()
  const { projets, loading, supprimerProjet } = useProjet()
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [editProjet, setEditProjet] = useState<Projet | null>(null)
  const [search, setSearch] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [vue, setVue] = useState<'grid' | 'list'>('grid')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR'

  const statutLabel: Record<string, string> = {
    EN_COURS: t('projet_en_cours'), A_RISQUE: t('projet_a_risque'), EN_RETARD: t('projet_en_retard'),
    TERMINE: t('projet_termine'), EN_ATTENTE: t('projet_en_attente'),
  }

  const filtered = projets.filter((p) => {
    const matchSearch = p.nom.toLowerCase().includes(search.toLowerCase())
    const matchStatut = !filtreStatut || p.statut === filtreStatut
    return matchSearch && matchStatut
  })

  const handleDelete = async (id: number) => {
    try { await supprimerProjet(id) } catch {}
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      {showModal && <ProjetModal onClose={() => setShowModal(false)} onSaved={() => {}} />}
      {editProjet && <ProjetModal projetToEdit={editProjet} onClose={() => setEditProjet(null)} onSaved={() => {}} />}

      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{t('proj_delete_title')}</h3>
            <p className="text-sm text-[#64748B] mb-5">{t('common_irreversible')}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-[#64748B] hover:bg-gray-50">
                {t('common_cancel')}
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                {t('common_delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">{t('nav_projects')}</h1>
          <p className="text-[#64748B] mt-1">{projets.length} projet{projets.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium shadow-sm hover:opacity-90 transition">
          <Plus size={18} /> {t('proj_new')}
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder={t('proj_search')} value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
        </div>
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white">
          <option value="">{t('proj_all_statuts')}</option>
          {Object.entries(statutLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          {(['grid', 'list'] as const).map((v) => (
            <button key={v} onClick={() => setVue(v)}
              className={`p-2.5 transition ${vue === v ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              {v === 'grid' ? <LayoutGrid size={16} /> : <List size={16} />}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#64748B]">
          <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <p className="font-medium">{t('proj_none')}</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-purple-600 hover:underline">
            {t('proj_create_first')}
          </button>
        </div>
      ) : vue === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <ProjectCard key={p.id} projet={p}
              onClick={() => navigate(`/projects/${p.id}`)}
              onEdit={(e) => { e.stopPropagation(); setEditProjet(p) }}
              onDelete={(e) => { e.stopPropagation(); setConfirmDelete(p.id) }}
              estChef={p.proprietaireId === utilisateur?.id} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[t('proj_header_project'), t('proj_header_status'), t('proj_header_tasks'), t('proj_header_progress'), t('proj_header_deadline'), ''].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.couleur || '#6366F1' }} />
                      <div>
                        <p className="font-medium text-[#0F172A]">{p.nom}</p>
                        <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutBadge[p.statut] ?? ''}`}>
                      {statutLabel[p.statut] ?? p.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">{p.nombreTachesTerminees}/{p.nombreTaches}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full" style={{ width: `${Math.round(p.avancement)}%` }} />
                      </div>
                      <span className="text-xs text-[#64748B]">{Math.round(p.avancement)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {p.dateFin ? new Date(p.dateFin).toLocaleDateString(locale) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {p.proprietaireId === utilisateur?.id && (
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setEditProjet(p) }}
                          className="p-1.5 rounded hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition">
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id) }}
                          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition">
                          {t('common_delete')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

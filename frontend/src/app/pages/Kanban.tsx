import React, { useEffect, useState } from 'react'
import { Plus, Clock, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tacheApi, Tache, StatutTache } from '../api/tacheApi'
import { useProjet } from '../context/ProjetContext'
import { useAuth } from '../context/AuthContext'
import { showError } from '../api/axiosConfig'

const prioriteBadge: Record<string, string> = {
  HAUTE: 'bg-red-50 text-red-700', CRITIQUE: 'bg-red-100 text-red-800',
  MOYENNE: 'bg-yellow-50 text-yellow-700', BASSE: 'bg-blue-50 text-blue-700',
}

const PROGRESSION_PAR_STATUT: Partial<Record<StatutTache, number>> = {
  A_FAIRE: 0,
  EN_COURS: 50,
  EN_REVUE: 80,
  TERMINE: 100,
  // BLOQUEE absent → progression non envoyée → valeur gelée
}

export default function Kanban() {
  const { t, i18n } = useTranslation()
  const { projets, projetActif, setProjetActif, refreshProjet } = useProjet()
  const { utilisateur } = useAuth()
  const [taches, setTaches] = useState<Tache[]>([])
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<StatutTache | null>(null)

  const COLONNES: { id: StatutTache; title: string; color: string }[] = [
    { id: 'A_FAIRE', title: t('status_a_faire'), color: 'bg-gray-400' },
    { id: 'EN_COURS', title: t('status_en_cours'), color: 'bg-blue-400' },
    { id: 'EN_REVUE', title: t('status_en_revue'), color: 'bg-orange-400' },
    { id: 'BLOQUEE', title: t('status_bloquee'), color: 'bg-red-400' },
    { id: 'TERMINE', title: t('status_termine'), color: 'bg-green-400' },
  ]

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR'
  const projetSelectionne = projetActif ?? projets[0] ?? null
  const estChef = utilisateur?.id === projetSelectionne?.proprietaireId
  const peutModifier = (tache: Tache) => estChef || tache.assigneeId === utilisateur?.id

  useEffect(() => {
    if (!projetSelectionne) { setTaches([]); return }
    setLoading(true)
    tacheApi.getByProjet(projetSelectionne.id)
      .then((r) => setTaches(r.data))
      .catch(() => setTaches([]))
      .finally(() => setLoading(false))
  }, [projetSelectionne?.id])

  const handleDrop = async (toStatut: StatutTache) => {
    if (dragging === null || !projetSelectionne) { setDragging(null); return }
    const tache = taches.find((t) => t.id === dragging)
    if (!tache || tache.statut === toStatut) { setDragging(null); setDragOverCol(null); return }

    // Block move if task hasn't started yet
    if (tache.dateDebut && new Date(tache.dateDebut) > new Date()) {
      const dateStr = new Date(tache.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      showError(`"${tache.titre}" n'a pas encore commencé (début le ${dateStr})`)
      setDragging(null); setDragOverCol(null); return
    }

    setTaches((prev) => prev.map((t) => t.id === dragging ? { ...t, statut: toStatut } : t))
    try {
      const nouvelleProgression = PROGRESSION_PAR_STATUT[toStatut]
      const res = await tacheApi.update(dragging, {
        titre: tache.titre,
        projetId: tache.projetId,
        statut: toStatut,
        ...(nouvelleProgression !== undefined ? { progression: nouvelleProgression } : {}),
      })
      setTaches((prev) => prev.map((t) => t.id === dragging ? res.data : t))
      refreshProjet(projetSelectionne.id)
    } catch {
      setTaches((prev) => prev.map((t) => t.id === dragging ? { ...t, statut: tache.statut } : t))
    }
    setDragging(null)
    setDragOverCol(null)
  }

  const tachesParCol = (statut: StatutTache) => taches.filter((t) => t.statut === statut)
  const initiales = (nom?: string, prenom?: string) => `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">{t('nav_kanban')}</h1>
          <p className="text-[#64748B] mt-1">{t('kanban_subtitle')}</p>
        </div>
        {projets.length > 0 && (
          <select
            value={projetSelectionne?.id ?? ''}
            onChange={(e) => {
              const p = projets.find((x) => x.id === Number(e.target.value))
              setProjetActif(p ?? null)
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] bg-white"
          >
            {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        )}
      </div>

      {!projetSelectionne ? (
        <div className="text-center py-16 text-[#64748B]">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
          <p>{t('kanban_no_project')}</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4">
          {COLONNES.map((col) => {
            const cards = tachesParCol(col.id)
            const isDragOver = dragOverCol === col.id
            return (
              <div
                key={col.id}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id) }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => handleDrop(col.id)}
                className={`flex-shrink-0 w-72 rounded-xl transition-colors ${isDragOver ? 'bg-purple-50/50' : ''}`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <span className="font-semibold text-[#0F172A] text-sm">{col.title}</span>
                    <span className="text-xs bg-gray-100 text-[#64748B] rounded-full px-2 py-0.5 font-medium">{cards.length}</span>
                  </div>
                </div>

                <div className={`space-y-3 min-h-[120px] rounded-xl p-2 transition-colors ${isDragOver ? 'bg-purple-50' : 'bg-gray-50/50'}`}>
                  {cards.map((tache) => (
                    <div
                      key={tache.id}
                      draggable={peutModifier(tache)}
                      onDragStart={() => peutModifier(tache) && setDragging(tache.id)}
                      onDragEnd={() => { setDragging(null); setDragOverCol(null) }}
                      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all
                        ${peutModifier(tache) ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-purple-100' : 'cursor-not-allowed opacity-60'}
                        ${dragging === tache.id ? 'opacity-40' : ''}
                        ${tache.enRetard ? 'border-l-4 border-l-red-400' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-[#0F172A] leading-tight">{tache.titre}</h3>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${prioriteBadge[tache.priorite] ?? ''}`}>
                          {tache.priorite}
                        </span>
                      </div>
                      {tache.description && <p className="text-xs text-[#64748B] mb-3 line-clamp-2">{tache.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {tache.assigneeId ? (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white text-xs font-bold">
                              {initiales(tache.assigneeNom, tache.assigneePrenom)}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">?</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#64748B]">
                          {tache.dateFin && (
                            <span className={`flex items-center gap-1 ${tache.enRetard ? 'text-red-500 font-medium' : ''}`}>
                              <Clock size={10} />
                              {new Date(tache.dateFin).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                          {tache.tempsEstime && <span>{tache.tempsEstime}h</span>}
                        </div>
                      </div>
                      {tache.progression > 0 && (
                        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full" style={{ width: `${tache.progression}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-300">{t('kanban_drop_here')}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

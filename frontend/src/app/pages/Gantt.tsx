import React, { useEffect, useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tacheApi, Tache } from '../api/tacheApi'
import { useProjet } from '../context/ProjetContext'

const COULEURS_PRIORITE: Record<string, string> = {
  CRITIQUE: 'from-red-500 to-red-700',
  HAUTE: 'from-orange-400 to-red-500',
  MOYENNE: 'from-blue-400 to-indigo-500',
  BASSE: 'from-green-400 to-teal-500',
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000)
}

export default function Gantt() {
  const { t, i18n } = useTranslation()
  const { projets, projetActif, setProjetActif } = useProjet()
  const [taches, setTaches] = useState<Tache[]>([])
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(28)

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR'
  const projetSelectionne = projetActif ?? projets[0] ?? null

  useEffect(() => {
    if (!projetSelectionne) { setTaches([]); return }
    setLoading(true)
    tacheApi.getByProjet(projetSelectionne.id)
      .then((r) => setTaches(r.data.filter((t) => t.dateDebut && t.dateFin)))
      .catch(() => setTaches([]))
      .finally(() => setLoading(false))
  }, [projetSelectionne?.id])

  const tachesAvecDates = taches.filter((t) => t.dateDebut && t.dateFin)

  const minDate = tachesAvecDates.length
    ? new Date(Math.min(...tachesAvecDates.map((t) => new Date(t.dateDebut!).getTime())))
    : new Date()

  const maxDate = tachesAvecDates.length
    ? new Date(Math.max(...tachesAvecDates.map((t) => new Date(t.dateFin!).getTime())))
    : new Date(Date.now() + 30 * 86400000)

  const totalDays = Math.max(daysBetween(minDate, maxDate) + 4, 30)
  const totalWidth = totalDays * zoom

  const dayLabels = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(minDate)
    d.setDate(d.getDate() + i)
    return d
  })

  const initiales = (nom?: string, prenom?: string) => `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">{t('nav_gantt')}</h1>
          <p className="text-[#64748B] mt-1">{t('gantt_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {projets.length > 0 && (
            <select value={projetSelectionne?.id ?? ''} onChange={(e) => setProjetActif(projets.find((x) => x.id === Number(e.target.value)) ?? null)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]">
              {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          )}
          <button onClick={() => setZoom((z) => Math.max(16, z - 4))}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm text-[#64748B] hover:bg-gray-50">
            <ZoomOut size={16} /> {t('gantt_zoom_out')}
          </button>
          <button onClick={() => setZoom((z) => Math.min(56, z + 4))}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm text-[#64748B] hover:bg-gray-50">
            <ZoomIn size={16} /> {t('gantt_zoom_in')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tachesAvecDates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-[#64748B]">
          <p className="font-medium">{t('gantt_no_tasks')}</p>
          <p className="text-sm mt-1">{t('gantt_no_tasks_hint')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex">
            <div className="w-56 flex-shrink-0 border-r border-gray-100">
              <div className="h-12 border-b border-gray-100 flex items-center px-4 bg-gray-50">
                <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{t('gantt_task_col')}</span>
              </div>
              {tachesAvecDates.map((tache) => (
                <div key={tache.id} className="h-14 border-b border-gray-50 flex items-center gap-2 px-4 hover:bg-gray-50">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initiales(tache.assigneeNom, tache.assigneePrenom)}
                  </div>
                  <span className="text-sm text-[#0F172A] font-medium truncate" title={tache.titre}>{tache.titre}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-x-auto">
              <div style={{ width: totalWidth, minWidth: '100%' }}>
                <div className="h-12 border-b border-gray-100 flex items-end bg-gray-50">
                  {dayLabels.map((d, i) => (
                    <div key={i} style={{ width: zoom }} className="flex-shrink-0 text-center pb-1 border-r border-gray-100">
                      {(i === 0 || d.getDate() === 1 || i % Math.max(1, Math.floor(7 / (zoom / 28))) === 0) && (
                        <span className="text-xs text-[#64748B]">{d.toLocaleDateString(locale, { day: '2-digit', month: 'short' })}</span>
                      )}
                    </div>
                  ))}
                </div>
                {tachesAvecDates.map((tache) => {
                  const start = daysBetween(minDate, new Date(tache.dateDebut!))
                  const dur = Math.max(1, daysBetween(new Date(tache.dateDebut!), new Date(tache.dateFin!)))
                  const left = start * zoom + 2
                  const width = dur * zoom - 4
                  const color = COULEURS_PRIORITE[tache.priorite] ?? 'from-blue-400 to-indigo-500'
                  return (
                    <div key={tache.id} className="h-14 border-b border-gray-50 relative" style={{ width: totalWidth }}>
                      {dayLabels.map((_, i) => (
                        <div key={i} style={{ left: i * zoom, width: zoom }} className="absolute h-full border-r border-gray-50" />
                      ))}
                      <div title={tache.titre} style={{ left, width }} className="absolute top-3 h-8 rounded-lg overflow-hidden shadow-sm group">
                        <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-15`} />
                        <div className={`absolute top-0 left-0 h-full bg-gradient-to-r ${color} transition-all`} style={{ width: `${tache.progression}%` }} />
                        {width > 60 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-semibold text-white drop-shadow truncate px-2">{tache.titre}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { tacheApi } from '../api/tacheApi'
import axiosInstance from '../api/axiosConfig'
import { useProjet } from '../context/ProjetContext'

interface JalonDto { id: number; nom: string; dateEcheance?: string; atteint: boolean }
interface CalEvent { id: string; titre: string; date: string; type: 'deadline' | 'milestone' | 'retard' }

const eventColor: Record<string, string> = {
  deadline: 'bg-blue-100 text-blue-700 border-blue-200',
  milestone: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  retard: 'bg-red-100 text-red-700 border-red-200',
}

export default function Calendar() {
  const { t } = useTranslation()
  const { projets } = useProjet()
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)

  const DAY_NAMES = [
    t('cal_day_0'), t('cal_day_1'), t('cal_day_2'), t('cal_day_3'),
    t('cal_day_4'), t('cal_day_5'), t('cal_day_6'),
  ]
  const MONTH_NAMES = [
    t('cal_month_0'), t('cal_month_1'), t('cal_month_2'), t('cal_month_3'),
    t('cal_month_4'), t('cal_month_5'), t('cal_month_6'), t('cal_month_7'),
    t('cal_month_8'), t('cal_month_9'), t('cal_month_10'), t('cal_month_11'),
  ]

  useEffect(() => {
    const all: Promise<CalEvent[]>[] = []

    all.push(
      tacheApi.getMesTaches().then((r) =>
        r.data.filter((t) => t.dateFin).map((tache): CalEvent => ({
          id: `tache-${tache.id}`,
          titre: tache.titre,
          date: tache.dateFin!,
          type: tache.enRetard ? 'retard' : 'deadline',
        }))
      ).catch(() => [])
    )

    for (const p of projets) {
      all.push(
        axiosInstance.get<JalonDto[]>(`/projets/${p.id}/jalons`).then((r) =>
          r.data.filter((j) => j.dateEcheance).map((j): CalEvent => ({
            id: `jalon-${j.id}`,
            titre: `${p.nom} — ${j.nom}`,
            date: j.dateEcheance!,
            type: 'milestone',
          }))
        ).catch(() => [])
      )
    }

    Promise.all(all).then((results) => {
      setEvents(results.flat())
    }).finally(() => setLoading(false))
  }, [projets.length])

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const eventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e) => e.date.startsWith(dateStr))
  }

  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">{t('nav_calendar')}</h1>
        <p className="text-[#64748B] mt-1">{t('cal_subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-gray-100 text-[#64748B] transition">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-[#0F172A]">{MONTH_NAMES[month]} {year}</h2>
          <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-gray-100 text-[#64748B] transition">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-[#64748B] uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayEvents = day ? eventsForDay(day) : []
            return (
              <div key={i} className={`min-h-[100px] p-2 border-b border-r border-gray-50 ${day ? 'hover:bg-gray-50/50 cursor-pointer' : 'bg-gray-50/30'}`}>
                {day && (
                  <>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1 font-medium ${
                      isToday(day) ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' : 'text-[#0F172A] hover:bg-gray-100'
                    }`}>{day}</div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} title={ev.titre}
                          className={`text-xs px-1.5 py-0.5 rounded border truncate font-medium ${eventColor[ev.type]}`}>
                          {ev.titre}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-[#64748B] px-1">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-6 px-6 py-3 border-t border-gray-100">
          <span className="text-xs text-[#64748B] font-medium">{t('cal_legend')}</span>
          {[
            { type: 'deadline', label: t('cal_deadline') },
            { type: 'retard', label: t('cal_late') },
            { type: 'milestone', label: t('cal_milestone') },
          ].map((l) => (
            <div key={l.type} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${eventColor[l.type as keyof typeof eventColor].split(' ')[0]}`} />
              <span className="text-xs text-[#64748B]">{l.label}</span>
            </div>
          ))}
          {loading && <span className="text-xs text-[#94A3B8] ml-2">{t('common_loading')}</span>}
        </div>
      </div>
    </div>
  )
}

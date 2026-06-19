import React, { useEffect, useState } from 'react'
import { FolderOpen, CheckSquare, AlertTriangle, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../api/axiosConfig'

const PIE_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#94A3B8', '#EC4899']

const prioriteBadge: Record<string, string> = {
  HAUTE: 'bg-red-50 text-red-700', CRITIQUE: 'bg-red-100 text-red-800',
  MOYENNE: 'bg-yellow-50 text-yellow-700', BASSE: 'bg-blue-50 text-blue-700',
}

function relativeTime(dateStr: string, t: (k: string, o?: any) => string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (mins < 1) return t('time_just_now')
  if (mins < 60) return t('time_mins_ago', { n: mins })
  if (hrs < 24) return t('time_hours_ago', { n: hrs })
  if (days === 1) return t('time_yesterday')
  return t('time_days_ago', { n: days })
}

interface DashboardStats {
  projetsActifs: number
  tachesCompletees: number
  tachesEnRetard: number
  workloadEquipe: number
  activiteRecente: { id: number; message: string; type: string; dateCreation: string; lue: boolean }[]
  deadlinesAVenir: { id: number; titre: string; projetNom: string; dateFin: string; priorite: string; enRetard: boolean }[]
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axiosInstance.get<DashboardStats>('/dashboard/stats'),
      axiosInstance.get<any[]>('/taches/mes-taches'),
    ]).then(([statsRes, tachesRes]) => {
      setStats(statsRes.data)
      const statusMap: Record<string, number> = {}
      const statusLabels: Record<string, string> = {
        A_FAIRE: t('status_a_faire'), EN_COURS: t('status_en_cours'), EN_REVUE: t('status_en_revue'),
        BLOQUEE: t('status_bloquee'), TERMINE: t('status_termine'),
      }
      for (const tache of tachesRes.data) {
        const label = statusLabels[tache.statut] ?? tache.statut
        statusMap[label] = (statusMap[label] || 0) + 1
      }
      setPieData(Object.entries(statusMap).map(([name, value]) => ({ name, value })))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [i18n.language])

  const typeLabels: Record<string, string> = {
    TACHE_ASSIGNEE: t('notif_type_assignee_short'),
    TACHE_TERMINEE: t('notif_type_done_short'),
    TACHE_EN_RETARD: t('notif_type_late_short'),
    JALON_ATTEINT: t('notif_type_milestone_short'),
    PROJET_CREE: t('notif_type_project_short'),
    PROJET_EN_RETARD: t('notif_type_project_late_short'),
    MEMBRE_AJOUTE: t('notif_type_team_short'),
    COMMENTAIRE: t('notif_type_comment_short'),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const kpiCards = [
    { label: t('dashboard_active_projects'), value: stats?.projetsActifs ?? 0, icon: FolderOpen, color: 'from-pink-500 to-purple-600', bg: 'bg-pink-50' },
    { label: t('dashboard_completed_tasks'), value: stats?.tachesCompletees ?? 0, icon: CheckSquare, color: 'from-[#0EA5E9] to-[#06B6D4]', bg: 'bg-sky-50' },
    { label: t('dashboard_late_tasks'), value: stats?.tachesEnRetard ?? 0, icon: AlertTriangle, color: 'from-orange-400 to-red-500', bg: 'bg-orange-50', isLate: true },
    { label: t('dashboard_avg_progress'), value: `${stats?.workloadEquipe ?? 0}%`, icon: TrendingUp, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50' },
  ]

  const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">{t('dashboard_title')}</h1>
        <p className="text-[#64748B] mt-1">{t('dashboard_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <div className={`w-6 h-6 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center`}>
                    <Icon size={14} className="text-white" />
                  </div>
                </div>
                {(card as any).isLate && (card.value as number) > 0 && (
                  <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    {t('dashboard_action_required')}
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-[#0F172A]">{card.value}</div>
              <div className="text-sm text-[#64748B] mt-1">{card.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">{t('dashboard_distribution')}</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-[#64748B]">
              <CheckSquare size={36} className="text-gray-200 mb-2" />
              <p className="text-sm">{t('dashboard_no_tasks')}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">{t('dashboard_recent_activity')}</h2>
          {!stats?.activiteRecente.length ? (
            <p className="text-sm text-[#64748B]">{t('dashboard_no_activity')}</p>
          ) : (
            <ul className="space-y-4">
              {stats.activiteRecente.map((n) => (
                <li key={n.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{typeLabels[n.type] ?? 'Notification'}</p>
                    <p className="text-xs text-[#64748B]">{n.message}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{relativeTime(n.dateCreation, t)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">{t('dashboard_upcoming')}</h2>
          {!stats?.deadlinesAVenir.length ? (
            <p className="text-sm text-[#64748B]">{t('dashboard_no_deadlines')}</p>
          ) : (
            <ul className="space-y-3">
              {stats.deadlinesAVenir.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${d.enRetard ? 'text-red-600' : 'text-[#0F172A]'}`}>{d.titre}</p>
                    <p className="text-xs text-[#64748B]">{d.projetNom}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioriteBadge[d.priorite] ?? 'bg-gray-100 text-gray-600'}`}>
                      {d.priorite}
                    </span>
                    <span className={`text-xs ${d.enRetard ? 'text-red-500 font-semibold' : 'text-[#64748B]'}`}>
                      {new Date(d.dateFin).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

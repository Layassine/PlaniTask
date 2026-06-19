import React, { useEffect, useState } from 'react'
import { Bell, Clock, UserPlus, MessageSquare, CheckCircle2, Users, Trash2, Check, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { notificationApi, Notification, TypeNotification } from '../api/notificationApi'

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

export default function Notifications() {
  const { t } = useTranslation()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const typeMap: Record<TypeNotification, { icon: React.ElementType; bg: string; text: string; titre: string }> = {
    TACHE_ASSIGNEE:   { icon: UserPlus,      bg: 'bg-blue-100',   text: 'text-blue-600',   titre: t('notif_tache_assignee') },
    TACHE_TERMINEE:   { icon: CheckCircle2,  bg: 'bg-green-100',  text: 'text-green-600',  titre: t('notif_tache_terminee') },
    TACHE_EN_RETARD:  { icon: Clock,         bg: 'bg-red-100',    text: 'text-red-600',    titre: t('notif_tache_en_retard') },
    JALON_ATTEINT:    { icon: CheckCircle2,  bg: 'bg-yellow-100', text: 'text-yellow-600', titre: t('notif_jalon_atteint') },
    PROJET_CREE:      { icon: Bell,          bg: 'bg-purple-100', text: 'text-purple-600', titre: t('notif_projet_cree') },
    PROJET_EN_RETARD: { icon: AlertTriangle, bg: 'bg-orange-100', text: 'text-orange-600', titre: t('notif_projet_en_retard') },
    MEMBRE_AJOUTE:    { icon: Users,         bg: 'bg-sky-100',    text: 'text-sky-600',    titre: t('notif_membre_ajoute') },
    COMMENTAIRE:      { icon: MessageSquare, bg: 'bg-pink-100',   text: 'text-pink-600',   titre: t('notif_commentaire') },
  }

  useEffect(() => {
    notificationApi.getAll()
      .then((r) => setNotifs(r.data))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false))
  }, [])

  const marquerLue = async (id: number) => {
    try { await notificationApi.marquerLue(id) } catch {}
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, lue: true } : n))
  }

  const marquerToutesLues = async () => {
    try { await notificationApi.marquerToutesLues() } catch {}
    setNotifs((prev) => prev.map((n) => ({ ...n, lue: true })))
  }

  const supprimer = async (id: number) => {
    try { await notificationApi.supprimer(id) } catch {}
    setNotifs((prev) => prev.filter((n) => n.id !== id))
  }

  const nonLues = notifs.filter((n) => !n.lue).length

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">{t('notif_title')}</h1>
          <p className="text-[#64748B] mt-1">
            {nonLues > 0
              ? `${nonLues} notification${nonLues > 1 ? 's' : ''} non lue${nonLues > 1 ? 's' : ''}`
              : t('notif_up_to_date')}
          </p>
        </div>
        {nonLues > 0 && (
          <button onClick={marquerToutesLues}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-[#0F172A] hover:bg-gray-50">
            <Check size={16} /> {t('notif_mark_all')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#64748B]">
            <Bell size={48} className="mb-4 text-gray-300" />
            <p className="font-medium">{t('notif_empty')}</p>
          </div>
        ) : notifs.map((n) => {
          const cfg = typeMap[n.type] ?? typeMap.COMMENTAIRE
          const Icon = cfg.icon
          return (
            <div key={n.id}
              className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition group ${!n.lue ? 'bg-blue-50/30' : ''}`}>
              <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={18} className={cfg.text} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${!n.lue ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>{cfg.titre}</p>
                  {!n.lue && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                </div>
                <p className="text-sm text-[#64748B] mt-0.5">{n.message}</p>
                <p className="text-xs text-[#94A3B8] mt-1">{relativeTime(n.dateCreation, t)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                {!n.lue && (
                  <button onClick={() => marquerLue(n.id)}
                    className="p-1.5 rounded-lg hover:bg-blue-100 text-[#64748B] hover:text-blue-600 transition">
                    <Check size={14} />
                  </button>
                )}
                <button onClick={() => supprimer(n.id)}
                  className="p-1.5 rounded-lg hover:bg-red-100 text-[#64748B] hover:text-red-600 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, FolderKanban, CheckSquare, Kanban,
  GanttChartSquare, Users, BarChart3, Bell, Settings, LogOut, CalendarDays,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { utilisateur, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const navItems = [
    { to: '/dashboard',      icon: LayoutDashboard,  label: t('nav_dashboard') },
    { to: '/projects',       icon: FolderKanban,     label: t('nav_projects') },
    { to: '/tasks',          icon: CheckSquare,      label: t('nav_tasks') },
    { to: '/kanban',         icon: Kanban,           label: t('nav_kanban') },
    { to: '/gantt',          icon: GanttChartSquare, label: t('nav_gantt') },
    { to: '/calendar',       icon: CalendarDays,     label: t('nav_calendar') },
    { to: '/team',           icon: Users,            label: t('nav_team') },
    { to: '/reports',        icon: BarChart3,        label: t('nav_reports') },
    { to: '/notifications',  icon: Bell,             label: t('nav_notifications') },
    { to: '/settings',       icon: Settings,         label: t('nav_settings') },
  ]

  const initiales = utilisateur
    ? `${utilisateur.prenom?.[0] ?? ''}${utilisateur.nom?.[0] ?? ''}`.toUpperCase()
    : 'U'

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 flex flex-col bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] z-40">
      <div className="px-6 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] bg-clip-text text-transparent">
          PlaniTask
        </h1>
        <p className="text-slate-400 text-xs mt-1">{t('nav_subtitle')}</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-4 py-3 rounded-2xl text-white font-medium text-sm bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] scale-105 shadow-lg transition-all duration-200'
                : 'flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 text-sm hover:bg-white/5 hover:text-white transition-all duration-200'
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            {initiales}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Utilisateur'}
            </p>
            <p className="text-slate-400 text-xs truncate">
              {utilisateur?.poste ?? utilisateur?.email ?? ''}
            </p>
          </div>
          <button
            onClick={logout}
            title={t('nav_logout')}
            className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

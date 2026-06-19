import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { notificationApi } from '../../api/notificationApi'

export default function Navbar() {
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const [nonLues, setNonLues] = useState(0)

  useEffect(() => {
    const fetchCount = () => {
      notificationApi.getCompteur()
        .then((r) => setNonLues(r.data.nonLues))
        .catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const initiales = utilisateur
    ? `${utilisateur.prenom?.[0] ?? ''}${utilisateur.nom?.[0] ?? ''}`.toUpperCase()
    : 'U'

  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-30 flex items-center justify-end px-8 gap-4">
      <button
        onClick={() => { navigate('/notifications'); setNonLues(0) }}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {nonLues > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold leading-none">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      <button
        onClick={() => navigate('/profile')}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity"
        title={utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : 'Profil'}
      >
        {initiales}
      </button>
    </header>
  )
}

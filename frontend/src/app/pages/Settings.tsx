import React, { useState } from 'react'
import { User, Lock, Bell, Sliders, Save, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axiosConfig'

type Tab = 'account' | 'password' | 'notifications' | 'preferences'

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
      <CheckCircle size={16} /> {message}
    </div>
  )
}

export default function Settings() {
  const { utilisateur, updateUtilisateur } = useAuth()
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(false)

  const [account, setAccount] = useState({
    prenom: utilisateur?.prenom ?? '',
    nom: utilisateur?.nom ?? '',
    email: utilisateur?.email ?? '',
    poste: '',
    telephone: '',
  })

  const [passwords, setPasswords] = useState({ actuel: '', nouveau: '', confirm: '' })
  const [pwError, setPwError] = useState('')

  const [notifSettings, setNotifSettings] = useState({
    deadlines: true, assignments: true, comments: true,
    statusChanges: true, teamUpdates: false, emailDigest: false,
  })

  const [selectedLang, setSelectedLang] = useState(
    localStorage.getItem('planitask_lang') || 'fr'
  )

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'account',       label: t('settings_account'),       icon: User },
    { key: 'password',      label: t('settings_password'),      icon: Lock },
    { key: 'notifications', label: t('settings_notifications'), icon: Bell },
    { key: 'preferences',   label: t('settings_preferences'),   icon: Sliders },
  ]

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axiosInstance.put('/utilisateurs/me', {
        prenom: account.prenom, nom: account.nom, email: account.email,
        poste: account.poste, telephone: account.telephone,
      })
      updateUtilisateur({ prenom: res.data.prenom, nom: res.data.nom, email: res.data.email })
      showToast(t('settings_profile_saved'))
    } catch (err: any) {
      showToast(err.response?.data?.message ?? t('common_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (passwords.nouveau !== passwords.confirm) { setPwError(t('settings_pw_mismatch')); return }
    if (passwords.nouveau.length < 6) { setPwError(t('settings_pw_too_short')); return }
    setLoading(true)
    try {
      await axiosInstance.put('/utilisateurs/me/password', { actuel: passwords.actuel, nouveau: passwords.nouveau })
      showToast(t('settings_password_saved'))
      setPasswords({ actuel: '', nouveau: '', confirm: '' })
    } catch (err: any) {
      const status = err.response?.status
      setPwError(status === 401 ? t('settings_pw_wrong') : t('settings_pw_change_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    localStorage.setItem('planitask_lang', selectedLang)
    document.documentElement.lang = selectedLang
    await i18n.changeLanguage(selectedLang)
    showToast(t('settings_saved'))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A]">{t('settings_title')}</h1>
        <p className="text-[#64748B] mt-1">{t('settings_subtitle')}</p>
      </div>

      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-left transition border-b border-gray-50 last:border-0 ${
                    activeTab === tab.key ? 'bg-gradient-to-r from-pink-500/10 to-purple-600/10 text-purple-700' : 'text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A]'
                  }`}>
                  <Icon size={16} />{tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1">
          {toast && <Toast message={toast} />}

          {activeTab === 'account' && (
            <form onSubmit={handleSaveAccount} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-[#0F172A]">{t('settings_account_info')}</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t('settings_firstname'), key: 'prenom' },
                  { label: t('settings_lastname'), key: 'nom' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{f.label}</label>
                    <input value={(account as any)[f.key]}
                      onChange={(e) => setAccount((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Email</label>
                <input type="email" value={account.email} onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('settings_position')}</label>
                  <input value={account.poste} onChange={(e) => setAccount((p) => ({ ...p, poste: e.target.value }))}
                    placeholder="Ex: Développeur"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{t('settings_phone')}</label>
                  <input value={account.telephone} onChange={(e) => setAccount((p) => ({ ...p, telephone: e.target.value }))}
                    placeholder="+33 6 00 00 00 00"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-60">
                <Save size={16} /> {loading ? t('settings_saving') : t('settings_save')}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-[#0F172A]">{t('settings_change_pw')}</h2>
              {pwError && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{pwError}</div>}
              {[
                { label: t('settings_current_pw'), key: 'actuel' },
                { label: t('settings_new_pw'), key: 'nouveau' },
                { label: t('settings_confirm_pw'), key: 'confirm' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1.5">{f.label}</label>
                  <input type="password" value={(passwords as any)[f.key]}
                    onChange={(e) => setPasswords((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" />
                </div>
              ))}
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-60">
                <Save size={16} /> {loading ? t('settings_updating') : t('settings_update')}
              </button>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="text-lg font-semibold text-[#0F172A]">{t('settings_notif_prefs')}</h2>
              {[
                { key: 'deadlines',     label: t('settings_notif_deadlines'),    desc: t('settings_notif_deadlines_desc') },
                { key: 'assignments',   label: t('settings_notif_assignments'),  desc: t('settings_notif_assignments_desc') },
                { key: 'comments',      label: t('settings_notif_comments'),     desc: t('settings_notif_comments_desc') },
                { key: 'statusChanges', label: t('settings_notif_status'),       desc: t('settings_notif_status_desc') },
                { key: 'teamUpdates',   label: t('settings_notif_team'),         desc: t('settings_notif_team_desc') },
                { key: 'emailDigest',   label: t('settings_notif_email'),        desc: t('settings_notif_email_desc') },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{item.label}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle checked={(notifSettings as any)[item.key]}
                    onChange={() => setNotifSettings((p) => ({ ...p, [item.key]: !(p as any)[item.key] }))} />
                </div>
              ))}
              <button onClick={() => showToast(t('settings_saved'))}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:opacity-90">
                <Save size={16} /> {t('settings_save')}
              </button>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-[#0F172A]">{t('settings_preferences')}</h2>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">{t('settings_language')}</label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white w-48 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                >
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
              <button onClick={handleSavePreferences}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:opacity-90">
                <Save size={16} /> {t('settings_save')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

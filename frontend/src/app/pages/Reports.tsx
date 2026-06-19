import React, { useEffect, useState } from 'react'
import { FileDown, FileSpreadsheet, TrendingUp, CheckCircle, BarChart2, AlertTriangle } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useProjet } from '../context/ProjetContext'
import { tacheApi, Tache } from '../api/tacheApi'
import axiosInstance from '../api/axiosConfig'
import { showSuccess, showError } from '../api/axiosConfig'

const PIE_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#94A3B8', '#EC4899']

const statutTacheLabel: Record<string, string> = {
  A_FAIRE: 'À faire', EN_COURS: 'En cours', EN_REVUE: 'En révision',
  BLOQUEE: 'Bloqué', TERMINE: 'Terminé',
}

async function downloadFile(url: string, filename: string) {
  const res = await axiosInstance.get(url, { responseType: 'blob' })
  const blob = new Blob([res.data], { type: (res.headers['content-type'] as string) || 'application/octet-stream' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(href)
}

export default function Reports() {
  const { projets } = useProjet()
  const [taches, setTaches] = useState<Tache[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProjet, setSelectedProjet] = useState<number | null>(null)
  const [exportLoadingPdf, setExportLoadingPdf] = useState(false)
  const [exportLoadingXls, setExportLoadingXls] = useState(false)

  useEffect(() => {
    tacheApi.getMesTaches().then((r) => setTaches(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (projets.length > 0 && selectedProjet === null) setSelectedProjet(projets[0].id)
  }, [projets])

  const totalTaches = taches.length
  const terminees = taches.filter((t) => t.statut === 'TERMINE').length
  const enRetard = taches.filter((t) => t.enRetard).length
  const taux = totalTaches > 0 ? Math.round((terminees / totalTaches) * 100) : 0

  const pieData = Object.entries(
    taches.reduce((acc, t) => { acc[t.statut] = (acc[t.statut] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([k, v]) => ({ name: statutTacheLabel[k] ?? k, value: v }))

  const projetHealth = projets.map((p) => ({
    nom: p.nom.length > 18 ? p.nom.substring(0, 18) + '...' : p.nom,
    sante: Math.round(p.avancement),
  }))

  const handleExportPdf = async () => {
    if (!selectedProjet) { showError('Sélectionnez un projet'); return }
    setExportLoadingPdf(true)
    try {
      const projet = projets.find((p) => p.id === selectedProjet)
      await downloadFile(`/rapports/export/pdf?projetId=${selectedProjet}`,
        `rapport_${projet?.nom ?? 'projet'}.pdf`)
      showSuccess('Rapport PDF téléchargé')
    } catch {
      showError('Erreur lors de la génération du PDF')
    } finally {
      setExportLoadingPdf(false)
    }
  }

  const handleExportExcel = async () => {
    if (!selectedProjet) { showError('Sélectionnez un projet'); return }
    setExportLoadingXls(true)
    try {
      const projet = projets.find((p) => p.id === selectedProjet)
      await downloadFile(`/rapports/export/excel?projetId=${selectedProjet}`,
        `rapport_${projet?.nom ?? 'projet'}.xlsx`)
      showSuccess('Rapport Excel téléchargé')
    } catch {
      showError('Erreur lors de la génération du fichier Excel')
    } finally {
      setExportLoadingXls(false)
    }
  }

  const kpiCards = [
    { label: 'Total projets', value: String(projets.length), icon: BarChart2, color: 'from-pink-500 to-purple-600', bg: 'bg-pink-50' },
    { label: 'Taux de complétion', value: `${taux}%`, icon: CheckCircle, color: 'from-green-400 to-teal-500', bg: 'bg-green-50' },
    { label: 'Tâches complétées', value: String(terminees), icon: TrendingUp, color: 'from-[#0EA5E9] to-[#06B6D4]', bg: 'bg-sky-50' },
    { label: 'Tâches en retard', value: String(enRetard), icon: AlertTriangle, color: 'from-orange-400 to-red-500', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Rapports</h1>
          <p className="text-[#64748B] mt-1">Analyses et indicateurs de performance</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {projets.length > 0 && (
            <select value={selectedProjet ?? ''} onChange={(e) => setSelectedProjet(e.target.value ? Number(e.target.value) : null)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]">
              <option value="">Choisir un projet</option>
              {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          )}
          <button onClick={handleExportPdf} disabled={exportLoadingPdf || !selectedProjet}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium text-[#0F172A] hover:bg-gray-50 disabled:opacity-50 transition">
            <FileDown size={16} /> {exportLoadingPdf ? 'Génération...' : 'Export PDF'}
          </button>
          <button onClick={handleExportExcel} disabled={exportLoadingXls || !selectedProjet}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-medium text-[#0F172A] hover:bg-gray-50 disabled:opacity-50 transition">
            <FileSpreadsheet size={16} /> {exportLoadingXls ? 'Génération...' : 'Export Excel'}
          </button>
        </div>
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
              </div>
              <div className="text-3xl font-bold text-[#0F172A]">{card.value}</div>
              <div className="text-sm text-[#64748B] mt-1">{card.label}</div>
            </div>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Distribution des statuts</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} tâche${v > 1 ? 's' : ''}`]} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-[#64748B] text-center py-16">Aucune tâche disponible</p>}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Avancement des projets</h2>
            {projetHealth.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={projetHealth} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis dataKey="nom" type="category" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Avancement']} />
                  <Bar dataKey="sante" radius={[0, 6, 6, 0]} fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-[#64748B] text-center py-16">Aucun projet disponible</p>}
          </div>
        </div>
      )}

      {projets.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-6">Santé des projets</h2>
          <div className="space-y-5">
            {projets.map((p) => {
              const sante = Math.round(p.avancement)
              const color = p.statut === 'EN_RETARD' ? 'from-red-400 to-red-600'
                : p.statut === 'A_RISQUE' ? 'from-orange-400 to-yellow-400'
                : p.statut === 'TERMINE' ? 'from-gray-300 to-gray-400'
                : 'from-green-400 to-teal-500'
              return (
                <div key={p.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      {p.couleur && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.couleur }} />}
                      <span className="text-sm font-medium text-[#0F172A]">{p.nom}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#64748B]">{p.nombreTachesTerminees}/{p.nombreTaches} tâches</span>
                      <span className="text-sm font-bold text-[#0F172A]">{sante}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${sante}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

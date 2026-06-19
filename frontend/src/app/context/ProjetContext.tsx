import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axiosInstance from '../api/axiosConfig'
import { useAuth } from './AuthContext'

export interface Projet {
  id: number
  nom: string
  description?: string
  statut: 'EN_COURS' | 'A_RISQUE' | 'EN_RETARD' | 'TERMINE' | 'EN_ATTENTE'
  avancement: number
  dateDebut?: string
  dateFin?: string
  couleur?: string
  proprietaireId?: number
  proprietaireNom?: string
  proprietairePrenom?: string
  proprietaireEmail?: string
  proprietaireAvatar?: string
  nombreMembres: number
  nombreTaches: number
  nombreTachesTerminees: number
  nombreTachesEnRetard: number
  nombreJalons: number
  nombreJalonsAtteints: number
  dateCreation?: string
}

export interface ProjetRequest {
  nom: string
  description?: string
  dateDebut?: string
  dateFin?: string
  couleur?: string
}

interface ProjetContextType {
  projets: Projet[]
  projetActif: Projet | null
  loading: boolean
  error: string | null
  fetchProjets: () => Promise<void>
  refreshProjet: (id: number) => Promise<void>
  setProjetActif: (projet: Projet | null) => void
  creerProjet: (data: ProjetRequest) => Promise<Projet>
  modifierProjet: (id: number, data: ProjetRequest) => Promise<Projet>
  supprimerProjet: (id: number) => Promise<void>
}

const ProjetContext = createContext<ProjetContextType | undefined>(undefined)

export function ProjetProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [projets, setProjets] = useState<Projet[]>([])
  const [projetActif, setProjetActif] = useState<Projet | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjets = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get('/projets')
      setProjets(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur chargement projets')
    } finally {
      setLoading(false)
    }
  }

  const refreshProjet = async (id: number) => {
    try {
      const res = await axiosInstance.get<Projet>(`/projets/${id}`)
      setProjets((prev) => prev.map((p) => p.id === id ? res.data : p))
      if (projetActif?.id === id) setProjetActif(res.data)
    } catch {}
  }

  const creerProjet = async (data: ProjetRequest): Promise<Projet> => {
    const res = await axiosInstance.post('/projets', data)
    setProjets((prev) => [res.data, ...prev])
    return res.data
  }

  const modifierProjet = async (id: number, data: ProjetRequest): Promise<Projet> => {
    const res = await axiosInstance.put(`/projets/${id}`, data)
    setProjets((prev) => prev.map((p) => (p.id === id ? res.data : p)))
    if (projetActif?.id === id) setProjetActif(res.data)
    return res.data
  }

  const supprimerProjet = async (id: number) => {
    await axiosInstance.delete(`/projets/${id}`)
    setProjets((prev) => prev.filter((p) => p.id !== id))
    if (projetActif?.id === id) setProjetActif(null)
  }

  useEffect(() => {
    if (isAuthenticated) fetchProjets()
  }, [isAuthenticated])

  return (
    <ProjetContext.Provider value={{
      projets, projetActif, loading, error,
      fetchProjets, refreshProjet, setProjetActif,
      creerProjet, modifierProjet, supprimerProjet,
    }}>
      {children}
    </ProjetContext.Provider>
  )
}

export function useProjet(): ProjetContextType {
  const ctx = useContext(ProjetContext)
  if (!ctx) throw new Error('useProjet doit être utilisé dans ProjetProvider')
  return ctx
}

export default ProjetContext

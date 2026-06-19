import axiosInstance from './axiosConfig'

export type StatutTache = 'A_FAIRE' | 'EN_COURS' | 'EN_REVUE' | 'BLOQUEE' | 'TERMINE'
export type PrioriteTache = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE'

export interface Tache {
  id: number
  titre: string
  description?: string
  projetId: number
  projetNom?: string
  assigneeId?: number
  assigneeNom?: string
  assigneePrenom?: string
  assigneeEmail?: string
  assigneeAvatar?: string
  statut: StatutTache
  priorite: PrioriteTache
  dateDebut?: string
  dateFin?: string
  progression: number
  tempsEstime?: number
  tempsReel?: number
  enRetard: boolean
  dateCreation?: string
}

export interface TacheRequest {
  titre: string
  description?: string
  projetId: number
  assigneeId?: number | null
  statut?: StatutTache
  priorite?: PrioriteTache
  dateDebut?: string
  dateFin?: string
  progression?: number
  tempsEstime?: number
  tempsReel?: number
}

export const tacheApi = {
  getByProjet: (projetId: number) => axiosInstance.get<Tache[]>(`/taches?projetId=${projetId}`),
  getMesTaches: () => axiosInstance.get<Tache[]>('/taches/mes-taches'),
  getById: (id: number) => axiosInstance.get<Tache>(`/taches/${id}`),
  create: (data: TacheRequest) => axiosInstance.post<Tache>('/taches', data),
  update: (id: number, data: Partial<TacheRequest>) => axiosInstance.put<Tache>(`/taches/${id}`, data),
  delete: (id: number) => axiosInstance.delete(`/taches/${id}`),
}

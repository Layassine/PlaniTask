import axiosInstance from './axiosConfig'

export type TypeNotification =
  | 'TACHE_ASSIGNEE' | 'TACHE_TERMINEE' | 'TACHE_EN_RETARD'
  | 'JALON_ATTEINT' | 'PROJET_CREE' | 'PROJET_EN_RETARD'
  | 'MEMBRE_AJOUTE' | 'COMMENTAIRE'

export interface Notification {
  id: number
  message: string
  type: TypeNotification
  lue: boolean
  projetId?: number
  tacheId?: number
  dateCreation: string
}

export const notificationApi = {
  getAll: () => axiosInstance.get<Notification[]>('/notifications'),
  getNonLues: () => axiosInstance.get<Notification[]>('/notifications/non-lues'),
  getCompteur: () => axiosInstance.get<{ nonLues: number }>('/notifications/compteur'),
  marquerLue: (id: number) => axiosInstance.put(`/notifications/${id}/lire`),
  marquerToutesLues: () => axiosInstance.put('/notifications/lire-toutes'),
  supprimer: (id: number) => axiosInstance.delete(`/notifications/${id}`),
}

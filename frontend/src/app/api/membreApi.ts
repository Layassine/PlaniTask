import axiosInstance from './axiosConfig'

export type RoleProjet = 'CHEF_DE_PROJET' | 'PROPRIETAIRE' | 'ADMIN' | 'MEMBRE' | 'OBSERVATEUR'

export interface Membre {
  id: number
  utilisateurId: number
  nom: string
  prenom: string
  email: string
  avatar?: string
  role: RoleProjet
  dateAjout?: string
}

export const membreApi = {
  getByProjet: (projetId: number) =>
    axiosInstance.get<Membre[]>(`/projets/${projetId}/membres`),
  ajouter: (projetId: number, utilisateurId: number, role: RoleProjet) =>
    axiosInstance.post<Membre>(`/projets/${projetId}/membres`, { utilisateurId, role }),
  changerRole: (projetId: number, userId: number, role: RoleProjet) =>
    axiosInstance.patch<Membre>(`/projets/${projetId}/membres/${userId}/role`, { role }),
  retirer: (projetId: number, userId: number) =>
    axiosInstance.delete(`/projets/${projetId}/membres/${userId}`),
}

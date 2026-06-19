import axiosInstance from './axiosConfig'

export type FormatRapport = 'PDF' | 'EXCEL' | 'CSV' | 'HTML'

export interface Rapport {
  id: number
  nom: string
  projetId: number
  projetNom?: string
  format: FormatRapport
  contenu?: string
  generePar?: string
  dateGeneration?: string
}

export const rapportApi = {
  generer: (projetId: number, format: FormatRapport = 'HTML') =>
    axiosInstance.post<Rapport>(`/rapports/generer/${projetId}`, { format }),
  getByProjet: (projetId: number) =>
    axiosInstance.get<Rapport[]>(`/rapports/projet/${projetId}`),
}

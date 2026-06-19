import axiosInstance from './axiosConfig'
import type { Projet, ProjetRequest } from '../context/ProjetContext'

export const projetApi = {
  getAll: () => axiosInstance.get<Projet[]>('/projets'),
  getById: (id: number) => axiosInstance.get<Projet>(`/projets/${id}`),
  create: (data: ProjetRequest) => axiosInstance.post<Projet>('/projets', data),
  update: (id: number, data: ProjetRequest) => axiosInstance.put<Projet>(`/projets/${id}`, data),
  delete: (id: number) => axiosInstance.delete(`/projets/${id}`),
}

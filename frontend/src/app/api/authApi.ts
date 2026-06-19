import axiosInstance from './axiosConfig'

export interface LoginRequest { email: string; motDePasse: string }
export interface RegisterRequest { nom: string; prenom: string; email: string; motDePasse: string }
export interface JwtResponse { token: string; type: string; id: number; email: string; nom: string; prenom: string; avatar?: string }

export const authApi = {
  login: (data: LoginRequest) => axiosInstance.post<JwtResponse>('/auth/login', data),
  register: (data: RegisterRequest) => axiosInstance.post<JwtResponse>('/auth/register', data),
}

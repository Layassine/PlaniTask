import React, { createContext, useContext, useState, ReactNode } from 'react'
import axiosInstance from '../api/axiosConfig'

export interface Utilisateur {
  id: number
  prenom: string
  nom: string
  email: string
  poste?: string
  avatar?: string
}

interface AuthContextType {
  token: string | null
  utilisateur: Utilisateur | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { nom: string; prenom: string; email: string; motDePasse: string }) => Promise<void>
  logout: () => void
  updateUtilisateur: (data: Partial<Utilisateur>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function parseJwtResponse(data: any): { token: string; user: Utilisateur } {
  return {
    token: data.token,
    user: {
      id: data.id,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      avatar: data.avatar ?? undefined,
    },
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const isAuthenticated = !!token && !!utilisateur

  const persist = (tok: string, user: Utilisateur) => {
    localStorage.setItem('token', tok)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(tok)
    setUtilisateur(user)
  }

  const login = async (email: string, password: string) => {
    const res = await axiosInstance.post('/auth/login', { email, motDePasse: password })
    const { token: jwt, user } = parseJwtResponse(res.data)
    persist(jwt, user)
  }

  const register = async (data: { nom: string; prenom: string; email: string; motDePasse: string }) => {
    const res = await axiosInstance.post('/auth/register', data)
    const { token: jwt, user } = parseJwtResponse(res.data)
    persist(jwt, user)
  }

  const logout = () => {
    setToken(null)
    setUtilisateur(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const updateUtilisateur = (data: Partial<Utilisateur>) => {
    setUtilisateur((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...data }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ token, utilisateur, isAuthenticated, login, register, logout, updateUtilisateur }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return context
}

export default AuthContext

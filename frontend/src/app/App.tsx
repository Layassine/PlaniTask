import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProjetProvider } from './context/ProjetContext'
import AppRoutes from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjetProvider>
          <AppRoutes />
        </ProjetProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

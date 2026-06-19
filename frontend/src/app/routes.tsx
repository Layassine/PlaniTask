import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import MainLayout from './components/layout/MainLayout'

import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetails from './pages/ProjectDetails'
import Tasks from './pages/Tasks'
import Kanban from './pages/Kanban'
import Gantt from './pages/Gantt'
import Calendar from './pages/Calendar'
import Team from './pages/Team'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import UserProfile from './pages/UserProfile'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/gantt" element={<Gantt />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/team" element={<Team />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<UserProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

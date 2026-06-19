import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <Navbar />
      <main className="ml-72 pt-20 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

/**
 * App
 * -----
 * Root component — sets up React Router routes.
 */
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

export default App

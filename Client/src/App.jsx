import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'

/**
 * App
 * -----
 * Root component — sets up React Router routes.
 * Currently a single route, but structured for easy expansion.
 */
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

export default App

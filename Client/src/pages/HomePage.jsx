import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { checkServerHealth, loadHistory } from '../store/slices/scanSlice'
import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import LiveScanner from '../components/LiveScanner'
import ScanHistory from '../components/ScanHistory'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'

/**
 * HomePage
 * ----------
 * Main landing page assembling all sections.
 * Dispatches initial server health check and
 * history load on mount.
 */
const HomePage = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(checkServerHealth())
    dispatch(loadHistory())
  }, [dispatch])

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      <main>
        <HeroSection />
        <LiveScanner />
        <ScanHistory />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}

export default HomePage

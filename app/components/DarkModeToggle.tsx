'use client'

import { useEffect, useState } from 'react'

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDarkMode = savedMode ? savedMode === 'true' : prefersDark
    
    setDarkMode(initialDarkMode)
    if (initialDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <>
          <span className="text-2xl">☀️</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Light Mode</span>
        </>
      ) : (
        <>
          <span className="text-2xl">🌙</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</span>
        </>
      )}
    </button>
  )
}

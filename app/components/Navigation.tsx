'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          <Link
            href="/"
            className={`px-4 py-2 rounded-lg transition-colors ${
              pathname === '/'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🔍 Debug Console
          </Link>
          <Link
            href="/articles"
            className={`px-4 py-2 rounded-lg transition-colors ${
              pathname === '/articles'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            📰 Articles
          </Link>
          <Link
            href="/scraper"
            className={`px-4 py-2 rounded-lg transition-colors ${
              pathname === '/scraper'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🔧 Monitor
          </Link>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Request & Email Logger
        </div>
      </div>
    </nav>
  )
}

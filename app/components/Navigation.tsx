'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DarkModeToggle from './DarkModeToggle'

export default function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: '🔍 Debug Console', icon: '🔧' },
    { href: '/articles', label: '📰 Articles', icon: '📖' },
    { href: '/scraper', label: '🔧 Scraper Monitor', icon: '📡' },
  ]

  return (
    <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-8 p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex space-x-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                pathname === link.href
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <DarkModeToggle />
      </div>
    </nav>
  )
}

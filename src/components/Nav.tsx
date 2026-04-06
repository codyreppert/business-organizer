'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

const links = [
  { href: '/assets', label: 'Assets' },
  { href: '/trips', label: 'Trips' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/chat', label: 'Chat' },
  { href: '/reports', label: 'Reports' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-bold text-indigo-600 dark:text-gray-100 shrink-0">
            Business Organizer
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-gray-800 dark:text-indigo-400'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}

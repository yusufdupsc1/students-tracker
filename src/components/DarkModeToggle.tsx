import { useEffect, useState } from 'react'

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = saved ? saved === 'dark' : prefersDark
    setIsDark(initial)
    if (initial) document.documentElement.classList.add('dark')
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition-colors bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
      aria-label="Toggle dark mode"
    >
      <span className="text-base">{isDark ? '☀' : '☾'}</span>
      {isDark ? 'লাইট' : 'ডার্ক'}
    </button>
  )
}

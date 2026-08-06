import { type ReactNode } from 'react'

export function EmptyState({
  icon = '◈',
  title,
  description,
  action,
  compact = false,
}: {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`rounded-[1.5rem] border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50/50 via-white to-emerald-50/20 text-center ${compact ? 'p-6' : 'p-8 md:p-12'}`}>
      <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto mb-4 text-xl">
        {icon}
      </div>
      <h3 className="font-heading font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

export function EmptyIllustration({ className = 'w-32 h-32' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className + ' mx-auto'} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="160" height="100" rx="16" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5"/>
      <rect x="30" y="45" width="40" height="6" rx="3" fill="#86efac"/>
      <rect x="30" y="60" width="140" height="4" rx="2" fill="#d1fae5"/>
      <rect x="30" y="70" width="120" height="4" rx="2" fill="#d1fae5"/>
      <rect x="30" y="80" width="100" height="4" rx="2" fill="#d1fae5"/>
      <circle cx="150" cy="90" r="18" fill="#10b981" opacity="0.15"/>
      <path d="M140 90 L148 98 L162 82" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

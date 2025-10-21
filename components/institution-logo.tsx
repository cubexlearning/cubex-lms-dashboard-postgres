'use client'

import { useSettings } from '@/contexts/SettingsContext'
import Image from 'next/image'

interface InstitutionLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
}

export function InstitutionLogo({ className = '', size = 'md', showName = false }: InstitutionLogoProps) {
  const { settings } = useSettings()

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-16 w-16 text-2xl'
  }

  // Get first letter of institution name for fallback
  const getInitials = () => {
    if (!settings?.institutionName) return 'I'
    return settings.institutionName.charAt(0).toUpperCase()
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {settings?.institutionLogo ? (
        <div className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden flex-shrink-0`}>
          <Image
            src={settings.institutionLogo}
            alt={settings.institutionName || 'Institution Logo'}
            fill
            className="object-contain"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none'
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.innerHTML = `
                  <div class="flex items-center justify-center h-full w-full rounded-lg bg-blue-600 text-white font-bold ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-2xl'}">
                    ${getInitials()}
                  </div>
                `
              }
            }}
          />
        </div>
      ) : (
        <div className={`flex items-center justify-center ${sizeClasses[size]} rounded-lg bg-blue-600 text-white font-bold flex-shrink-0`}>
          {getInitials()}
        </div>
      )}
      {showName && settings?.institutionName && (
        <span className="font-semibold text-gray-900 truncate">
          {settings.institutionName}
        </span>
      )}
    </div>
  )
}

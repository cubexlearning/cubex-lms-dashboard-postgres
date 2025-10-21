'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface InstitutionSettings {
  id: string
  institutionName: string
  institutionLogo?: string
  institutionWebsite?: string
  contactEmail: string
  contactPhone?: string
  address?: string
  registrationNumber?: string
  primaryCurrency: string
  country: string
  defaultTimezone: string
  dateFormat: string
  numberFormat: string
  language: string
  academicYearStructure: 'SEMESTER' | 'TRIMESTER' | 'QUARTER'
  gradingSystem: 'PERCENTAGE' | 'LETTER' | 'NUMERIC'
  ageGroups: string[]
  qualificationLevels: string[]
  paymentMethods: ('CARD' | 'BANK_TRANSFER' | 'PAYPAL' | 'STRIPE' | 'CASH')[]
  taxRate: number
  taxInclusive: boolean
  refundPolicyDays: number
  minimumCoursePrice?: number
  maximumCoursePrice?: number
  defaultSessionDuration: number
  maxGroupSize: number
  minGroupSize: number
  bookingLeadTimeHours: number
  cancellationNoticeHours: number
  emailFromName: string
  emailFromAddress: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface SettingsContextType {
  settings: InstitutionSettings | null
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
  getCurrencySymbol: () => string
  formatCurrency: (amount: number) => string
  formatDate: (date: Date) => string
  formatNumber: (number: number) => string
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<InstitutionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/settings')
      const result = await response.json()
      
      if (result.success) {
        setSettings(result.data)
      } else {
        setError(result.error || 'Failed to load settings')
      }
    } catch (err) {
      setError('Failed to load settings')
      console.error('Error loading settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshSettings = async () => {
    await loadSettings()
  }

  // Currency formatting helpers
  const getCurrencySymbol = () => {
    if (!settings) return '£'
    
    const currencySymbols: Record<string, string> = {
      'GBP': '£',
      'USD': '$',
      'EUR': '€',
      'INR': '₹',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CNY': '¥',
      'SGD': 'S$',
      'AED': 'د.إ',
    }
    
    return currencySymbols[settings.primaryCurrency] || '£'
  }

  const formatCurrency = (amount: number) => {
    if (!settings) return `£${amount.toFixed(2)}`
    
    const formatter = new Intl.NumberFormat(settings.numberFormat, {
      style: 'currency',
      currency: settings.primaryCurrency,
    })
    
    return formatter.format(amount)
  }

  const formatDate = (date: Date) => {
    if (!settings) return date.toLocaleDateString()
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: settings.defaultTimezone,
    }
    
    // Set format based on settings
    switch (settings.dateFormat) {
      case 'DD/MM/YYYY':
        options.day = '2-digit'
        options.month = '2-digit'
        options.year = 'numeric'
        break
      case 'MM/DD/YYYY':
        options.month = '2-digit'
        options.day = '2-digit'
        options.year = 'numeric'
        break
      case 'YYYY-MM-DD':
        options.year = 'numeric'
        options.month = '2-digit'
        options.day = '2-digit'
        break
    }
    
    return date.toLocaleDateString(settings.language, options)
  }

  const formatNumber = (number: number) => {
    if (!settings) return number.toString()
    
    return new Intl.NumberFormat(settings.numberFormat).format(number)
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const value: SettingsContextType = {
    settings,
    loading,
    error,
    refreshSettings,
    getCurrencySymbol,
    formatCurrency,
    formatDate,
    formatNumber,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

// Hook for easy access to specific settings
export function useCurrency() {
  const { settings, formatCurrency, getCurrencySymbol } = useSettings()
  return {
    currency: settings?.primaryCurrency || 'GBP',
    symbol: getCurrencySymbol(),
    format: formatCurrency,
  }
}

export function useTimezone() {
  const { settings } = useSettings()
  return settings?.defaultTimezone || 'Europe/London'
}

export function useDateFormat() {
  const { settings, formatDate } = useSettings()
  return {
    format: settings?.dateFormat || 'DD/MM/YYYY',
    formatter: formatDate,
  }
}
import { prisma, ensurePrismaConnected } from '@/lib/db'

export interface InstitutionEmailData {
  institutionName: string
  institutionLogo?: string
  contactEmail: string
  contactPhone?: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  emailFromName: string
  emailFromAddress: string
  address?: string
  website?: string
}

let cachedSettings: InstitutionEmailData | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getInstitutionSettings(): Promise<InstitutionEmailData> {
  const now = Date.now()
  
  // Return cached settings if still valid
  if (cachedSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedSettings
  }

  try {
    await ensurePrismaConnected()
    
    const settings = await prisma.institutionSettings.findFirst({
      where: { isActive: true },
      select: {
        institutionName: true,
        institutionLogo: true,
        contactEmail: true,
        contactPhone: true,
        brandPrimaryColor: true,
        brandSecondaryColor: true,
        emailFromName: true,
        emailFromAddress: true,
        address: true,
        institutionWebsite: true,
      }
    })

    if (!settings) {
      // Fallback to default values if no settings found
      const defaultSettings: InstitutionEmailData = {
        institutionName: 'Learning Management System',
        contactEmail: 'support@lms.com',
        brandPrimaryColor: '#3B82F6',
        brandSecondaryColor: '#10B981',
        emailFromName: 'LMS System',
        emailFromAddress: 'noreply@lms.com',
      }
      cachedSettings = defaultSettings
      lastFetchTime = now
      return defaultSettings
    }

    const institutionData: InstitutionEmailData = {
      institutionName: settings.institutionName,
      institutionLogo: settings.institutionLogo || undefined,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone || undefined,
      brandPrimaryColor: settings.brandPrimaryColor,
      brandSecondaryColor: settings.brandSecondaryColor,
      emailFromName: settings.emailFromName,
      emailFromAddress: settings.emailFromAddress,
      address: settings.address || undefined,
      website: settings.institutionWebsite || undefined,
    }

    cachedSettings = institutionData
    lastFetchTime = now
    return institutionData

  } catch (error) {
    console.error('Error fetching institution settings:', error)
    
    // Return fallback settings on error
    const fallbackSettings: InstitutionEmailData = {
      institutionName: 'Learning Management System',
      contactEmail: 'support@lms.com',
      brandPrimaryColor: '#3B82F6',
      brandSecondaryColor: '#10B981',
      emailFromName: 'LMS System',
      emailFromAddress: 'noreply@lms.com',
    }
    return fallbackSettings
  }
}

// Clear cache when settings are updated
export function clearInstitutionCache(): void {
  cachedSettings = null
  lastFetchTime = 0
}

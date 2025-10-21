import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface InstitutionSettings {
  id: string
  primaryCurrency: string
  defaultTimezone: string
  // Add other fields as needed
}

export async function getInstitutionSettings(): Promise<InstitutionSettings | null> {
  try {
    const settings = await prisma.institutionSettings.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        primaryCurrency: true,
        defaultTimezone: true,
      }
    })
    
    return settings
  } catch (error) {
    console.error('Error fetching institution settings:', error)
    return null
  }
}

export async function getDefaultCurrency(): Promise<string> {
  const settings = await getInstitutionSettings()
  return settings?.primaryCurrency || 'GBP'
}

export async function getDefaultTimezone(): Promise<string> {
  const settings = await getInstitutionSettings()
  return settings?.defaultTimezone || 'Europe/London'
}

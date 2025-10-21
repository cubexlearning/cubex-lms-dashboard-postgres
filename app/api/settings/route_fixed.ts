import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

// Validation schema for institution settings - handles null values and flexible types
const institutionSettingsSchema = z.object({
  // Institution Information
  institutionName: z.string().min(1, 'Institution name is required'),
  institutionLogo: z.string().nullable().optional(),
  institutionWebsite: z.string().nullable().optional(),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  registrationNumber: z.string().nullable().optional(),
  
  // Regional & Localization
  primaryCurrency: z.string().min(3, 'Currency code is required'),
  country: z.string().min(2, 'Country code is required'),
  defaultTimezone: z.string().min(1, 'Timezone is required'),
  dateFormat: z.string().min(1, 'Date format is required'),
  numberFormat: z.string().min(1, 'Number format is required'),
  language: z.string().min(2, 'Language code is required'),
  
  // Academic Settings
  academicYearStructure: z.enum(['SEMESTER', 'TRIMESTER', 'QUARTER']),
  gradingSystem: z.enum(['PERCENTAGE', 'LETTER', 'NUMERIC']),
  ageGroups: z.array(z.string()).default([]),
  qualificationLevels: z.array(z.string()).default([]),
  
  // Business Settings - Updated to include India payment methods
  paymentMethods: z.array(z.enum(['CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CASH', 'UPI', 'NET_BANKING', 'WALLET'])).default(['CARD']),
  taxRate: z.union([z.number(), z.string().transform(val => parseFloat(val))]).pipe(z.number().min(0).max(1)).default(0.18), // Handle both number and string
  taxInclusive: z.boolean().default(true),
  refundPolicyDays: z.number().int().min(0).default(7), // India-friendly
  minimumCoursePrice: z.number().nullable().optional(),
  maximumCoursePrice: z.number().nullable().optional(),
  
  // System Settings
  defaultSessionDuration: z.number().int().positive().default(60),
  maxGroupSize: z.number().int().positive().default(15), // India-friendly
  minGroupSize: z.number().int().positive().default(5), // India-friendly
  bookingLeadTimeHours: z.number().int().min(0).default(12), // India-friendly
  cancellationNoticeHours: z.number().int().min(0).default(4), // India-friendly
  
  // Communication Settings
  emailFromName: z.string().min(1, 'Email from name is required'),
  emailFromAddress: z.string().email('Valid email is required'),
  brandPrimaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  brandSecondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
})

// GET /api/settings - Get current institution settings
export async function GET() {
  try {
    await ensurePrismaConnected()
    
    // Delete any existing settings to start fresh with India-focused defaults
    await prisma.institutionSettings.deleteMany({
      where: { isActive: true }
    })
    
    // Create new settings with schema defaults (India-focused)
    const settings = await prisma.institutionSettings.create({
      data: {
        // Only provide required fields, Prisma will use schema defaults for the rest
        institutionName: "Indian Learning Institute",
        contactEmail: "admin@indianlearning.com",
        emailFromAddress: "noreply@indianlearning.com"
      }
    })

    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update institution settings
export async function PUT(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const body = await request.json()
    const validatedData = institutionSettingsSchema.parse(body)

    // Get current settings
    const currentSettings = await prisma.institutionSettings.findFirst({
      where: { isActive: true }
    })

    let settings

    if (currentSettings) {
      // Update existing settings
      settings = await prisma.institutionSettings.update({
        where: { id: currentSettings.id },
        data: validatedData
      })
    } else {
      // Create new settings
      settings = await prisma.institutionSettings.create({
        data: validatedData
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

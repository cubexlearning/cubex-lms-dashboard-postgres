'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AdminLayout } from '@/components/layouts/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building2, Globe, GraduationCap, CreditCard, Settings, Palette, Mail, Image } from 'lucide-react'
import { isValidPhoneNumber } from 'libphonenumber-js'

// Separate validation schemas for each tab
const institutionSchema = z.object({
  institutionName: z.string()
    .min(2, 'Institution name must be at least 2 characters')
    .max(100, 'Institution name must not exceed 100 characters'),
  institutionLogo: z.string()
    .optional(),
  institutionWebsite: z.string()
    .optional(),
  contactEmail: z.string()
    .email('Must be a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must not exceed 100 characters'),
  contactPhone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .refine((val) => {
      if (!val) return true
      try {
        return isValidPhoneNumber(val)
      } catch {
        return false
      }
    }, 'Must be a valid phone number'),
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  registrationNumber: z.string()
    .min(3, 'Registration number must be at least 3 characters')
    .max(50, 'Registration number must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
})

const regionalSchema = z.object({
  primaryCurrency: z.string()
    .min(3, 'Currency code must be 3 characters')
    .max(3, 'Currency code must be 3 characters'),
  country: z.string()
    .min(2, 'Country code must be at least 2 characters')
    .max(2, 'Country code must be 2 characters'),
  defaultTimezone: z.string()
    .min(3, 'Timezone is required'),
  dateFormat: z.string()
    .min(8, 'Date format is required'),
  numberFormat: z.string()
    .min(2, 'Number format is required'),
  language: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(5, 'Language code must not exceed 5 characters'),
})

const academicSchema = z.object({
  academicYearStructure: z.string()
    .min(1, 'Academic year structure is required'),
  gradingSystem: z.string()
    .min(1, 'Grading system is required'),
  ageGroups: z.array(z.string()).optional(),
  qualificationLevels: z.array(z.string()).optional(),
})

const businessSchema = z.object({
  paymentMethods: z.array(z.string())
    .min(1, 'At least one payment method is required'),
  taxRate: z.number()
    .min(0, 'Tax rate must be at least 0')
    .max(100, 'Tax rate must not exceed 100'),
  taxInclusive: z.boolean().optional(),
  refundPolicyDays: z.number()
    .int('Refund policy days must be a whole number')
    .min(0, 'Refund policy days must be at least 0')
    .max(365, 'Refund policy days must not exceed 365'),
  minimumCoursePrice: z.number()
    .min(0, 'Minimum price must be at least 0'),
  maximumCoursePrice: z.number()
    .min(0, 'Maximum price must be at least 0')
}).refine((data) => {
  if (data.minimumCoursePrice !== undefined && data.maximumCoursePrice !== undefined) {
    return data.minimumCoursePrice <= data.maximumCoursePrice
  }
  return true
}, {
  message: 'Minimum price must be less than or equal to maximum price',
  path: ['maximumCoursePrice'],
})

const systemSchema = z.object({
  defaultSessionDuration: z.number()
    .int('Session duration must be a whole number')
    .min(15, 'Session duration must be at least 15 minutes')
    .max(480, 'Session duration must not exceed 480 minutes (8 hours)')
    .optional(),
  maxGroupSize: z.number()
    .int('Group size must be a whole number')
    .min(1, 'Maximum group size must be at least 1')
    .max(100, 'Maximum group size must not exceed 100')
    .optional(),
  minGroupSize: z.number()
    .int('Group size must be a whole number')
    .min(1, 'Minimum group size must be at least 1')
    .max(100, 'Minimum group size must not exceed 100')
    .optional(),
  bookingLeadTimeHours: z.number()
    .int('Lead time must be a whole number')
    .min(0, 'Lead time must be at least 0 hours')
    .max(720, 'Lead time must not exceed 720 hours (30 days)')
    .optional(),
  cancellationNoticeHours: z.number()
    .int('Notice hours must be a whole number')
    .min(0, 'Notice hours must be at least 0')
    .max(168, 'Notice hours must not exceed 168 hours (7 days)')
    .optional(),
}).refine((data) => {
  if (data.minGroupSize !== undefined && data.maxGroupSize !== undefined) {
    return data.minGroupSize <= data.maxGroupSize
  }
  return true
}, {
  message: 'Minimum group size must be less than or equal to maximum group size',
  path: ['maxGroupSize'],
})

const communicationSchema = z.object({
  emailFromName: z.string()
    .min(2, 'Email from name must be at least 2 characters')
    .max(100, 'Email from name must not exceed 100 characters'),
  emailFromAddress: z.string()
    .email('Must be a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must not exceed 100 characters'),
  brandPrimaryColor: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color (e.g., #FF6B35)')
    .optional()
    .or(z.literal('')),
  brandSecondaryColor: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color (e.g., #00A86B)')
    .optional()
    .or(z.literal('')),
})

type InstitutionData = z.infer<typeof institutionSchema>
type RegionalData = z.infer<typeof regionalSchema>
type AcademicData = z.infer<typeof academicSchema>
type BusinessData = z.infer<typeof businessSchema>
type SystemData = z.infer<typeof systemSchema>
type CommunicationData = z.infer<typeof communicationSchema>

type SettingsData = InstitutionData & RegionalData & AcademicData & BusinessData & SystemData & CommunicationData

// Institution Settings Component
function InstitutionSettings({ 
  initialData, 
  onSave, 
  saving 
}: { 
  initialData: SettingsData | null
  onSave: (data: Partial<SettingsData>) => Promise<void>
  saving: boolean 
}) {
  const form = useForm<InstitutionData>({
    resolver: zodResolver(institutionSchema),
    mode:"onChange"
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        institutionName: initialData.institutionName,
        institutionLogo: initialData.institutionLogo,
        institutionWebsite: initialData.institutionWebsite,
        contactEmail: initialData.contactEmail,
        contactPhone: initialData.contactPhone,
        address: initialData.address,
        registrationNumber: initialData.registrationNumber,
      })
    }
  }, [initialData, form])

  const handleSave = async () => {
    const values = form.getValues()
    await onSave(values)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Institution Information</CardTitle>
        <CardDescription>
          Basic information about your institution
        </CardDescription>
      </CardHeader>
      <CardContent className="">
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="institutionName">Institution Name *</Label>
            <Input
              id="institutionName"
              {...form.register('institutionName')}
              placeholder="e.g., Indian Learning Institute"
              required
              minLength={2}
              maxLength={100}
            />
            {form.formState.errors.institutionName && (
              <p className="text-sm text-red-600">{form.formState.errors.institutionName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              {...form.register('contactEmail')}
              placeholder="admin@institution.com"
              required
              minLength={5}
              maxLength={100}
            />
            {form.formState.errors.contactEmail && (
              <p className="text-sm text-red-600">{form.formState.errors.contactEmail.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="institutionLogo" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Institution Logo URL
          </Label>
          <Input
            id="institutionLogo"
            type="string"
            {...form.register('institutionLogo')}
            placeholder="https://example.com/logo.png"
            maxLength={500}
          />
          <p className="text-xs text-gray-500">
            Enter the URL of your institution's logo. If no logo is provided, we'll use your institution's initials.
          </p>
          {form.watch('institutionLogo') ? (
            <div className="mt-2 p-4 border rounded-lg bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">Preview:</p>
              <img 
                src={form.watch('institutionLogo')} 
                alt="Institution Logo" 
                className="h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement)?.style && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex')
                }}
              />
              <div className="hidden items-center justify-center h-16 w-16 rounded-lg bg-blue-600 text-white text-2xl font-bold">
                {form.watch('institutionName')?.charAt(0) || 'I'}
              </div>
            </div>
          ) : (
            <div className="mt-2 p-4 border rounded-lg bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">Default (using initials):</p>
              <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-blue-600 text-white text-2xl font-bold">
                {form.watch('institutionName')?.charAt(0) || 'I'}
              </div>
            </div>
          )}
          {form.formState.errors.institutionLogo && (
              <p className="text-sm text-red-600">{form.formState.errors.institutionLogo.message}</p>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="institutionWebsite">Website</Label>
            <Input
              id="institutionWebsite"
              type="url"
              {...form.register('institutionWebsite')}
              placeholder="https://institution.com"
              maxLength={200}
            />
            {form.formState.errors.institutionWebsite && (
              <p className="text-sm text-red-600">{form.formState.errors.institutionWebsite.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone Number *</Label>
            <Input
              id="contactPhone"
              type="tel"
              {...form.register('contactPhone')}
              placeholder="+1234567890"
              required
              minLength={10}
              maxLength={20}
            />
            {form.formState.errors.contactPhone && (
              <p className="text-sm text-red-600">{form.formState.errors.contactPhone.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            {...form.register('address')}
            placeholder="123 Main Street, City, State, Country"
            rows={3}
            minLength={10}
            maxLength={500}
          />
          {form.formState.errors.address && (
            <p className="text-sm text-red-600">{form.formState.errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input
            id="registrationNumber"
            {...form.register('registrationNumber')}
            placeholder="Company registration number"
            minLength={3}
            maxLength={50}
          />
          {form.formState.errors.registrationNumber && (
            <p className="text-sm text-red-600">{form.formState.errors.registrationNumber.message}</p>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave}
            disabled={saving || form.formState.isSubmitting || Object.keys(form.formState.errors).length>0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save Institution Settings'}
          </Button>
        </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Regional Settings Component
function RegionalSettings({ 
  initialData, 
  onSave, 
  saving 
}: { 
  initialData: SettingsData | null
  onSave: (data: Partial<SettingsData>) => Promise<void>
  saving: boolean 
}) {
  const form = useForm<RegionalData>({
    resolver: zodResolver(regionalSchema),
    mode: 'onChange',
    defaultValues:{
       primaryCurrency: initialData?.primaryCurrency,
        country: initialData?.country,
        defaultTimezone: initialData?.defaultTimezone,
        dateFormat: initialData?.dateFormat,
        numberFormat: initialData?.numberFormat,
        language: initialData?.language,
    }
  })

  const handleSave = async () => {
    const values = form.getValues()
    await onSave(values)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional & Localization</CardTitle>
        <CardDescription>
          Configure currency, timezone, and regional settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryCurrency">Primary Currency *</Label>
            <Select 
              value={form.watch('primaryCurrency')} 
              onValueChange={(value) => form.setValue('primaryCurrency', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                <SelectItem value="AED">AED - UAE Dirham</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.primaryCurrency && (
              <p className="text-sm text-red-600">{form.formState.errors.primaryCurrency.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Select 
              value={form.watch('country')} 
              onValueChange={(value) => form.setValue('country', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="IN">India</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="FR">France</SelectItem>
                <SelectItem value="ES">Spain</SelectItem>
                <SelectItem value="IT">Italy</SelectItem>
                <SelectItem value="SG">Singapore</SelectItem>
                <SelectItem value="AE">United Arab Emirates</SelectItem>
                <SelectItem value="CN">China</SelectItem>
                <SelectItem value="JP">Japan</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.country && (
              <p className="text-sm text-red-600">{form.formState.errors.country.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="defaultTimezone">Default Timezone *</Label>
            <Select 
              value={form.watch('defaultTimezone')} 
              onValueChange={(value) => form.setValue('defaultTimezone', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/London">Europe/London</SelectItem>
                <SelectItem value="America/New_York">America/New_York</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                <SelectItem value="America/Toronto">America/Toronto</SelectItem>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (India)</SelectItem>
                <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.defaultTimezone && (
              <p className="text-sm text-red-600">{form.formState.errors.defaultTimezone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language *</Label>
            <Select 
              value={form.watch('language')} 
              onValueChange={(value) => form.setValue('language', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.language && (
              <p className="text-sm text-red-600">{form.formState.errors.language.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format *</Label>
            <Select 
              value={form.watch('dateFormat')} 
              onValueChange={(value) => form.setValue('dateFormat', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK/India)</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.dateFormat && (
              <p className="text-sm text-red-600">{form.formState.errors.dateFormat.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="numberFormat">Number Format *</Label>
            <Select 
              value={form.watch('numberFormat')} 
              onValueChange={(value) => form.setValue('numberFormat', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-GB">1,234.56 (UK/India)</SelectItem>
                <SelectItem value="en-US">1,234.56 (US)</SelectItem>
                <SelectItem value="en-IN">1,23,456.78 (India)</SelectItem>
                <SelectItem value="de-DE">1.234,56 (German)</SelectItem>
                <SelectItem value="fr-FR">1 234,56 (French)</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.numberFormat && (
              <p className="text-sm text-red-600">{form.formState.errors.numberFormat.message}</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            type="submit"
            disabled={saving || form.formState.isSubmitting || Object.keys(form.formState.errors).length>0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save Regional Settings'}
          </Button>
        </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Academic Settings Component
function AcademicSettings({ 
  initialData, 
  onSave, 
  saving 
}: { 
  initialData: SettingsData | null
  onSave: (data: Partial<SettingsData>) => Promise<void>
  saving: boolean 
}) {
  const form = useForm<AcademicData>({
    resolver: zodResolver(academicSchema),
    mode: "onChange",
    defaultValues:{
      academicYearStructure: initialData?.academicYearStructure,
        gradingSystem: initialData?.gradingSystem,
        ageGroups: initialData?.ageGroups,
        qualificationLevels: initialData?.qualificationLevels,
    }
  })

  const handleSave = async () => {
    const values = form.getValues()
    await onSave(values)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Settings</CardTitle>
        <CardDescription>
          Configure academic year structure and grading systems
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="academicYearStructure">Academic Year Structure *</Label>
              <Select 
                value={form.watch('academicYearStructure')} 
                onValueChange={(value) => form.setValue('academicYearStructure', value as any)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMESTER">Semester (2 terms)</SelectItem>
                  <SelectItem value="TRIMESTER">Trimester (3 terms)</SelectItem>
                  <SelectItem value="QUARTER">Quarter (4 terms)</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.academicYearStructure && (
                <p className="text-sm text-red-600">{form.formState.errors.academicYearStructure.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradingSystem">Grading System *</Label>
              <Select 
                value={form.watch('gradingSystem')} 
                onValueChange={(value) => form.setValue('gradingSystem', value as any)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grading system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (0-100%)</SelectItem>
                  <SelectItem value="LETTER">Letter Grades (A-F)</SelectItem>
                  <SelectItem value="NUMERIC">Numeric (1-10)</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.gradingSystem && (
                <p className="text-sm text-red-600">{form.formState.errors.gradingSystem.message}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              type="submit"
              disabled={saving || form.formState.isSubmitting || Object.keys(form.formState.errors).length>0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Academic Settings'}
            </Button>
          </div>
      </form>
      </CardContent>
    </Card>
  )
}

// Business Settings Component
function BusinessSettings({ 
  initialData, 
  onSave, 
  saving 
}: { 
  initialData: SettingsData | null
  onSave: (data: Partial<SettingsData>) => Promise<void>
  saving: boolean 
}) {
  const form = useForm<BusinessData>({
    resolver: zodResolver(businessSchema),
    mode: "onChange",
    defaultValues:{
        paymentMethods: initialData?.paymentMethods,
        taxRate: initialData?.taxRate,
        taxInclusive: initialData?.taxInclusive,
        refundPolicyDays: initialData?.refundPolicyDays,
        minimumCoursePrice: initialData?.minimumCoursePrice,
        maximumCoursePrice: initialData?.maximumCoursePrice,
      }
  })

  const handleSave = async () => {
    const values = form.getValues()
    await onSave(values)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Settings</CardTitle>
        <CardDescription>
          Configure payment methods, tax settings, and pricing policies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSave)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Methods</Label>
              <div className="flex flex-wrap gap-2">
                {(['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CASH'] as const).map((method) => (
                  <Badge
                    key={method}
                    variant={form.watch('paymentMethods')?.includes(method) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = form.getValues('paymentMethods') || []
                      const updated = current.includes(method)
                        ? current.filter(m => m !== method)
                        : [...current, method]
                      form.setValue('paymentMethods', updated)
                    }}
                  >
                    {method.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...form.register('taxRate', { valueAsNumber: true })}
                  placeholder="18"
                />
                {form.formState.errors.taxRate && (
                  <p className="text-sm text-red-600">{form.formState.errors.taxRate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="refundPolicyDays">Refund Policy (Days)</Label>
                <Input
                  id="refundPolicyDays"
                  type="number"
                  step="1"
                  min="0"
                  max="365"
                  {...form.register('refundPolicyDays', { valueAsNumber: true })}
                  placeholder="7"
                />
                {form.formState.errors.refundPolicyDays && (
                  <p className="text-sm text-red-600">{form.formState.errors.refundPolicyDays.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="taxInclusive"
                checked={form.watch('taxInclusive')}
                onCheckedChange={(checked) => form.setValue('taxInclusive', checked)}
              />
              <Label htmlFor="taxInclusive">Tax Inclusive Pricing</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumCoursePrice">Minimum Course Price</Label>
                <Input
                  id="minimumCoursePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('minimumCoursePrice', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {form.formState.errors.minimumCoursePrice && (
                  <p className="text-sm text-red-600">{form.formState.errors.minimumCoursePrice.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximumCoursePrice">Maximum Course Price</Label>
                <Input
                  id="maximumCoursePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('maximumCoursePrice', { valueAsNumber: true })}
                  placeholder="10000.00"
                />
                {form.formState.errors.maximumCoursePrice && (
                  <p className="text-sm text-red-600">{form.formState.errors.maximumCoursePrice.message}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              type="submit"
              disabled={saving || form.formState.isSubmitting || Object.keys(form.formState.errors).length > 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Business Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// System Settings Component
function SystemSettings({ 
  initialData, 
  onSave, 
  saving 
}: { 
  initialData: SettingsData | null
  onSave: (data: Partial<SettingsData>) => Promise<void>
  saving: boolean 
}) {
  const form = useForm<SystemData>({
    resolver: zodResolver(systemSchema),
    mode: "onChange",
    defaultValues: {
      defaultSessionDuration: initialData?.defaultSessionDuration,
        maxGroupSize: initialData?.maxGroupSize,
        minGroupSize: initialData?.minGroupSize,
        bookingLeadTimeHours: initialData?.bookingLeadTimeHours,
        cancellationNoticeHours: initialData?.cancellationNoticeHours,
    }
  })

  const handleSave = async () => {
    const values = form.getValues()
    await onSave(values)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
        <CardDescription>
          Configure default session settings and booking policies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="defaultSessionDuration">Default Session Duration (minutes)</Label>
            <Input
              id="defaultSessionDuration"
              type="number"
              step="1"
              min="15"
              max="480"
              {...form.register('defaultSessionDuration', { valueAsNumber: true })}
              placeholder="60"
            />
            {form.formState.errors.defaultSessionDuration && (
              <p className="text-sm text-red-600">{form.formState.errors.defaultSessionDuration.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxGroupSize">Maximum Group Size</Label>
            <Input
              id="maxGroupSize"
              type="number"
              step="1"
              min="1"
              max="100"
              {...form.register('maxGroupSize', { valueAsNumber: true })}
              placeholder="15"
            />
            {form.formState.errors.maxGroupSize && (
              <p className="text-sm text-red-600">{form.formState.errors.maxGroupSize.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minGroupSize">Minimum Group Size</Label>
            <Input
              id="minGroupSize"
              type="number"
              step="1"
              min="1"
              max="100"
              {...form.register('minGroupSize', { valueAsNumber: true })}
              placeholder="5"
            />
            {form.formState.errors.minGroupSize && (
              <p className="text-sm text-red-600">{form.formState.errors.minGroupSize.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookingLeadTimeHours">Booking Lead Time (hours)</Label>
            <Input
              id="bookingLeadTimeHours"
              type="number"
              step="1"
              min="0"
              max="720"
              {...form.register('bookingLeadTimeHours', { valueAsNumber: true })}
              placeholder="12"
            />
            {form.formState.errors.bookingLeadTimeHours && (
              <p className="text-sm text-red-600">{form.formState.errors.bookingLeadTimeHours.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cancellationNoticeHours">Cancellation Notice (hours)</Label>
          <Input
            id="cancellationNoticeHours"
            type="number"
            step="1"
            min="0"
            max="168"
            {...form.register('cancellationNoticeHours', { valueAsNumber: true })}
            placeholder="4"
          />
          {form.formState.errors.cancellationNoticeHours && (
            <p className="text-sm text-red-600">{form.formState.errors.cancellationNoticeHours.message}</p>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save System Settings'}
          </Button>
        </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Communication Settings Component
function CommunicationSettings({ 
  initialData, 
  onSave, 
  saving 
}: { 
  initialData: SettingsData | null
  onSave: (data: Partial<SettingsData>) => Promise<void>
  saving: boolean 
}) {
  const form = useForm<CommunicationData>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      emailFromName: initialData?.emailFromName,
      emailFromAddress: initialData?.emailFromAddress,
      brandPrimaryColor: initialData?.brandPrimaryColor,
      brandSecondaryColor: initialData?.brandSecondaryColor,
    }
  })

  const handleSave = async () => {
    const values = form.getValues()
    await onSave(values)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication Settings</CardTitle>
        <CardDescription>
          Configure email settings and brand colors
        </CardDescription>
      </CardHeader>
      <CardContent >
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSave)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emailFromName">Email From Name *</Label>
            <Input
              id="emailFromName"
              {...form.register('emailFromName')}
              placeholder="Indian Learning Institute"
              required
              minLength={2}
              maxLength={100}
            />
            {form.formState.errors.emailFromName && (
              <p className="text-sm text-red-600">{form.formState.errors.emailFromName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailFromAddress">Email From Address *</Label>
            <Input
              id="emailFromAddress"
              type="email"
              {...form.register('emailFromAddress')}
              placeholder="noreply@institution.com"
              required
              minLength={5}
              maxLength={100}
            />
            {form.formState.errors.emailFromAddress && (
              <p className="text-sm text-red-600">{form.formState.errors.emailFromAddress.message}</p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Brand Colors
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandPrimaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="brandPrimaryColor"
                  type="text"
                  {...form.register('brandPrimaryColor')}
                  placeholder="#FF6B35"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  maxLength={7}
                />
                <div 
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: form.watch('brandPrimaryColor') || '#FF6B35' }}
                />
              </div>
              {form.formState.errors.brandPrimaryColor && (
                <p className="text-sm text-red-600">{form.formState.errors.brandPrimaryColor.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandSecondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="brandSecondaryColor"
                  type="text"
                  {...form.register('brandSecondaryColor')}
                  placeholder="#00A86B"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  maxLength={7}
                />
                <div 
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: form.watch('brandSecondaryColor') || '#00A86B' }}
                />
              </div>
              {form.formState.errors.brandSecondaryColor && (
                <p className="text-sm text-red-600">{form.formState.errors.brandSecondaryColor.message}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save Communication Settings'}
          </Button>
        </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SettingsData | null>(null)

  // Load settings
  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings')
      const result = await response.json()
      
      if (result.success) {
        setSettings(result.data)
        console.log('Loading settings data:', result.data)
      } else {
        toast.error(result.error || 'Failed to load settings')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  // Save settings - accepts partial data from individual tab components
  const saveSettings = async (data: Partial<SettingsData>) => {
    console.log('saveSettings called with:', data)
    setSaving(true)
    try {
      console.log('Making API call to /api/settings')
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          ...data,
        })
      })
      
      console.log('API response status:', response.status)
      const result = await response.json()
      console.log('API response:', result)
      
      if (result.success) {
        setSettings(result.data)
        toast.success('Settings saved successfully')
      } else {
        toast.error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Institution Settings</h1>
          <p className="text-gray-600 mt-1">Configure your institution's global settings</p>
        </div>

        <Tabs defaultValue="institution" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="institution" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Institution
            </TabsTrigger>
            <TabsTrigger value="regional" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Regional
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Academic
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Communication
            </TabsTrigger>
          </TabsList>

          <TabsContent value="institution" className="space-y-6">
            <InstitutionSettings 
              initialData={settings} 
              onSave={saveSettings} 
              saving={saving} 
            />
          </TabsContent>

          <TabsContent value="regional" className="space-y-6">
            <RegionalSettings 
              initialData={settings} 
              onSave={saveSettings} 
              saving={saving} 
            />
          </TabsContent>

          <TabsContent value="academic" className="space-y-6">
            <AcademicSettings 
              initialData={settings} 
              onSave={saveSettings} 
              saving={saving} 
            />
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <BusinessSettings 
              initialData={settings} 
              onSave={saveSettings} 
              saving={saving} 
            />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemSettings 
              initialData={settings} 
              onSave={saveSettings} 
              saving={saving} 
            />
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <CommunicationSettings 
              initialData={settings} 
              onSave={saveSettings} 
              saving={saving} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
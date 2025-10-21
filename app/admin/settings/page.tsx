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

// Simplified validation schema - make all fields optional
const settingsSchema = z.object({
  // Institution Information
  institutionName: z.string().optional(),
  institutionLogo: z.string().optional(),
  institutionWebsite: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  registrationNumber: z.string().optional(),
  
  // Regional & Localization
  primaryCurrency: z.string().optional(),
  country: z.string().optional(),
  defaultTimezone: z.string().optional(),
  dateFormat: z.string().optional(),
  numberFormat: z.string().optional(),
  language: z.string().optional(),
  
  // Academic Settings
  academicYearStructure: z.string().optional(),
  gradingSystem: z.string().optional(),
  ageGroups: z.array(z.string()).optional(),
  qualificationLevels: z.array(z.string()).optional(),
  
  // Business Settings
  paymentMethods: z.array(z.string()).optional(),
  taxRate: z.number().optional(),
  taxInclusive: z.boolean().optional(),
  refundPolicyDays: z.number().optional(),
  minimumCoursePrice: z.number().optional(),
  maximumCoursePrice: z.number().optional(),
  
  // System Settings
  defaultSessionDuration: z.number().optional(),
  maxGroupSize: z.number().optional(),
  minGroupSize: z.number().optional(),
  bookingLeadTimeHours: z.number().optional(),
  cancellationNoticeHours: z.number().optional(),
  
  // Communication Settings
  emailFromName: z.string().optional(),
  emailFromAddress: z.string().email().optional(),
  brandPrimaryColor: z.string().optional(),
  brandSecondaryColor: z.string().optional(),
})

type SettingsData = z.infer<typeof settingsSchema>

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SettingsData | null>(null)

  const form = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    // Remove defaultValues - let database provide them
  })

  // Load settings
  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings')
      const result = await response.json()
      
      if (result.success) {
        setSettings(result.data)
        // Populate form with database values
        console.log('Loading settings data:', result.data)
        form.reset(result.data)
        console.log('Form values after reset:', form.getValues())
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

  // Save settings
  const saveSettings = async (data: SettingsData) => {
    console.log('saveSettings called with:', data)
    setSaving(true)
    try {
      console.log('Making API call to /api/settings')
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
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

  // Debug form values
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === 'primaryCurrency' || name === 'country' || name === 'defaultTimezone') {
        console.log('Form field changed:', name, '=', value[name])
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit = (data: SettingsData) => {
    console.log('Form submitted with data:', data)
    console.log('Form validation errors:', form.formState.errors)
    console.log('Form is valid:', form.formState.isValid)
    saveSettings(data)
  }

  // Simple save function that bypasses validation
  const saveCurrentValues = async () => {
    console.log('Saving current form values...')
    const currentValues = form.getValues()
    console.log('Current values:', currentValues)
    await saveSettings(currentValues)
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Institution Settings</h1>
            <p className="text-gray-600 mt-1">Configure your institution's global settings</p>
          </div>
          <Button 
            onClick={() => {
              console.log('Save button clicked')
              console.log('Form values:', form.getValues())
              console.log('Form errors:', form.formState.errors)
              saveCurrentValues()
            }} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
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

            {/* Institution Information */}
            <TabsContent value="institution" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Institution Information</CardTitle>
                  <CardDescription>
                    Basic information about your institution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="institutionName">Institution Name *</Label>
                      <Input
                        id="institutionName"
                        {...form.register('institutionName')}
                        placeholder="e.g., Indian Learning Institute"
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
                      />
                      {form.formState.errors.contactEmail && (
                        <p className="text-sm text-red-600">{form.formState.errors.contactEmail.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Logo Field with Preview */}
                  <div className="space-y-2">
                    <Label htmlFor="institutionLogo" className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Institution Logo URL
                    </Label>
                    <Input
                      id="institutionLogo"
                      {...form.register('institutionLogo')}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-gray-500">
                      Enter the URL of your institution's logo. If no logo is provided, we'll use your institution's initials.
                    </p>
                    {/* Logo Preview */}
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="institutionWebsite">Website</Label>
                      <Input
                        id="institutionWebsite"
                        {...form.register('institutionWebsite')}
                        placeholder="https://institution.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone Number</Label>
                      <Input
                        id="contactPhone"
                        {...form.register('contactPhone')}
                        placeholder="+91 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      {...form.register('address')}
                      placeholder="123 Main Street, City, State, Country"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      {...form.register('registrationNumber')}
                      placeholder="Company registration number"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={saveCurrentValues}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? 'Saving...' : 'Save Institution Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Regional & Localization */}
            <TabsContent value="regional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Regional & Localization</CardTitle>
                  <CardDescription>
                    Configure currency, timezone, and regional settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryCurrency">Primary Currency *</Label>
                      <Select 
                        value={form.watch('primaryCurrency')} 
                        onValueChange={(value) => form.setValue('primaryCurrency', value)}
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Select 
                        value={form.watch('country')} 
                        onValueChange={(value) => form.setValue('country', value)}
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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultTimezone">Default Timezone *</Label>
                      <Select 
                        value={form.watch('defaultTimezone')} 
                        onValueChange={(value) => form.setValue('defaultTimezone', value)}
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language *</Label>
                      <Select 
                        value={form.watch('language')} 
                        onValueChange={(value) => form.setValue('language', value)}
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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format *</Label>
                      <Select 
                        value={form.watch('dateFormat')} 
                        onValueChange={(value) => form.setValue('dateFormat', value)}
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numberFormat">Number Format *</Label>
                      <Select 
                        value={form.watch('numberFormat')} 
                        onValueChange={(value) => form.setValue('numberFormat', value)}
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Academic Settings */}
            <TabsContent value="academic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Settings</CardTitle>
                  <CardDescription>
                    Configure academic year structure and grading systems
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="academicYearStructure">Academic Year Structure *</Label>
                      <Select 
                        value={form.watch('academicYearStructure')} 
                        onValueChange={(value) => form.setValue('academicYearStructure', value as any)}
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gradingSystem">Grading System *</Label>
                      <Select 
                        value={form.watch('gradingSystem')} 
                        onValueChange={(value) => form.setValue('gradingSystem', value as any)}
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Settings */}
            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Settings</CardTitle>
                  <CardDescription>
                    Configure payment methods, tax settings, and pricing policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="refundPolicyDays">Refund Policy (Days)</Label>
                        <Input
                          id="refundPolicyDays"
                          type="number"
                          {...form.register('refundPolicyDays', { valueAsNumber: true })}
                          placeholder="7"
                        />
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
                          {...form.register('minimumCoursePrice', { valueAsNumber: true })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maximumCoursePrice">Maximum Course Price</Label>
                        <Input
                          id="maximumCoursePrice"
                          type="number"
                          step="0.01"
                          {...form.register('maximumCoursePrice', { valueAsNumber: true })}
                          placeholder="10000.00"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure default session settings and booking policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultSessionDuration">Default Session Duration (minutes)</Label>
                      <Input
                        id="defaultSessionDuration"
                        type="number"
                        {...form.register('defaultSessionDuration', { valueAsNumber: true })}
                        placeholder="60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxGroupSize">Maximum Group Size</Label>
                      <Input
                        id="maxGroupSize"
                        type="number"
                        {...form.register('maxGroupSize', { valueAsNumber: true })}
                        placeholder="15"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minGroupSize">Minimum Group Size</Label>
                      <Input
                        id="minGroupSize"
                        type="number"
                        {...form.register('minGroupSize', { valueAsNumber: true })}
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bookingLeadTimeHours">Booking Lead Time (hours)</Label>
                      <Input
                        id="bookingLeadTimeHours"
                        type="number"
                        {...form.register('bookingLeadTimeHours', { valueAsNumber: true })}
                        placeholder="12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancellationNoticeHours">Cancellation Notice (hours)</Label>
                    <Input
                      id="cancellationNoticeHours"
                      type="number"
                      {...form.register('cancellationNoticeHours', { valueAsNumber: true })}
                      placeholder="4"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Communication Settings */}
            <TabsContent value="communication" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Communication Settings</CardTitle>
                  <CardDescription>
                    Configure email settings and brand colors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailFromName">Email From Name *</Label>
                      <Input
                        id="emailFromName"
                        {...form.register('emailFromName')}
                        placeholder="Indian Learning Institute"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailFromAddress">Email From Address *</Label>
                      <Input
                        id="emailFromAddress"
                        type="email"
                        {...form.register('emailFromAddress')}
                        placeholder="noreply@institution.com"
                      />
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
                            {...form.register('brandPrimaryColor')}
                            placeholder="#FF6B35"
                          />
                          <div 
                            className="w-10 h-10 rounded border"
                            style={{ backgroundColor: form.watch('brandPrimaryColor') || '#FF6B35' }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brandSecondaryColor">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="brandSecondaryColor"
                            {...form.register('brandSecondaryColor')}
                            placeholder="#00A86B"
                          />
                          <div 
                            className="w-10 h-10 rounded border"
                            style={{ backgroundColor: form.watch('brandSecondaryColor') || '#00A86B' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </AdminLayout>
  )
}
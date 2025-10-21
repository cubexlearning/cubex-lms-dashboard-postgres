"use client"

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Loader2, AlertCircle, CheckCircle2, User, BookOpen, CreditCard } from 'lucide-react'
import { PricingCalculator, PricingBreakdown } from './PricingCalculator'

interface EnrollmentFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface Student {
  id: string
  name: string
  email: string
  phone: string
  ageGroup?: string
}

interface Course {
  id: string
  title: string
  shortDescription?: string
  oneToOnePrice?: number
  oneToOneActive?: boolean
  groupPrice?: number
  groupActive?: boolean
  availableFormats?: string[]
  pricing?: any // Legacy support
}

export function EnrollmentForm({ onSuccess, onCancel }: EnrollmentFormProps) {
  const [currentTab, setCurrentTab] = useState('student')
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [taxRate, setTaxRate] = useState(0.18) // Default 18%
  const [currency, setCurrency] = useState('INR')
  const [availableFormats, setAvailableFormats] = useState<string[]>([])
  const [lastProcessedCourse, setLastProcessedCourse] = useState<string>('')
  const [lastProcessedFormat, setLastProcessedFormat] = useState<string>('')
  
  // Student section state
  const [studentMode, setStudentMode] = useState<'new' | 'existing'>('new')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [emailCheckLoading, setEmailCheckLoading] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const [existingStudentData, setExistingStudentData] = useState<Student | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    // Student data
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    ageGroup: '',
    dateOfBirth: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    address: '',
    emergencyContact: '',
    
    // Course data
    courseId: '',
    format: 'ONE_TO_ONE' as 'ONE_TO_ONE' | 'GROUP',
    sessionCount: 20,
    sessionDuration: 60,
    preferredDays: [] as string[],
    preferredTimes: [] as string[],
    
    // Pricing data
    basePrice: 0,
    discountType: 'NONE' as 'NONE' | 'PERCENTAGE' | 'AMOUNT',
    discountValue: 0,
    discountAmount: 0,
    subtotal: 0,
    taxAmount: 0,
    finalPrice: 0,
    paymentPlan: 'FULL' as 'FULL' | 'INSTALLMENTS',
    installmentCount: 3,
    firstPaymentMethod: 'CARD' as any,
    markFirstPaymentAsPaid: false,
    transactionId: '',
  })

  // Memoize available formats calculation
  const computedAvailableFormats = useMemo(() => {
    if (!formData.courseId || courses.length === 0) return []
    const selectedCourse = courses.find(c => c.id === formData.courseId)
    return selectedCourse?.availableFormats || []
  }, [formData.courseId, courses])

  // Load students for dropdown
  const loadStudents = async (search: string = '') => {
    if (studentMode !== 'existing') return
    
    setLoadingStudents(true)
    try {
      const response = await fetch(`/api/students?search=${search}&limit=20`)
      const result = await response.json()
      
      if (result.success) {
        setStudents(result.data?.students || [])
      } else {
        console.error('Failed to load students:', result.error)
        setStudents([])
      }
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  // Load courses
  const loadCourses = async () => {
    setLoadingCourses(true)
    try {
      const response = await fetch('/api/courses?status=PUBLISHED&limit=100')
      const result = await response.json()

      if (result.success) {
        const payload = result.data ?? {}
        const rawCourses = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.courses)
            ? payload.courses
            : []

        // Normalize into the shape EnrollmentForm expects
        const normalized: Course[] = rawCourses.map((c: any) => {
          const availableFormats: string[] = []
          
          // Handle null/undefined values properly - Decimal fields can be null
          const oneToOnePrice = c.oneToOnePrice !== null && c.oneToOnePrice !== undefined ? Number(c.oneToOnePrice) : 0
          const groupPrice = c.groupPrice !== null && c.groupPrice !== undefined ? Number(c.groupPrice) : 0
          
          console.log(`Course ${c.title}: oneToOnePrice=${c.oneToOnePrice} (${typeof c.oneToOnePrice}), groupPrice=${c.groupPrice} (${typeof c.groupPrice})`)
          
          if (oneToOnePrice > 0) availableFormats.push('ONE_TO_ONE')
          if (groupPrice > 0) availableFormats.push('GROUP')
          
          return {
            id: c.id,
            title: c.title,
            shortDescription: c.shortDescription,
            oneToOnePrice: oneToOnePrice,
            groupPrice: groupPrice,
            availableFormats,
            pricing: c.pricing,
          } as Course
        })

        console.log('Normalized courses:', normalized)
        setCourses(normalized)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  // Check email availability
  const checkEmail = async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailExists(false)
      setExistingStudentData(null)
      return
    }
    
    setEmailCheckLoading(true)
    try {
      const response = await fetch(`/api/students/check-email?email=${encodeURIComponent(email)}`)
      const result = await response.json()
      
      if (result.exists) {
        setEmailExists(true)
        setExistingStudentData(result.student)
      } else {
        setEmailExists(false)
        setExistingStudentData(null)
      }
    } catch (error) {
      console.error('Error checking email:', error)
    } finally {
      setEmailCheckLoading(false)
    }
  }

  // Update available formats when course changes
  useEffect(() => {
    if (formData.courseId && courses.length > 0 && lastProcessedCourse !== formData.courseId) {
      setAvailableFormats(computedAvailableFormats)
      setLastProcessedCourse(formData.courseId)
      
      // Auto-select format if only one available and no format is currently selected
      if (computedAvailableFormats.length === 1 && !formData.format) {
        setFormData(prev => ({
          ...prev,
          format: computedAvailableFormats[0] as 'ONE_TO_ONE' | 'GROUP'
        }))
      }
      
      // Reset format if current format is not available
      if (computedAvailableFormats.length > 0 && !computedAvailableFormats.includes(formData.format)) {
        setFormData(prev => ({
          ...prev,
          format: computedAvailableFormats[0] as 'ONE_TO_ONE' | 'GROUP'
        }))
      }
    }
  }, [formData.courseId, courses, lastProcessedCourse, computedAvailableFormats]) // Removed formData.format to prevent loops

  // Update pricing when course or format changes
  useEffect(() => {
    const currentKey = `${formData.courseId}-${formData.format}`
    if (formData.courseId && formData.format && courses.length > 0 && lastProcessedFormat !== currentKey) {
      const selectedCourse = courses.find(c => c.id === formData.courseId)
      console.log('Selected course:', selectedCourse)
      
      if (selectedCourse) {
        console.log('Processing course:', selectedCourse)
        console.log('Available formats:', selectedCourse.availableFormats)
        console.log('Selected format:', formData.format)
        
        // Check if format is available
        const formats = selectedCourse.availableFormats || []
        if (!formats.includes(formData.format)) {
          console.warn('Selected format not available for this course')
          toast.error('Selected format is not available for this course. Please choose a different format.')
          return
        }
        
        // Get pricing for the selected format
        let basePrice = 0
        
        if (formData.format === 'ONE_TO_ONE') {
          basePrice = selectedCourse.oneToOnePrice || 0
          console.log('ONE_TO_ONE price:', selectedCourse.oneToOnePrice, '-> basePrice:', basePrice)
        } else {
          basePrice = selectedCourse.groupPrice || 0
          console.log('GROUP price:', selectedCourse.groupPrice, '-> basePrice:', basePrice)
        }
        
        // Ensure basePrice is a valid number
        const numericBasePrice = typeof basePrice === 'number' && !isNaN(basePrice) ? basePrice : 0
        
        console.log('Extracted base price:', numericBasePrice, 'for format:', formData.format)
        
        if (numericBasePrice > 0) {
          setFormData(prev => ({
            ...prev,
            basePrice: numericBasePrice
          }))
          setLastProcessedFormat(currentKey)
        } else {
          console.warn('No pricing found for this course and format')
          console.log('Course pricing details:', {
            oneToOnePrice: selectedCourse.oneToOnePrice,
            groupPrice: selectedCourse.groupPrice,
            format: formData.format
          })
          toast.error('No pricing available for this format. Please configure pricing in the course settings.')
        }
      }
    }
  }, [formData.courseId, formData.format, courses, lastProcessedFormat])

  // Load institution settings for tax rate and currency
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const result = await response.json()
      
      if (result.success) {
        const settings = result.data
        setTaxRate(Number(settings.taxRate) || 0.18)
        setCurrency(settings.primaryCurrency || 'INR')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  // Handle pricing calculator changes - memoized to prevent infinite loops
  const handlePricingChange = useCallback((pricing: PricingBreakdown) => {
    setFormData(prev => ({
      ...prev,
      basePrice: pricing.basePrice,
      discountType: pricing.discountType,
      discountValue: pricing.discountValue,
      discountAmount: pricing.discountAmount,
      subtotal: pricing.subtotal,
      taxAmount: pricing.taxAmount,
      finalPrice: pricing.finalPrice
    }))
  }, [])

  // Helper function to get format status
  const getFormatStatus = useCallback((format: string) => {
    return availableFormats.includes(format) ? 'available' : 'unavailable'
  }, [availableFormats])

  // Stable callback for format change
  const handleFormatChange = useCallback((newFormat: 'ONE_TO_ONE' | 'GROUP') => {
    if (getFormatStatus(newFormat) === 'available') {
      setFormData(prev => ({ ...prev, format: newFormat }))
    } else {
      toast.error(`${newFormat === 'ONE_TO_ONE' ? 'One-to-One' : 'Group'} format is not available for this course`)
    }
  }, [getFormatStatus])

  // Stable callback for course change
  const handleCourseChange = useCallback((courseId: string) => {
    setFormData(prev => ({ ...prev, courseId }))
  }, [])

  // Memoized format selection component
  const FormatSelection = memo(({ 
    selectedFormat, 
    availableFormats, 
    onFormatChange, 
    getFormatStatus 
  }: {
    selectedFormat: string
    availableFormats: string[]
    onFormatChange: (format: 'ONE_TO_ONE' | 'GROUP') => void
    getFormatStatus: (format: string) => string
  }) => (
    <div className="space-y-2">
      <Label>Format *</Label>
      <div className="flex gap-4">
        <Button
          type="button"
          variant={selectedFormat === 'ONE_TO_ONE' ? 'default' : 'outline'}
          onClick={() => onFormatChange('ONE_TO_ONE')}
          disabled={getFormatStatus('ONE_TO_ONE') === 'unavailable'}
          className={`flex-1 ${getFormatStatus('ONE_TO_ONE') === 'unavailable' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          One-to-One {getFormatStatus('ONE_TO_ONE') === 'available' ? '✓' : '✗'}
        </Button>
        <Button
          type="button"
          variant={selectedFormat === 'GROUP' ? 'default' : 'outline'}
          onClick={() => onFormatChange('GROUP')}
          disabled={getFormatStatus('GROUP') === 'unavailable'}
          className={`flex-1 ${getFormatStatus('GROUP') === 'unavailable' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Group {getFormatStatus('GROUP') === 'available' ? '✓' : '✗'}
        </Button>
      </div>
      {availableFormats.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This course has no pricing configured. Please configure pricing in the course settings.
          </AlertDescription>
        </Alert>
      )}
    </div>
  ))
  FormatSelection.displayName = 'FormatSelection'
  
  // Load courses and settings on mount
  useEffect(() => {
    loadCourses()
    loadSettings()
  }, [])

  // Load students when switching to existing mode
  useEffect(() => {
    if (studentMode === 'existing') {
      loadStudents()
    }
  }, [studentMode])

  // Handle student mode change
  const handleStudentModeChange = (mode: 'new' | 'existing') => {
    setStudentMode(mode)
    if (mode === 'new') {
      setSelectedStudentId('')
    } else {
      // Clear new student form
      setFormData(prev => ({
        ...prev,
        studentName: '',
        studentEmail: '',
        studentPhone: '',
        ageGroup: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
      }))
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    console.log('Form submission started', { studentMode, formData, selectedStudentId, emailExists })
    
    // Validation
    if (studentMode === 'new') {
      if (!formData.studentName) {
        toast.error('Student name is required')
        setCurrentTab('student')
        return
      }
      if (!formData.studentEmail) {
        toast.error('Student email is required')
        setCurrentTab('student')
        return
      }
      if (!formData.studentPhone) {
        toast.error('Student phone is required')
        setCurrentTab('student')
        return
      }
      if (!formData.ageGroup) {
        toast.error('Age group is required')
        setCurrentTab('student')
        return
      }
      
      // Check if email exists and student chose to use existing
      if (emailExists && existingStudentData) {
        toast.error(`Email already exists for ${existingStudentData.name}. Please use a different email or switch to "Select Existing Student" mode.`)
        setCurrentTab('student')
        return
      }
    } else {
      if (!selectedStudentId) {
        toast.error('Please select a student from the dropdown')
        setCurrentTab('student')
        return
      }
    }
    
    if (!formData.courseId) {
      toast.error('Please select a course')
      setCurrentTab('course')
      return
    }
    
    if (!formData.basePrice || formData.basePrice <= 0) {
      toast.error('Base price must be greater than 0. Please check course pricing.')
      setCurrentTab('payment')
      return
    }

    setLoading(true)
    
    try {
      let studentId = selectedStudentId
      
      // Step 1: Create student if new
      if (studentMode === 'new') {
        const studentResponse = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.studentName,
            email: formData.studentEmail,
            phone: formData.studentPhone,
            ageGroup: formData.ageGroup,
            dateOfBirth: formData.dateOfBirth || undefined,
            parentName: formData.parentName || undefined,
            parentEmail: formData.parentEmail || undefined,
            parentPhone: formData.parentPhone || undefined,
            address: formData.address || undefined,
            emergencyContact: formData.emergencyContact || undefined,
          })
        })
        
        const studentResult = await studentResponse.json()
        
        if (!studentResult.success) {
          toast.error(studentResult.error || 'Failed to create student')
          setLoading(false)
          return
        }
        
        studentId = studentResult.data.id
        
        // Show credentials to admin
        if (studentResult.credentials) {
          toast.success(
            `Student created! Login: ${studentResult.credentials.email} | Password: ${studentResult.credentials.temporaryPassword}`,
            { duration: 10000 }
          )
        }
      }
      
      // Step 2: Create enrollment
      const enrollmentResponse = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          courseId: formData.courseId,
          format: formData.format,
          sessionCount: formData.sessionCount,
          sessionDuration: formData.sessionDuration,
          
          // Pricing fields
          basePrice: formData.basePrice,
          discountType: formData.discountType,
          discountValue: formData.discountValue || undefined,
          
          preferredDays: formData.preferredDays,
          preferredTimes: formData.preferredTimes,
          paymentPlan: formData.paymentPlan,
          installmentCount: formData.paymentPlan === 'INSTALLMENTS' ? formData.installmentCount : undefined,
          firstPaymentMethod: formData.firstPaymentMethod,
          markFirstPaymentAsPaid: formData.markFirstPaymentAsPaid,
          transactionId: formData.transactionId || undefined,
        })
      })
      
      const enrollmentResult = await enrollmentResponse.json()
      
      if (!enrollmentResult.success) {
        toast.error(enrollmentResult.error || 'Failed to create enrollment')
        setLoading(false)
        return
      }
      
      toast.success('Enrollment created successfully!')
      onSuccess()
      
    } catch (error) {
      console.error('Error creating enrollment:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const times = ['Morning (8AM-12PM)', 'Afternoon (12PM-5PM)', 'Evening (5PM-9PM)']
  const ageGroups = ['6-10', '11-14', '15-17', '18+']

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="student" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Student
          </TabsTrigger>
          <TabsTrigger value="course" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Course
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment
          </TabsTrigger>
        </TabsList>

        {/* STUDENT TAB */}
        <TabsContent value="student" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student Mode Selection */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={studentMode === 'new' ? 'default' : 'outline'}
                  onClick={() => handleStudentModeChange('new')}
                  className="flex-1"
                >
                  Create New Student
                </Button>
                <Button
                  type="button"
                  variant={studentMode === 'existing' ? 'default' : 'outline'}
                  onClick={() => handleStudentModeChange('existing')}
                  className="flex-1"
                >
                  Select Existing Student
                </Button>
              </div>

              {/* Existing Student Selection */}
              {studentMode === 'existing' && (
                <div className="space-y-2">
                  <Label>Select Student *</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search and select student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingStudents ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                          Loading students...
                        </div>
                      ) : !students || students.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No students found
                        </div>
                      ) : (
                        students.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} - {student.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* New Student Form */}
              {studentMode === 'new' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentName">Student Name *</Label>
                      <Input
                        id="studentName"
                        value={formData.studentName}
                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="studentEmail">Student Email *</Label>
                      <div className="relative">
                        <Input
                          id="studentEmail"
                          type="email"
                          value={formData.studentEmail}
                          onChange={(e) => {
                            setFormData({ ...formData, studentEmail: e.target.value })
                            const email = e.target.value
                            if (email) {
                              const timeoutId = setTimeout(() => checkEmail(email), 500)
                              return () => clearTimeout(timeoutId)
                            }
                          }}
                          placeholder="john@example.com"
                        />
                        {emailCheckLoading && (
                          <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-gray-400" />
                        )}
                      </div>
                      {emailExists && existingStudentData && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Email already exists for {existingStudentData.name}. 
                            <Button
                              type="button"
                              variant="link"
                              className="p-0 h-auto text-red-600 underline ml-1"
                              onClick={() => {
                                setStudentMode('existing')
                                setSelectedStudentId(existingStudentData.id)
                              }}
                            >
                              Use this student?
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentPhone">Phone Number *</Label>
                      <Input
                        id="studentPhone"
                        value={formData.studentPhone}
                        onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ageGroup">Age Group *</Label>
                      <Select value={formData.ageGroup} onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          {ageGroups.map(group => (
                            <SelectItem key={group} value={group}>{group} years</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Parent/Guardian Information - Optional for all students */}
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-900">Parent/Guardian Information (Optional)</h4>
                    <p className="text-xs text-blue-700">You can add parent/guardian details for any student</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="parentName">Parent Name</Label>
                        <Input
                          id="parentName"
                          value={formData.parentName}
                          onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                          placeholder="Jane Doe"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="parentPhone">Parent Phone</Label>
                        <Input
                          id="parentPhone"
                          value={formData.parentPhone}
                          onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="parentEmail">Parent Email</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                        placeholder="parent@example.com"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={() => setCurrentTab('course')}>
              Next: Course Selection →
            </Button>
          </div>
        </TabsContent>

        {/* COURSE TAB */}
        <TabsContent value="course" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course & Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Select Course *</Label>
                <Select value={formData.courseId} onValueChange={handleCourseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCourses ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                        Loading courses...
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No published courses found
                      </div>
                    ) : (
                      courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <FormatSelection
                selectedFormat={formData.format}
                availableFormats={availableFormats}
                onFormatChange={handleFormatChange}
                getFormatStatus={getFormatStatus}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionCount">Session Count *</Label>
                  <Select 
                    value={formData.sessionCount.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, sessionCount: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 sessions</SelectItem>
                      <SelectItem value="20">20 sessions</SelectItem>
                      <SelectItem value="30">30 sessions</SelectItem>
                      <SelectItem value="40">40 sessions</SelectItem>
                      <SelectItem value="50">50 sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sessionDuration">Session Duration (minutes) *</Label>
                  <Select 
                    value={formData.sessionDuration.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, sessionDuration: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Days</Label>
                <div className="flex flex-wrap gap-2">
                  {days.map(day => (
                    <Button
                      key={day}
                      type="button"
                      size="sm"
                      variant={formData.preferredDays.includes(day) ? 'default' : 'outline'}
                      onClick={() => {
                        const newDays = formData.preferredDays.includes(day)
                          ? formData.preferredDays.filter(d => d !== day)
                          : [...formData.preferredDays, day]
                        setFormData({ ...formData, preferredDays: newDays })
                      }}
                    >
                      {day.substring(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Times</Label>
                <div className="flex flex-wrap gap-2">
                  {times.map(time => (
                    <Button
                      key={time}
                      type="button"
                      size="sm"
                      variant={formData.preferredTimes.includes(time) ? 'default' : 'outline'}
                      onClick={() => {
                        const newTimes = formData.preferredTimes.includes(time)
                          ? formData.preferredTimes.filter(t => t !== time)
                          : [...formData.preferredTimes, time]
                        setFormData({ ...formData, preferredTimes: newTimes })
                      }}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setCurrentTab('student')}>
              ← Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={() => setCurrentTab('payment')}>
                Next: Payment →
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* PAYMENT TAB */}
        <TabsContent value="payment" className="space-y-4">
          {/* Pricing Calculator */}
          {formData.courseId && typeof formData.basePrice === 'number' && formData.basePrice > 0 ? (
            <PricingCalculator
              basePrice={formData.basePrice}
              currency={currency}
              taxRate={taxRate}
              onPricingChange={handlePricingChange}
            />
          ) : formData.courseId ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Loading course pricing...</p>
                <p className="text-xs mt-2">If this persists, the course may not have pricing configured.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Please select a course to see pricing</p>
              </CardContent>
            </Card>
          )}

          {/* Payment Plan Section */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Payment Plan */}
              <div className="space-y-2">
                <Label>Payment Plan *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={formData.paymentPlan === 'FULL' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, paymentPlan: 'FULL' })}
                    className="h-auto py-4 flex-col"
                  >
                    <div className="font-semibold">Full Payment</div>
                    <div className="text-xs opacity-80">Pay entire amount now</div>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.paymentPlan === 'INSTALLMENTS' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, paymentPlan: 'INSTALLMENTS' })}
                    className="h-auto py-4 flex-col"
                  >
                    <div className="font-semibold">Installments</div>
                    <div className="text-xs opacity-80">Split into multiple payments</div>
                  </Button>
                </div>
              </div>

              {formData.paymentPlan === 'INSTALLMENTS' && (
                <div className="space-y-2">
                  <Label htmlFor="installmentCount">Number of Installments *</Label>
                  <Select 
                    value={formData.installmentCount.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, installmentCount: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 installments (₹{(formData.finalPrice / 2).toFixed(2)} each)</SelectItem>
                      <SelectItem value="3">3 installments (₹{(formData.finalPrice / 3).toFixed(2)} each)</SelectItem>
                      <SelectItem value="4">4 installments (₹{(formData.finalPrice / 4).toFixed(2)} each)</SelectItem>
                      <SelectItem value="6">6 installments (₹{(formData.finalPrice / 6).toFixed(2)} each)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* First Payment Details */}
              <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                <h4 className="font-medium text-sm text-blue-900">First Payment Details</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="firstPaymentMethod">Payment Method *</Label>
                  <Select 
                    value={formData.firstPaymentMethod} 
                    onValueChange={(value) => setFormData({ ...formData, firstPaymentMethod: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                      <SelectItem value="WALLET">Wallet</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="markFirstPaymentAsPaid"
                    checked={formData.markFirstPaymentAsPaid}
                    onCheckedChange={(checked) => setFormData({ ...formData, markFirstPaymentAsPaid: checked as boolean })}
                  />
                  <Label htmlFor="markFirstPaymentAsPaid">Mark first payment as paid</Label>
                </div>

                {formData.markFirstPaymentAsPaid && (
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID (optional)</Label>
                    <Input
                      id="transactionId"
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      placeholder="TXN123456789"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setCurrentTab('course')}>
              ← Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Create Enrollment
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

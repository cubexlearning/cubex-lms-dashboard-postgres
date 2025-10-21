"use client"

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, User, BookOpen, Calendar, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { PaymentTracker } from './PaymentTracker'

interface EnrollmentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollmentId: string
}

interface EnrollmentDetails {
  id: string
  student: {
    id: string
    name: string
    email: string
    phone?: string
    ageGroup?: string
    parentName?: string
    parentEmail?: string
    parentPhone?: string
  }
  course: {
    id: string
    title: string
    shortDescription?: string
    fullDescription?: string
  }
  format: string
  status: string
  paymentStatus: string
  sessionCount: number
  sessionDuration: number
  basePrice: number
  offerPrice?: number
  finalPrice: number
  currency: string
  preferredDays: string[]
  preferredTimes: string[]
  timezone: string
  enrolledAt: string
  startedAt?: string
  completedAt?: string
  paymentSummary?: {
    totalAmount: number
    paidAmount: number
    pendingAmount: number
    paymentPercentage: number
  }
}

export function EnrollmentDetailsDialog({ 
  open, 
  onOpenChange, 
  enrollmentId 
}: EnrollmentDetailsDialogProps) {
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const loadEnrollmentDetails = async () => {
    if (!enrollmentId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}`)
      const result = await response.json()

      if (result.success) {
        setEnrollment(result.data)
      } else {
        toast.error('Failed to load enrollment details')
      }
    } catch (error) {
      console.error('Error loading enrollment details:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && enrollmentId) {
      loadEnrollmentDetails()
    }
  }, [open, enrollmentId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const formatEnrollmentFormat = (format: string) => {
    return format === 'ONE_TO_ONE' ? 'One-to-One' : 'Group'
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "COMPLETED": return "bg-blue-100 text-blue-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "CANCELLED": return "bg-red-100 text-red-800"
      case "SUSPENDED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enrollment Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading details...</span>
          </div>
        ) : !enrollment ? (
          <div className="text-center p-12 text-gray-500">
            Enrollment not found
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enrollment Status</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <Badge className={getStatusColor(enrollment.status)}>
                      {enrollment.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Enrolled</div>
                    <div className="text-sm font-medium">{formatDate(enrollment.enrolledAt)}</div>
                  </div>
                  {enrollment.startedAt && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Started</div>
                      <div className="text-sm font-medium">{formatDate(enrollment.startedAt)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Name</div>
                    <div className="font-medium">{enrollment.student.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium">{enrollment.student.email}</div>
                  </div>
                  {enrollment.student.phone && (
                    <div>
                      <div className="text-sm text-gray-600">Phone</div>
                      <div className="font-medium">{enrollment.student.phone}</div>
                    </div>
                  )}
                  {enrollment.student.ageGroup && (
                    <div>
                      <div className="text-sm text-gray-600">Age Group</div>
                      <div className="font-medium">{enrollment.student.ageGroup} years</div>
                    </div>
                  )}
                  {enrollment.student.parentName && (
                    <>
                      <div className="col-span-2 mt-2 pt-2 border-t">
                        <div className="text-sm font-medium text-gray-700 mb-2">Parent/Guardian</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Parent Name</div>
                        <div className="font-medium">{enrollment.student.parentName}</div>
                      </div>
                      {enrollment.student.parentPhone && (
                        <div>
                          <div className="text-sm text-gray-600">Parent Phone</div>
                          <div className="font-medium">{enrollment.student.parentPhone}</div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Course Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Course Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Course</div>
                    <div className="font-medium text-lg">{enrollment.course.title}</div>
                  </div>
                  {enrollment.course.shortDescription && (
                    <div>
                      <div className="text-sm text-gray-400">{enrollment.course.shortDescription}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-sm text-gray-600">Format</div>
                      <div className="font-medium">{formatEnrollmentFormat(enrollment.format)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Sessions</div>
                      <div className="font-medium">{enrollment.sessionCount} sessions</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-medium">{enrollment.sessionDuration} minutes</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Timezone</div>
                      <div className="font-medium">{enrollment.timezone}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Pricing Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Price</span>
                      <span className="font-medium">
                        {enrollment.currency === 'INR' ? '₹' : enrollment.currency}
                        {Number(enrollment.basePrice).toFixed(2)}
                      </span>
                    </div>
                    
                    {enrollment.discountAmount && Number(enrollment.discountAmount) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Discount {enrollment.discountType === 'PERCENTAGE' ? `(${enrollment.discountValue}%)` : ''}
                        </span>
                        <span className="font-medium text-green-600">
                          -{enrollment.currency === 'INR' ? '₹' : enrollment.currency}
                          {Number(enrollment.discountAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">
                          {enrollment.currency === 'INR' ? '₹' : enrollment.currency}
                          {Number(enrollment.subtotal || enrollment.basePrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Tax ({((enrollment.taxRate || 0.18) * 100).toFixed(0)}%)
                      </span>
                      <span className="font-medium">
                        +{enrollment.currency === 'INR' ? '₹' : enrollment.currency}
                        {Number(enrollment.taxAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold">Final Amount</span>
                        <span className="text-xl font-bold text-blue-600">
                          {enrollment.currency === 'INR' ? '₹' : enrollment.currency}
                          {Number(enrollment.finalPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Schedule Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Preferred Days</div>
                    <div className="flex flex-wrap gap-2">
                      {enrollment.preferredDays.length > 0 ? (
                        enrollment.preferredDays.map(day => (
                          <Badge key={day} variant="outline">{day}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No preference</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Preferred Times</div>
                    <div className="flex flex-wrap gap-2">
                      {enrollment.preferredTimes.length > 0 ? (
                        enrollment.preferredTimes.map(time => (
                          <Badge key={time} variant="outline">{time}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No preference</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <PaymentTracker
                enrollmentId={enrollment.id}
                totalAmount={Number(enrollment.finalPrice)}
                currency={enrollment.currency}
              />
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions">
              <Card>
                <CardHeader>
                  <CardTitle>Session History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Session management coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

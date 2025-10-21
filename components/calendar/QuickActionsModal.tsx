"use client"
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Users, UserCheck, Plus, Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AttendanceData {
  status: string
  activity: string
  remarks: string
  absenceReason: string
  checkInTime: string
  checkOutTime: string
}

interface QuickActionsModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  courses: Array<{
    id: string
    name: string
    studentCount: number
    isActive: boolean
  }>
  onMarkAttendance: (courseId: string, date: Date) => void
  onCreateSession: (courseId: string, date: Date) => void
  onViewSchedule: (courseId: string, date: Date) => void
  onAttendanceSaved?: () => void
}

const ACTIVITIES = [
  'Lecture',
  'Practical Session',
  'Assignment Discussion',
  'Quiz/Test',
  'Project Work',
  'Review Session',
  'Group Discussion',
  'Individual Study',
  'Other'
]

export function QuickActionsModal({
  isOpen,
  onClose,
  selectedDate,
  courses,
  onMarkAttendance,
  onCreateSession,
  onViewSchedule,
  onAttendanceSaved
}: QuickActionsModalProps) {
  const { data: session, status } = useSession()
  const [currentStep, setCurrentStep] = useState<'actions' | 'course-selection' | 'attendance' | 'cancel' | 'holiday'>('actions')
  const [selectedAction, setSelectedAction] = useState<'attendance' | 'cancel' | 'holiday' | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [existingAttendance, setExistingAttendance] = useState<any[]>([])
  const [cancelReason, setCancelReason] = useState('')
  const [holidayReason, setHolidayReason] = useState('')

  // Helpers to avoid timezone shifts across environments
  const getLocalYmd = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return { y, m, day, ymd: `${y}-${m}-${day}` }
  }

  const buildUtcIsoFromLocalYmdTime = (ymd: string, timeHHmm: string | null) => {
    if (!timeHHmm) return null
    const [hh, mm] = timeHHmm.split(':').map(n => parseInt(n, 10))
    const [y, m, d] = ymd.split('-').map(n => parseInt(n, 10))
    const dt = new Date(Date.UTC(y, m - 1, d, hh || 0, mm || 0, 0))
    return dt.toISOString()
  }

  const getStableDateForApi = (d: Date) => {
    // Use local Y-M-D for day-granular API params
    return getLocalYmd(d).ymd
  }

  const isSunday = selectedDate.getDay() === 0
  const isToday = new Date().toDateString() === selectedDate.toDateString()
  const isPast = selectedDate < new Date(new Date().setHours(0, 0, 0, 0))

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('actions')
      setSelectedAction(null)
      setSelectedCourse(null)
      setStudents([])
      setAttendanceData({})
      setIsEditMode(false)
      setExistingAttendance([])
      setCancelReason('')
      setHolidayReason('')
    }
  }, [isOpen])

  const handleAction = async (action: string) => {
    if (action === 'attendance') {
      setSelectedAction('attendance')
      setCurrentStep('course-selection')
      return
    }

    if (action === 'cancel') {
      setSelectedAction('cancel')
      setCurrentStep('course-selection')
      return
    }

    if (action === 'holiday') {
      setSelectedAction('holiday')
      setCurrentStep('course-selection')
      return
    }

    if (!selectedCourse) {
      setCurrentStep('course-selection')
      return
    }

    setIsLoading(true)

    try {
      switch (action) {
        case 'session':
          await onCreateSession(selectedCourse, selectedDate)
          break
        case 'schedule':
          await onViewSchedule(selectedCourse, selectedDate)
          break
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCourseSelect = async (courseId: string) => {
    setSelectedCourse(courseId)
    setIsLoading(true)

    try {
      // Only load attendance data for attendance action
      if (selectedAction === 'attendance') {
        // Load students for the selected course
        const studentsResponse = await fetch(`/api/tutor/courses/${courseId}/students`)
        const studentsData = await studentsResponse.json()
        
        if (studentsData.success) {
          setStudents(studentsData.data)
          
          // FIXED: Use consistent date formatting to prevent cross-date data leakage
          const dateStr = getStableDateForApi(selectedDate)
          
          console.log('Fetching attendance for date:', dateStr, 'selectedDate:', selectedDate)
          
          const existingResponse = await fetch(`/api/tutor/attendance/bulk?courseId=${courseId}&date=${dateStr}`)
          const existingData = await existingResponse.json()
          
          console.log('API response for date:', dateStr, ':', existingData)
          
          let initialData: Record<string, AttendanceData> = {}
          let isEdit = false
          
          if (existingData.success && existingData.data.length > 0) {
            // Edit mode - populate with existing data
            isEdit = true
            setExistingAttendance(existingData.data)
            existingData.data.forEach((record: any) => {
              initialData[record.studentId] = {
                status: record.status.toLowerCase(),
                activity: record.activity || '',
                remarks: record.remarks || '',
                absenceReason: record.absenceReason || '',
                checkInTime: record.checkInTime ? new Date(record.checkInTime).toISOString().slice(11, 16) : '',
                checkOutTime: record.checkOutTime ? new Date(record.checkOutTime).toISOString().slice(11, 16) : ''
              }
            })
          } else {
            // New attendance - default to absent
            studentsData.data.forEach((student: Student) => {
              initialData[student.id] = {
                status: 'absent', // Default to absent
                activity: '',
                remarks: '',
                absenceReason: '',
                checkInTime: '',
                checkOutTime: ''
              }
            })
          }
          
          setAttendanceData(initialData)
          setIsEditMode(isEdit)
          setCurrentStep('attendance')
        } else {
          toast.error('Failed to load students')
          setCurrentStep('actions')
        }
      } else if (selectedAction === 'cancel') {
        // For cancel action, just go to cancel form
        setCurrentStep('cancel')
      } else if (selectedAction === 'holiday') {
        // For holiday action, go to holiday form
        setCurrentStep('holiday')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
      setCurrentStep('actions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelClass = async () => {
    if (!selectedCourse || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancelling the class')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/tutor/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: getStableDateForApi(selectedDate),
          courseId: selectedCourse,
          attendance: [], // Empty attendance array
          cancelReason: cancelReason.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Class cancelled successfully')
        onAttendanceSaved?.() // Trigger calendar refresh
        onClose()
      } else {
        throw new Error(data.error || 'Failed to cancel class')
      }
    } catch (error) {
      console.error('Error cancelling class:', error)
      toast.error(`Failed to cancel class: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkHoliday = async () => {
    if (!selectedCourse || !holidayReason.trim()) {
      toast.error('Please provide a reason for the holiday')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/tutor/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: getStableDateForApi(selectedDate),
          courseId: selectedCourse,
          attendance: [],
          holidayReason: holidayReason.trim()
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Day marked as holiday successfully')
        onAttendanceSaved?.()
        onClose()
      } else {
        throw new Error(data.error || 'Failed to mark holiday')
      }
    } catch (error) {
      console.error('Error marking holiday:', error)
      toast.error(`Failed to mark holiday: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        absenceReason: status === 'absent' ? prev[studentId].absenceReason : ''
      }
    }))
  }

  const handleActivityChange = (studentId: string, activity: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        activity
      }
    }))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }))
  }

  const handleAbsenceReasonChange = (studentId: string, reason: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        absenceReason: reason
      }
    }))
  }

  const handleCheckInTimeChange = (studentId: string, time: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        checkInTime: time
      }
    }))
  }

  const handleCheckOutTimeChange = (studentId: string, time: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        checkOutTime: time
      }
    }))
  }

  const handleSave = async () => {
    if (!selectedCourse) return

    // Check if user is authenticated
    if (status === 'loading') {
      toast.error('Please wait, loading...')
      return
    }
    
    if (status === 'unauthenticated' || !session) {
      toast.error('Please log in to mark attendance')
      return
    }

    setIsSaving(true)

    try {
      const { ymd } = getLocalYmd(selectedDate)
      const attendanceArray = Object.entries(attendanceData).map(([studentId, data]) => {
        const checkInISO = buildUtcIsoFromLocalYmdTime(ymd, data.checkInTime || null)
        const checkOutISO = buildUtcIsoFromLocalYmdTime(ymd, data.checkOutTime || null)
        return {
          studentId,
          status: data.status,
          activity: data.activity,
          remarks: data.remarks,
          absenceReason: data.absenceReason,
          checkInTime: checkInISO,
          checkOutTime: checkOutISO
        }
      })

      const response = await fetch('/api/tutor/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: getStableDateForApi(selectedDate),
          courseId: selectedCourse,
          attendance: attendanceArray
        })
      })

      const data = await response.json()
      
      console.log('API Response:', data)
      console.log('Response Status:', response.status)
      
      if (data.success) {
        toast.success('Attendance saved successfully')
        onAttendanceSaved?.() // Trigger calendar refresh
        onClose()
      } else {
        console.error('API Error:', data.error)
        console.error('Full Response:', data)
        throw new Error(data.error || 'Failed to save attendance')
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        toast.error('Please log in again to continue')
      } else {
        toast.error(`Failed to save attendance: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'actions':
        return `Quick Actions - ${selectedDate.toLocaleDateString()}`
      case 'course-selection':
        return 'Select Course'
      case 'attendance':
        return `${isEditMode ? 'Edit' : 'Mark'} Attendance - ${selectedDate.toLocaleDateString()}`
      case 'cancel':
        return `Cancel Class - ${selectedDate.toLocaleDateString()}`
      default:
        return 'Quick Actions'
    }
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 'actions':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-blue-600" />
              <h3 className="text-lg font-medium">What would you like to do?</h3>
              <p className="text-sm text-gray-600">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            <div className="grid gap-3">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => handleAction('attendance')}
                disabled={isLoading}
              >
                <UserCheck className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Mark Attendance</div>
                  <div className="text-sm text-gray-600">
                    {isPast ? 'Mark attendance for past date' : 'Take attendance for students'}
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => handleAction('cancel')}
                disabled={isLoading}
              >
                <XCircle className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Cancel Class</div>
                  <div className="text-sm text-gray-600">Cancel the class for this day</div>
                </div>
              </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleAction('holiday')}
              disabled={isLoading}
            >
              <Calendar className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Mark Holiday</div>
                <div className="text-sm text-gray-600">Mark the selected day as a holiday</div>
              </div>
            </Button>
            </div>
          </div>
        )

      case 'course-selection':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-2 text-blue-600" />
              <h3 className="text-lg font-medium">Select a Course</h3>
              <p className="text-sm text-gray-600">
                Choose which course to {selectedAction === 'attendance' ? 'mark attendance for' : 'cancel class for'}
              </p>
            </div>

            <div className="space-y-2">
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-lg font-medium">No courses found</p>
                    <p className="text-sm">You are not assigned to any courses.</p>
                  </div>
                </div>
              ) : (
                courses.map((course) => (
                  <Button
                    key={course.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => handleCourseSelect(course.id)}
                    disabled={isLoading}
                  >
                    <div className="text-left">
                      <div className="font-medium">{course.name}</div>
                      <div className="text-sm text-gray-600">
                        {course.studentCount} students
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        )

      case 'attendance':
        const presentCount = Object.values(attendanceData).filter(data => data.status === 'present').length
        const absentCount = Object.values(attendanceData).filter(data => data.status === 'absent').length
        const lateCount = Object.values(attendanceData).filter(data => data.status === 'late').length

        return (
          <div className="space-y-6">
            {/* Summary Stats */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                    <div className="text-sm text-gray-600">Present</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                    <div className="text-sm text-gray-600">Absent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
                    <div className="text-sm text-gray-600">Late</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Attendance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {students.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-lg font-medium">No students found</p>
                      <p className="text-sm">No active students are enrolled in this course.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                students.map((student) => {
                  const studentData = attendanceData[student.id] || {
                    status: 'present',
                    activity: '',
                    remarks: '',
                    absenceReason: '',
                    checkInTime: '',
                    checkOutTime: ''
                  }

                  return (
                    <Card key={student.id}>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Student Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-gray-600">{student.email}</div>
                            </div>
                          </div>

                          {/* Status Selection */}
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              value={studentData.status}
                              onValueChange={(value) => handleStatusChange(student.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="present">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    Present
                                  </div>
                                </SelectItem>
                                <SelectItem value="absent">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    Absent
                                  </div>
                                </SelectItem>
                                <SelectItem value="late">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                    Late
                                  </div>
                                </SelectItem>
                                <SelectItem value="excused">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-blue-600" />
                                    Excused
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Activity (for present/late students) */}
                          {(studentData.status === 'present' || studentData.status === 'late') && (
                            <div className="space-y-2">
                              <Label>Activity</Label>
                              <Select
                                value={studentData.activity}
                                onValueChange={(value) => handleActivityChange(student.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select activity" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ACTIVITIES.map((activity) => (
                                    <SelectItem key={activity} value={activity}>
                                      {activity}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Time Tracking - Simplified to time only */}
                          {(studentData.status === 'present' || studentData.status === 'late') && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`checkIn-${student.id}`}>Check-in Time</Label>
                                <Input
                                  type="time"
                                  value={studentData.checkInTime}
                                  onChange={(e) => handleCheckInTimeChange(student.id, e.target.value)}
                                  placeholder="HH:MM"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`checkOut-${student.id}`}>Check-out Time</Label>
                                <Input
                                  type="time"
                                  value={studentData.checkOutTime}
                                  onChange={(e) => handleCheckOutTimeChange(student.id, e.target.value)}
                                  placeholder="HH:MM"
                                />
                              </div>
                            </div>
                          )}

                          {/* Absence Reason (for absent students) */}
                          {studentData.status === 'absent' && (
                            <div className="space-y-2">
                              <Label htmlFor={`absence-${student.id}`}>Reason for Absence *</Label>
                              <Textarea
                                id={`absence-${student.id}`}
                                value={studentData.absenceReason}
                                onChange={(e) => handleAbsenceReasonChange(student.id, e.target.value)}
                                placeholder="Enter reason for absence"
                                required
                              />
                            </div>
                          )}

                          {/* Remarks */}
                          <div className="space-y-2">
                            <Label htmlFor={`remarks-${student.id}`}>Remarks</Label>
                            <Textarea
                              id={`remarks-${student.id}`}
                              value={studentData.remarks}
                              onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                              placeholder="Add any remarks or notes"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        )

      case 'cancel':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <XCircle className="w-12 h-12 mx-auto mb-2 text-red-600" />
              <h3 className="text-lg font-medium">Cancel Class</h3>
              <p className="text-sm text-gray-600">
                Provide a reason for cancelling the class on {selectedDate.toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter the reason for cancelling this class..."
                  required
                  rows={4}
                />
              </div>
            </div>
          </div>
        )

      case 'holiday':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-amber-600" />
              <h3 className="text-lg font-medium">Mark Holiday</h3>
              <p className="text-sm text-gray-600">
                Provide a reason for marking a holiday on {selectedDate.toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="holidayReason">Reason for Holiday *</Label>
                <Textarea
                  id="holidayReason"
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                  placeholder="Enter the reason for this holiday..."
                  required
                  rows={4}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStep !== 'actions' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentStep === 'attendance' || currentStep === 'cancel') {
                    setCurrentStep('course-selection')
                  } else {
                    setCurrentStep('actions')
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {getStepTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            getStepContent()
          )}
        </div>

        {/* Footer */}
        {(currentStep === 'attendance' || currentStep === 'cancel' || currentStep === 'holiday') && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={currentStep === 'attendance' ? handleSave : currentStep === 'cancel' ? handleCancelClass : handleMarkHoliday} 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {currentStep === 'attendance' ? (isEditMode ? 'Updating...' : 'Saving...') : currentStep === 'cancel' ? 'Cancelling...' : 'Marking...'}
                </>
              ) : (
                currentStep === 'attendance' ? `${isEditMode ? 'Update' : 'Save'} Attendance` : currentStep === 'cancel' ? 'Cancel Class' : 'Mark Holiday'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
"use client"
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, User, Calendar, Clock as ClockIcon } from 'lucide-react'
import { toast } from 'sonner'

interface AttendanceMarkingFormProps {
  session: {
    id: string
    title: string
    scheduledAt: string
    duration: number
    status: string
  }
  students: Array<{
    id: string
    name: string
    email: string
    avatar?: string
    currentAttendance?: {
      status: string
      checkInTime?: string
      checkOutTime?: string
      notes?: string
    }
  }>
  onMarkAttendance: (studentId: string, attendanceData: {
    status: string
    checkInTime?: string
    checkOutTime?: string
    notes?: string
  }) => Promise<void>
}

export function AttendanceMarkingForm({ 
  session, 
  students, 
  onMarkAttendance 
}: AttendanceMarkingFormProps) {
  const [attendanceData, setAttendanceData] = useState<Record<string, {
    status: string
    checkInTime: string
    checkOutTime: string
    notes: string
  }>>({})

  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({})

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        checkInTime: status === 'PRESENT' || status === 'LATE' ? new Date().toISOString().slice(0, 16) : '',
        checkOutTime: status === 'PRESENT' ? new Date().toISOString().slice(0, 16) : ''
      }
    }))
  }

  const handleTimeChange = (studentId: string, field: 'checkInTime' | 'checkOutTime', value: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }))
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }))
  }

  const handleSubmit = async (studentId: string) => {
    const data = attendanceData[studentId]
    if (!data || !data.status) {
      toast.error('Please select attendance status')
      return
    }

    setIsSubmitting(prev => ({ ...prev, [studentId]: true }))

    try {
      await onMarkAttendance(studentId, {
        status: data.status,
        checkInTime: data.checkInTime || undefined,
        checkOutTime: data.checkOutTime || undefined,
        notes: data.notes || undefined
      })
      
      toast.success('Attendance marked successfully')
    } catch (error) {
      toast.error('Failed to mark attendance')
    } finally {
      setIsSubmitting(prev => ({ ...prev, [studentId]: false }))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'ABSENT': return <XCircle className="w-4 h-4 text-red-600" />
      case 'LATE': return <Clock className="w-4 h-4 text-yellow-600" />
      default: return <User className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800'
      case 'ABSENT': return 'bg-red-100 text-red-800'
      case 'LATE': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Mark Attendance - {session.title}
        </CardTitle>
        <div className="text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              {new Date(session.scheduledAt).toLocaleDateString()} at {new Date(session.scheduledAt).toLocaleTimeString()}
            </span>
            <span>Duration: {session.duration} minutes</span>
            <Badge variant={session.status === 'COMPLETED' ? 'default' : 'secondary'}>
              {session.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student) => {
            const currentData = attendanceData[student.id] || {
              status: student.currentAttendance?.status || '',
              checkInTime: student.currentAttendance?.checkInTime || '',
              checkOutTime: student.currentAttendance?.checkOutTime || '',
              notes: student.currentAttendance?.notes || ''
            }

            return (
              <div key={student.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-600">{student.email}</div>
                  </div>
                  {currentData.status && (
                    <Badge className={getStatusColor(currentData.status)}>
                      {currentData.status}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`status-${student.id}`}>Attendance Status</Label>
                    <Select
                      value={currentData.status}
                      onValueChange={(value) => handleStatusChange(student.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENT">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Present
                          </div>
                        </SelectItem>
                        <SelectItem value="LATE">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            Late
                          </div>
                        </SelectItem>
                        <SelectItem value="ABSENT">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            Absent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(currentData.status === 'PRESENT' || currentData.status === 'LATE') && (
                    <div>
                      <Label htmlFor={`checkIn-${student.id}`}>Check-in Time</Label>
                      <Input
                        type="datetime-local"
                        value={currentData.checkInTime}
                        onChange={(e) => handleTimeChange(student.id, 'checkInTime', e.target.value)}
                      />
                    </div>
                  )}

                  {currentData.status === 'PRESENT' && (
                    <div>
                      <Label htmlFor={`checkOut-${student.id}`}>Check-out Time</Label>
                      <Input
                        type="datetime-local"
                        value={currentData.checkOutTime}
                        onChange={(e) => handleTimeChange(student.id, 'checkOutTime', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor={`notes-${student.id}`}>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes about this student's attendance..."
                    value={currentData.notes}
                    onChange={(e) => handleNotesChange(student.id, e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSubmit(student.id)}
                    disabled={!currentData.status || isSubmitting[student.id]}
                    className="min-w-[120px]"
                  >
                    {isSubmitting[student.id] ? 'Saving...' : 'Mark Attendance'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

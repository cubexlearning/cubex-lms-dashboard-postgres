"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { AttendanceMarkingForm } from '@/components/attendance/AttendanceMarkingForm'
import { ArrowLeft, Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Session = {
  id: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  type: string
  status: string
  notes?: string
  _count: {
    attendanceRecords: number
  }
}

type Student = {
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
}

export default function TutorSessionsPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const courseId = params.courseId
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sessionStudents, setSessionStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false)

  useEffect(() => {
    if (courseId && session?.user?.id) {
      loadSessions()
    }
  }, [courseId, session])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tutor/courses/${courseId}/sessions`)
      const data = await response.json()
      
      if (data.success) {
        setSessions(data.data)
      } else {
        toast.error('Failed to load sessions')
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      toast.error('Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSessionAttendance = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/tutor/courses/${courseId}/sessions/${sessionId}/attendance`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedSession(data.data.session)
        setSessionStudents(data.data.students)
      } else {
        toast.error('Failed to load session attendance')
      }
    } catch (error) {
      console.error('Error loading session attendance:', error)
      toast.error('Failed to load session attendance')
    }
  }

  const handleMarkAttendance = async (studentId: string, attendanceData: {
    status: string
    checkInTime?: string
    checkOutTime?: string
    notes?: string
  }) => {
    if (!selectedSession) return

    try {
      const response = await fetch(`/api/tutor/courses/${courseId}/sessions/${selectedSession.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          ...attendanceData
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setSessionStudents(prev => prev.map(student => 
          student.id === studentId 
            ? {
                ...student,
                currentAttendance: {
                  status: attendanceData.status,
                  checkInTime: attendanceData.checkInTime,
                  checkOutTime: attendanceData.checkOutTime,
                  notes: attendanceData.notes
                }
              }
            : student
        ))
      } else {
        throw new Error(data.error || 'Failed to mark attendance')
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      throw error
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'NO_SHOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <Calendar className="w-4 h-4" />
      case 'IN_PROGRESS': return <Clock className="w-4 h-4" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      case 'NO_SHOW': return <AlertCircle className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <RoleLayoutWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading sessions...</span>
          </div>
        </div>
      </RoleLayoutWrapper>
    )
  }

  return (
    <RoleLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Class Sessions</h1>
            <p className="text-gray-600">Manage class sessions and mark attendance</p>
          </div>
        </div>

        {!selectedSession ? (
          /* Sessions List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(session.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(session.scheduledAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{session._count.attendanceRecords} students marked</span>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {session.description}
                      </p>
                    )}
                    <Button 
                      className="w-full" 
                      onClick={() => loadSessionAttendance(session.id)}
                    >
                      Mark Attendance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Attendance Marking */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedSession(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sessions
              </Button>
              <div className="text-sm text-gray-600">
                {sessionStudents.length} students enrolled
              </div>
            </div>

            <AttendanceMarkingForm
              session={selectedSession}
              students={sessionStudents}
              onMarkAttendance={handleMarkAttendance}
            />
          </div>
        )}
      </div>
    </RoleLayoutWrapper>
  )
}

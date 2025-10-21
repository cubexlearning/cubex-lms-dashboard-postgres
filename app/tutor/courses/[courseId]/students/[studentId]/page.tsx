"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { AttendanceChart } from '@/components/students/AttendanceChart'
import { AssignmentProgress } from '@/components/students/AssignmentProgress'
import { SyllabusProgress } from '@/components/students/SyllabusProgress'
import { ArrowLeft, Mail, Calendar, UserCheck, BookOpen, Clock, TrendingUp, MessageSquare, Loader2, Star, Eye } from 'lucide-react'
import { toast } from 'sonner'

type Student = {
  id: string
  name: string
  email: string
  avatar?: string
  enrollment: {
    id: string
    status: string
    enrolledAt: string
    progress: number
  }
  attendanceRate: number
  completedAssignments: number
  totalAssignments: number
  lastActivity?: string
}

type AttendanceRecord = {
  id: string
  sessionId: string
  status: string
  checkInTime?: string
  checkOutTime?: string
  notes?: string
  session: {
    title: string
    scheduledAt: string
    status: string
  }
}

type AssignmentSubmission = {
  id: string
  assignmentId: string
  status: string
  submittedAt: string
  grade?: number
  feedback?: string
  assignment: {
    title: string
    dueDate: string
    maxPoints: number
  }
}

type SyllabusItem = {
  itemId: string
  title: string
  completedByStudent: boolean
  completedByTutor: boolean
  completedAt?: string
}

type SyllabusProgress = {
  phaseId: string
  phaseName: string
  items: SyllabusItem[]
  completedByStudent: boolean
  completedByTutor: boolean
  completedAt?: string
  tutorNotes?: string
}

export default function TutorStudentProfilePage() {
  const params = useParams<{ courseId: string; studentId: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const courseId = params.courseId
  const studentId = params.studentId
  const [student, setStudent] = useState<Student | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [assignments, setAssignments] = useState<AssignmentSubmission[]>([])
  const [syllabusProgress, setSyllabusProgress] = useState<SyllabusProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const [completedAtInput, setCompletedAtInput] = useState<string>('')
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false)

  useEffect(() => {
    if (courseId && studentId && session?.user?.id) {
      loadStudentData()
    }
  }, [courseId, studentId, session])

  const loadStudentData = async () => {
    setIsLoading(true)
    try {
      // Load student basic info
      const studentResponse = await fetch(`/api/tutor/courses/${courseId}/students/${studentId}`)
      const studentData = await studentResponse.json()
      
      if (studentData.success) {
        setStudent(studentData.data)
      } else {
        toast.error('Failed to load student data')
        router.push(`/tutor/courses/${courseId}/students`)
        return
      }

      // Load attendance history
      const attendanceResponse = await fetch(`/api/tutor/courses/${courseId}/students/${studentId}/attendance`)
      const attendanceData = await attendanceResponse.json()
      
      if (attendanceData.success) {
        setAttendance(attendanceData.data)
      }

      // Load assignment submissions
      const assignmentsResponse = await fetch(`/api/tutor/courses/${courseId}/students/${studentId}/assignments`)
      const assignmentsData = await assignmentsResponse.json()
      
      if (assignmentsData.success) {
        setAssignments(assignmentsData.data)
      }

      // Load syllabus progress
      const progressResponse = await fetch(`/api/tutor/courses/${courseId}/students/${studentId}/progress`)
      const progressData = await progressResponse.json()
      
      if (progressData.success) {
        setSyllabusProgress(progressData.data)
      }
    } catch (error) {
      console.error('Error loading student data:', error)
      toast.error('Failed to load student data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 border-green-200"
      case "PAUSED": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "COMPLETED": return "bg-blue-100 text-blue-800 border-blue-200"
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleViewSubmission = (submissionId: string) => {
    // TODO: Open submission viewer modal
    console.log('View submission:', submissionId)
  }

  const handleGradeSubmission = (submissionId: string) => {
    // TODO: Open grading interface
    console.log('Grade submission:', submissionId)
  }

  const handleOpenCompleteModal = (itemId: string) => {
    setPendingItemId(itemId)
    // default to now in local datetime-local format
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
    setCompletedAtInput(local)
    setCompleteModalOpen(true)
  }

  const handleConfirmComplete = async () => {
    if (!courseId || !studentId || !pendingItemId) return
    const completedAtISO = completedAtInput ? new Date(completedAtInput).toISOString() : undefined
    // Optimistic update for item
    setSyllabusProgress(prev => prev.map(phase => ({
      ...phase,
      items: phase.items.map(it => it.itemId === pendingItemId ? { ...it, completedByTutor: true, completedAt: completedAtISO } : it)
    })))
    try {
      setIsSubmittingComplete(true)
      const res = await fetch(`/api/tutor/courses/${courseId}/students/${studentId}/syllabus/${pendingItemId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedAt: completedAtISO })
      })
      const json = await res.json()
      if (!json.success) {
        // revert
        setSyllabusProgress(prev => prev.map(phase => ({
          ...phase,
          items: phase.items.map(it => it.itemId === pendingItemId ? { ...it, completedByTutor: false, completedAt: undefined } : it)
        })))
      } else {
        loadStudentData()
      }
    } catch (e) {
      setSyllabusProgress(prev => prev.map(phase => ({
        ...phase,
        items: phase.items.map(it => it.itemId === pendingItemId ? { ...it, completedByTutor: false, completedAt: undefined } : it)
      })))
    } finally {
      setIsSubmittingComplete(false)
      setCompleteModalOpen(false)
      setPendingItemId(null)
    }
  }

  const handleAddPhaseNotes = (phaseId: string) => {
    // TODO: Add notes to phase
    console.log('Add phase notes:', phaseId)
  }

  if (isLoading) {
    return (
      <RoleLayoutWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading student profile...</span>
          </div>
        </div>
      </RoleLayoutWrapper>
    )
  }

  if (!student) {
    return (
      <RoleLayoutWrapper>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Student not found</h3>
          <p className="text-gray-500">This student may not be enrolled in this course.</p>
          <Button onClick={() => router.push(`/tutor/courses/${courseId}/students`)} className="mt-4">
            Back to Students
          </Button>
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
            <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-600">Student profile and progress tracking</p>
          </div>
        </div>

        {/* Student Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={student.avatar} alt={student.name} />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {student.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{student.name}</h3>
                  <Badge className={getStatusColor(student.enrollment.status)}>
                    {student.enrollment.status}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-3">{student.email}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Enrolled: {new Date(student.enrollment.enrolledAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span>Progress: {student.enrollment.progress}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    <span>Attendance: {student.attendanceRate}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>Assignments: {student.completedAssignments}/{student.totalAssignments}</span>
                  </div>
                </div>
              </div>
              {/* <div className="flex gap-2">
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceChart attendanceRecords={attendance} />
              <AssignmentProgress 
                assignments={assignments}
                onViewSubmission={handleViewSubmission}
                onGradeSubmission={handleGradeSubmission}
              />
            </div>
            <SyllabusProgress 
              progress={syllabusProgress}
              onMarkComplete={handleOpenCompleteModal}
              onAddNotes={handleAddPhaseNotes}
            />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceChart attendanceRecords={attendance} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentProgress 
              assignments={assignments}
              onViewSubmission={handleViewSubmission}
              onGradeSubmission={handleGradeSubmission}
            />
          </TabsContent>

          <TabsContent value="syllabus">
            <SyllabusProgress 
              progress={syllabusProgress}
              onMarkComplete={handleOpenCompleteModal}
              onAddNotes={handleAddPhaseNotes}
            />
          </TabsContent>
        </Tabs>
      </div>
      {/* Complete Modal */}
      <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark item as completed</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm text-gray-600">Completed at</label>
            <Input type="datetime-local" value={completedAtInput} onChange={(e) => setCompletedAtInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteModalOpen(false)} disabled={isSubmittingComplete}>Cancel</Button>
            <Button onClick={handleConfirmComplete} disabled={isSubmittingComplete}>
              {isSubmittingComplete ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleLayoutWrapper>
  )
}
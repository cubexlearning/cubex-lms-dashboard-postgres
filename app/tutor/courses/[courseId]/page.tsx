"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { ArrowLeft, BookOpen, Users, Calendar, Clock, GraduationCap, Loader2, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type Course = {
  id: string
  title: string
  shortDescription?: string
  longDescription?: string
  status: string
  category?: { name: string }
  courseFormat?: { name: string }
  courseType?: { name: string }
  curriculum?: { name: string }
  sessionDuration?: number
  sessionsPerWeek?: number
  totalSessions?: number
  minAge?: number
  maxAge?: number
  prerequisiteLevel?: string
  difficulty?: string
  tags?: string[]
  _count?: { 
    enrollments: number
    syllabusPhases?: number
  }
  courseTutors?: Array<{
    isPrimary: boolean
    specialization: string
    canTeachOneToOne: boolean
    canTeachGroup: boolean
  }>
  enrollments?: Array<{
    id: string
    status: string
    student: {
      id: string
      name: string
      email: string
      avatar?: string
    }
  }>
}

type SyllabusPhase = {
  id: string
  name: string
  order: number
  items?: Array<{
    id: string
    title: string
    description?: string
    order: number
  }>
}

export default function TutorCourseDetailsPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const courseId = params.courseId
  const [course, setCourse] = useState<Course | null>(null)
  const [syllabus, setSyllabus] = useState<SyllabusPhase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [sessions, setSessions] = useState<any[]>([])
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<any | null>(null)

  useEffect(() => {
    if (courseId && session?.user?.id) {
      loadCourseDetails()
    }
  }, [courseId, session])

  const loadCourseDetails = async () => {
    setIsLoading(true)
    try {
      // Load course details
      const courseResponse = await fetch(`/api/tutor/courses/${courseId}`)
      const courseData = await courseResponse.json()
      
      if (courseData.success) {
        setCourse(courseData.data)
      } else {
        toast.error('Failed to load course details')
        router.push('/tutor/courses')
        return
      }

      // Load syllabus
      const syllabusResponse = await fetch(`/api/courses/${courseId}/syllabus/phases`)
      const syllabusData = await syllabusResponse.json()
      
      console.log('Syllabus data:', syllabusData) // Debug log
      
      if (syllabusData.success) {
        setSyllabus(syllabusData.data.phases || [])
      }

      // Load sessions
      const sessionsResponse = await fetch(`/api/tutor/courses/${courseId}/sessions`)
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        if (sessionsData.success) setSessions(sessionsData.data || [])
      }
    } catch (error) {
      console.error('Error loading course details:', error)
      toast.error('Failed to load course details')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-800 border-green-200"
      case "DRAFT": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "ARCHIVED": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner": return "bg-green-100 text-green-800"
      case "intermediate": return "bg-yellow-100 text-yellow-800"
      case "advanced": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId)
      } else {
        newSet.add(phaseId)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <RoleLayoutWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading course details...</span>
          </div>
        </div>
      </RoleLayoutWrapper>
    )
  }

  if (!course) {
    return (
      <RoleLayoutWrapper>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Course not found</h3>
          <p className="text-gray-500">This course may not be assigned to you or doesn't exist.</p>
          <Button onClick={() => router.push('/tutor/courses')} className="mt-4">
            Back to My Courses
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
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600">Course details and management</p>
          </div>
        </div>

        {/* Course Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    {course.shortDescription && (
                      <p className="text-gray-600 mt-2">{course.shortDescription}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(course.status)}>
                    {course.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.longDescription && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600">{course.longDescription}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Course Details</h4>
                    <div className="space-y-2 text-sm">
                      {course.category && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span>Category: {course.category.name}</span>
                        </div>
                      )}
                      {course.courseFormat && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-gray-400" />
                          <span>Format: {course.courseFormat.name}</span>
                        </div>
                      )}
                      {course.courseType && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>Type: {course.courseType.name}</span>
                        </div>
                      )}
                      {course.curriculum && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span>Curriculum: {course.curriculum.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

               
                </div>

              </CardContent>
            </Card>

            {/* Syllabus */}
            <Card>
              <CardHeader>
                <CardTitle>Syllabus ({syllabus.length} phases)</CardTitle>
              </CardHeader>
              <CardContent>
                {syllabus.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No syllabus phases defined yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {syllabus.map((phase) => {
                      console.log('Rendering phase:', phase) // Debug log
                      const isExpanded = expandedPhases.has(phase.id)
                      const hasItems = phase.items && phase.items.length > 0
                      
                      return (
                        <div key={phase.id} className="border rounded-lg">
                          <div 
                            className="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                            onClick={() => togglePhase(phase.id)}
                          >
                            <div className="font-medium">
                              {phase.order + 1}. {phase.name}
                              {hasItems && (
                                <span className="text-sm text-gray-500 ml-2">
                                  ({phase.items!.length} items)
                                </span>
                              )}
                            </div>
                            {hasItems && (
                              <div className="flex items-center">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          {isExpanded && hasItems && (
                            <div className="border-t bg-gray-50 p-3">
                              <div className="space-y-2">
                                {phase.items!.map((item) => (
                                  <div key={item.id} className="flex items-start gap-3 p-2 bg-white rounded border">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                                      {item.order + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{item.title}</div>
                                      {item.description && (
                                        <div className="text-xs text-gray-600 mt-1">
                                          {item.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sessions ({sessions.length})</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/tutor/courses/${courseId}/sessions`)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Sessions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No sessions scheduled</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessions.map((s) => {
                    const scheduledAt = new Date(s.scheduledAt)
                    const dateStr = scheduledAt.toLocaleDateString()
                    const timeStr = scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={s.id} className="border rounded-lg p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{s.title || 'Session'}</div>
                          <Badge>{s.status}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{dateStr}</span>
                          <span>•</span>
                          <span>{timeStr}</span>
                          {s.duration ? <span>• {s.duration} min</span> : null}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSession(s)
                              setShowSessionModal(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => router.push(`/tutor/courses/${courseId}/sessions?sessionId=${s.id}`)}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <span className="font-medium">{course._count?.enrollments || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Syllabus Phases</span>
                  <span className="font-medium">{course._count?.syllabusPhases || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Enrollments</span>
                  <span className="font-medium">
                    {course.enrollments?.filter(e => e.status === 'ACTIVE').length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Your Role */}
            {course.courseTutors && course.courseTutors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Role</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.courseTutors.map((tutor, index) => (
                    <div key={index} className="space-y-2">
                      <Badge variant={tutor.isPrimary ? "default" : "secondary"}>
                        {tutor.isPrimary ? "Primary Tutor" : "Co-Tutor"}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        Specialization: {tutor.specialization}
                      </div>
                      <div className="text-sm text-gray-600">
                        Can teach: {tutor.canTeachOneToOne ? "1:1" : ""} 
                        {tutor.canTeachOneToOne && tutor.canTeachGroup ? ", " : ""}
                        {tutor.canTeachGroup ? "Group" : ""}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push(`/tutor/courses/${courseId}/students`)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Students
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push(`/tutor/courses/${courseId}/sessions`)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Sessions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Session details modal */}
      <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSession?.title || 'Session details'}</DialogTitle>
            <DialogDescription>
              {selectedSession ? (
                <div className="space-y-2 mt-2">
                  <div className="text-sm text-gray-600">Status: {selectedSession.status}</div>
                  <div className="text-sm text-gray-600">
                    Scheduled: {new Date(selectedSession.scheduledAt).toLocaleString()}
                  </div>
                  {selectedSession.duration ? (
                    <div className="text-sm text-gray-600">Duration: {selectedSession.duration} min</div>
                  ) : null}
                  {selectedSession.description ? (
                    <div className="text-sm text-gray-700">{selectedSession.description}</div>
                  ) : null}
                </div>
              ) : null}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </RoleLayoutWrapper>
  )
}
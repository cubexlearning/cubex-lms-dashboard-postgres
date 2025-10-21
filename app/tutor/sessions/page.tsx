"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { SessionCalendar } from '@/components/calendar/SessionCalendar'
import { QuickActionsModal } from '@/components/calendar/QuickActionsModal'
import { Calendar, Users, Clock, TrendingUp, Filter, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SessionEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    courseId: string
    courseName: string
    studentCount: number
    attendanceRate: number
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  }
}

interface Course {
  id: string
  name: string
  studentCount: number
  isActive: boolean
}

export default function TutorSessionsPage() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<SessionEvent[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load events and courses in parallel
      const [eventsResponse, coursesResponse] = await Promise.all([
        fetch('/api/tutor/sessions/calendar'),
        fetch('/api/tutor/courses')
      ])

      const [eventsData, coursesData] = await Promise.all([
        eventsResponse.json(),
        coursesResponse.json()
      ])

      if (eventsData.success) {
        setEvents(eventsData.data)
      }

      if (coursesData.success) {
        console.log('Courses loaded:', coursesData.data)
        // Transform the course data to match the expected format
        const transformedCourses = coursesData.data.map((course: any) => ({
          id: course.id,
          name: course.title, // Map title to name
          studentCount: course._count.enrollments,
          isActive: course.status === 'PUBLISHED'
        }))
        console.log('Transformed courses:', transformedCourses)
        setCourses(transformedCourses)
      } else {
        console.error('Failed to load courses:', coursesData.error)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowQuickActions(true)
  }

  const handleEventClick = (event: SessionEvent) => {
    // Navigate to session details or open session modal
    console.log('Event clicked:', event)
  }

  const handleMarkAttendance = async (courseId: string, date: Date) => {
    // This is now handled within the QuickActionsModal
    console.log('Mark attendance:', courseId, date)
  }

  const handleCreateSession = (courseId: string, date: Date) => {
    // Navigate to create session page or open session creation modal
    console.log('Create session:', courseId, date)
  }

  const handleViewSchedule = (courseId: string, date: Date) => {
    // Navigate to schedule view
    console.log('View schedule:', courseId, date)
  }

  const handleAttendanceSaved = () => {
    // Refresh calendar data when attendance is saved
    loadData()
  }

  const filteredEvents = selectedCourse === 'all' 
    ? events 
    : events.filter(event => event.resource.courseId === selectedCourse)

  const selectedCourseName = selectedCourse === 'all' 
    ? 'All Courses' 
    : courses.find(c => c.id === selectedCourse)?.name || 'Unknown Course'

  if (isLoading) {
    return (
      <RoleLayoutWrapper allowedRoles={['TUTOR']}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading sessions...</span>
        </div>
      </RoleLayoutWrapper>
    )
  }

  return (
    <RoleLayoutWrapper allowedRoles={['TUTOR']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Session Calendar</h1>
            <p className="text-gray-600">Manage your class sessions and attendance</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{events.length}</div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {courses.reduce((sum, course) => sum + course.studentCount, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {events.filter(e => e.resource.status === 'scheduled').length}
                  </div>
                  <div className="text-sm text-gray-600">Upcoming</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {Math.round(events.reduce((sum, e) => sum + e.resource.attendanceRate, 0) / Math.max(events.length, 1))}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Attendance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Filter by Course:</span>
              </div>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} ({course.studentCount} students)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedCourseName} - Session Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SessionCalendar
              events={filteredEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          </CardContent>
        </Card>

        {/* Quick Actions Modal */}
        {selectedDate && (
          <QuickActionsModal
            isOpen={showQuickActions}
            onClose={() => {
              setShowQuickActions(false)
              setSelectedDate(null)
            }}
            selectedDate={selectedDate}
            courses={courses}
            onMarkAttendance={handleMarkAttendance}
            onCreateSession={handleCreateSession}
            onViewSchedule={handleViewSchedule}
            onAttendanceSaved={handleAttendanceSaved}
          />
        )}
      </div>
    </RoleLayoutWrapper>
  )
}

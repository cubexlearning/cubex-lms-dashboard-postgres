"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { BookOpen, Users, Calendar, TrendingUp, Loader2, GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Course = {
  id: string
  title: string
  shortDescription?: string
  status: string
  category?: { name: string }
  courseFormat?: { name: string }
  _count?: { 
    enrollments: number
    syllabusPhases?: number
  }
  courseTutors?: Array<{
    isPrimary: boolean
    specialization: string
  }>
}

type Stats = {
  totalCourses: number
  totalStudents: number
  upcomingSessions: number
  completedSessions: number
}

export default function TutorDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalStudents: 0,
    upcomingSessions: 0,
    completedSessions: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      loadTutorData()
    }
  }, [session])

  const loadTutorData = async () => {
    setIsLoading(true)
    try {
      // Load assigned courses
      const coursesResponse = await fetch(`/api/tutor/courses`)
      const coursesData = await coursesResponse.json()
      
      if (coursesData.success) {
        setCourses(coursesData.data)
        setStats(prev => ({
          ...prev,
          totalCourses: coursesData.data.length,
          totalStudents: coursesData.data.reduce((sum: number, course: Course) => 
            sum + (course._count?.enrollments || 0), 0
          )
        }))
      }

      // Load additional stats (sessions, etc.)
      const statsResponse = await fetch(`/api/tutor/stats`)
      const statsData = await statsResponse.json()
      
      if (statsData.success) {
        setStats(prev => ({
          ...prev,
          upcomingSessions: statsData.data.upcomingSessions || 0,
          completedSessions: statsData.data.completedSessions || 0
        }))
      }
    } catch (error) {
      console.error('Error loading tutor data:', error)
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

  if (isLoading) {
    return (
      <RoleLayoutWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </RoleLayoutWrapper>
    )
  }

  return (
    <RoleLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {session?.user?.name}!</h1>
            <p className="text-gray-600">Here's what's happening with your courses today</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">
                Assigned courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Across all courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedSessions}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* My Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Courses</CardTitle>
              <Button onClick={() => router.push('/tutor/courses')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses assigned</h3>
                <p className="text-gray-500">You haven't been assigned to any courses yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.slice(0, 6).map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                          {course.shortDescription && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {course.shortDescription}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(course.status)}>
                          {course.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start flex-col gap-2 text-sm text-gray-500">
                        {course.category && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {course.category.name}
                          </div>
                        )}
                        {course.courseFormat && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            {course.courseFormat.name}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course._count?.enrollments || 0} students
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {course._count?.syllabusPhases || 0} phases
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/tutor/courses/${course.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleLayoutWrapper>
  )
}
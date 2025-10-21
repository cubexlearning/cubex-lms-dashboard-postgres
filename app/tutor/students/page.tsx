"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Search, Users, Mail, Calendar, Eye, MessageSquare, Loader2, UserCheck, Clock, BookOpen, Filter } from 'lucide-react'
import { toast } from 'sonner'

type Student = {
  id: string
  name: string
  email: string
  avatar?: string
  courses: Array<{
    courseId: string
    courseTitle: string
    enrollmentId: string
    status: string
    enrolledAt: string
    progress?: number
  }>
  totalAttendanceRate: number
  totalCompletedAssignments: number
  totalAssignments: number
  lastActivity?: string
}

type Course = {
  id: string
  title: string
  _count?: {
    enrollments: number
  }
}

export default function TutorStudentsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')

  useEffect(() => {
    if (session?.user?.id) {
      loadStudents()
      loadCourses()
    }
  }, [session, searchTerm, statusFilter, courseFilter])

  const loadStudents = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (courseFilter !== 'all') params.append('courseId', courseFilter)
      
      const response = await fetch(`/api/tutor/students?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setStudents(data.data)
      } else {
        toast.error('Failed to load students')
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/tutor/courses')
      const data = await response.json()
      
      if (data.success) {
        setCourses(data.data)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 60) return "bg-yellow-500"
    if (progress >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  const getUniqueStudents = () => {
    const uniqueStudents = new Map()
    students.forEach(student => {
      if (!uniqueStudents.has(student.id)) {
        uniqueStudents.set(student.id, student)
      }
    })
    return Array.from(uniqueStudents.values())
  }

  const uniqueStudents = getUniqueStudents()

  return (
    <RoleLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
            <p className="text-gray-600">Manage and track all your students across courses</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{uniqueStudents.length}</div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {uniqueStudents.filter(s => s.courses.some((c: any) => c.status === 'ACTIVE')).length}
                  </div>
                  <div className="text-sm text-gray-600">Active Enrollments</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{courses.length}</div>
                  <div className="text-sm text-gray-600">Assigned Courses</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {Math.round(uniqueStudents.reduce((sum, s) => sum + s.totalAttendanceRate, 0) / uniqueStudents.length) || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Attendance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select 
                value={courseFilter} 
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading students...</span>
            </div>
          </div>
        ) : uniqueStudents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
                  ? 'No students match your search criteria.' 
                  : 'No students are enrolled in your courses yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueStudents.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {student.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Course Enrollments */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Enrolled Courses:</h4>
                    {student.courses.map((course: any) => (
                      <div key={course.enrollmentId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{course.courseTitle}</div>
                          <div className="text-xs text-gray-500">
                            Enrolled: {new Date(course.enrolledAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(course.status)}>
                            {course.status}
                          </Badge>
                          {course.progress !== undefined && (
                            <div className="text-xs text-gray-500">
                              {course.progress}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Overall Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Overall Attendance:</span>
                      <span>{student.totalAttendanceRate}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Assignments:</span>
                      <span>{student.totalCompletedAssignments}/{student.totalAssignments}</span>
                    </div>

                    {student.lastActivity && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Activity:</span>
                        <span className="text-xs">
                          {new Date(student.lastActivity).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to the first course's student profile
                        const firstCourse = student.courses[0]
                        if (firstCourse) {
                          router.push(`/tutor/courses/${firstCourse.courseId}/students/${student.id}`)
                        }
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement messaging functionality
                        toast.info('Messaging feature coming soon!')
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleLayoutWrapper>
  )
}

"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { ArrowLeft, Search, Users, Mail, Calendar, Eye, MessageSquare, Loader2, UserCheck, Clock } from 'lucide-react'
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
    progress?: number
  }
  lastActivity?: string
  attendanceRate?: number
  completedAssignments?: number
  totalAssignments?: number
}

type Course = {
  id: string
  title: string
  _count?: {
    enrollments: number
  }
}

export default function TutorStudentsPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const courseId = params.courseId
  const [students, setStudents] = useState<Student[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (courseId && session?.user?.id) {
      loadStudents()
      loadCourseInfo()
    }
  }, [courseId, session, searchTerm, statusFilter])

  const loadStudents = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/tutor/courses/${courseId}/students?${params.toString()}`)
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

  const loadCourseInfo = async () => {
    try {
      const response = await fetch(`/api/tutor/courses/${courseId}`)
      const data = await response.json()
      
      if (data.success) {
        setCourse(data.data)
      }
    } catch (error) {
      console.error('Error loading course info:', error)
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
            <h1 className="text-3xl font-bold text-gray-900">
              Students - {course?.title || 'Loading...'}
            </h1>
            <p className="text-gray-600">Manage and track your students' progress</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{students.length}</div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {students.filter(s => s.enrollment.status === 'ACTIVE').length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {students.filter(s => s.enrollment.status === 'PAUSED').length}
                  </div>
                  <div className="text-sm text-gray-600">Paused</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {students.filter(s => s.enrollment.status === 'COMPLETED').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
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
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No students match your search criteria.' 
                  : 'No students are enrolled in this course yet.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {students.map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">{student.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{student.email}</p>
                    </div>
                    <Badge className={`${getStatusColor(student.enrollment.status)} flex-shrink-0 text-xs`}>
                      {student.enrollment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Enrollment Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Enrolled:</span>
                      <span className="font-medium">{new Date(student.enrollment.enrolledAt).toLocaleDateString()}</span>
                    </div>
                    
                    {student.enrollment.progress !== undefined && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress:</span>
                          <span className="font-medium">{student.enrollment.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(student.enrollment.progress)}`}
                            style={{ width: `${Math.min(100, Math.max(0, student.enrollment.progress))}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {student.attendanceRate !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Attendance:</span>
                        <span className="font-medium">{student.attendanceRate}%</span>
                      </div>
                    )}

                    {student.completedAssignments !== undefined && student.totalAssignments !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Assignments:</span>
                        <span className="font-medium">{student.completedAssignments}/{student.totalAssignments}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/tutor/courses/${courseId}/students/${student.id}`)}
                      className="flex-1 text-xs"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/tutor/courses/${courseId}/students/${student.id}/messages`)}
                      className="px-3"
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

"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Search, BookOpen, Users, Calendar, Eye, Loader2, GraduationCap } from 'lucide-react'

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

export default function TutorCoursesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  // Debounce search to avoid firing requests on every keystroke
  const debouncedSearch = useDebouncedValue(searchTerm, 300)

  useEffect(() => {
    if (session?.user?.id) {
      loadCourses()
    }
  }, [session, debouncedSearch, statusFilter])

  const loadCourses = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (statusFilter !== 'all') params.append('status', statusFilter.toUpperCase())
      
      const response = await fetch(`/api/tutor/courses?${params.toString()}`)
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        console.error('Failed to load courses: HTTP', response.status, text)
        setCourses([])
        return
      }
      const data = await response.json().catch((err) => {
        console.error('Failed to parse courses response JSON:', err)
        return { success: false }
      })
      
      if (data.success) {
        setCourses(data.data)
      } else {
        console.error('Failed to load courses:', data?.error || 'Unknown error')
        setCourses([])
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

// Simple debounce hook local to this file
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebounced(value), delayMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, delayMs])

  return debounced
}

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-800 border-green-200"
      case "DRAFT": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "ARCHIVED": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getFormatColor = (key: string) => {
    const k = key.toUpperCase().replace(/\s+/g, '_')
    switch (k) {
      case "BOTH_FORMATS": return "bg-blue-100 text-blue-800 border-blue-200"
      case "ONE_TO_ONE_ONLY": return "bg-purple-100 text-purple-800 border-purple-200"
      case "GROUP_ONLY": return "bg-orange-100 text-orange-800 border-orange-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <RoleLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600">Manage your assigned courses and students</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search courses..."
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
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading courses...</span>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses assigned</h3>
              <p className="text-gray-500">You haven't been assigned to any courses yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
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
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {course._count?.syllabusPhases || 0} phases
                    </div>
                  </div>

                  {/* Tutor Role Badge */}
                  {course.courseTutors && course.courseTutors.length > 0 && (
                    <div className="flex items-center gap-2">
                      {course.courseTutors.map((tutor, index) => (
                        <Badge 
                          key={index}
                          variant={tutor.isPrimary ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {tutor.isPrimary ? "Primary Tutor" : "Co-Tutor"}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div >
                    <div className="text-sm text-gray-500 mb-2">
                      {course._count?.syllabusPhases || 0} syllabus phases
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/tutor/courses/${course.id}/students`)}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Students
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/tutor/courses/${course.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
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

"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, BookOpen, Users, Calendar, Eye, Loader2, GraduationCap } from 'lucide-react'

type Course = {
  id: string
  title: string
  shortDescription?: string
  status: string
  category?: { name: string }
  courseFormat?: { name: string }
  _count?: { enrollments: number; syllabusPhases?: number }
}

type EnrollmentRow = {
  enrollmentId: string
  course: Course
  enrolledAt: string
  status: string
}

export default function StudentCoursesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<EnrollmentRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  const loadCourses = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      const res = await fetch(`/api/student/courses?${params.toString()}`)
      const json = await res.json()
      if (json.success) setRows(json.data)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800 border-green-200'
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <RoleLayoutWrapper allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600">Your enrolled courses</p>
          </div>
        </div>

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
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading courses...</span>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-500">You are not enrolled in any courses yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.map((row) => (
              <Card key={row.enrollmentId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{row.course.title}</CardTitle>
                      {row.course.shortDescription && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {row.course.shortDescription}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(row.course.status)}>
                      {row.course.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start flex-col gap-2 text-sm text-gray-500">
                    {row.course.category && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {row.course.category.name}
                      </div>
                    )}
                    {row.course.courseFormat && (
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        {row.course.courseFormat.name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {row.course._count?.enrollments || 0} students
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {row.course._count?.syllabusPhases || 0} phases
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-2">
                      Enrolled: {new Date(row.enrolledAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/student/courses/${row.course.id}`)}
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




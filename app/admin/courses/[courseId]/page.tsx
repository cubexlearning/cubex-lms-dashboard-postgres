"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Users, 
  Loader2, 
  Calendar,
  DollarSign,
  GraduationCap,
  FileText,
  Video,
  Tag,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  UserCheck,
  ClipboardList,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { useSettings } from '@/contexts/SettingsContext'

type Course = {
  id: string
  title: string
  shortDescription?: string
  longDescription?: string
  status: string
  category?: { name: string }
  curriculum?: { name: string }
  courseFormat?: { name: string }
  courseType?: { name: string }
  oneToOnePrice?: number
  oneToOneOffer?: number
  oneToOneActive?: boolean
  groupPrice?: number
  groupOffer?: number
  groupActive?: boolean
  maxGroupSize?: number
  minGroupSize?: number
  sessionDuration?: number
  sessionsPerWeek?: number
  totalSessions?: number
  minAge?: number
  maxAge?: number
  prerequisiteLevel?: string
  primaryImage?: string
  secondaryImage?: string
  videoUrl?: string
  tags?: string[]
  difficulty?: string
  createdAt: string
  updatedAt: string
  courseTutors?: Array<{
    isPrimary: boolean
    tutor: {
      id: string
      name: string
      email: string
      avatar?: string
      qualifications?: string
      experience?: string
      specializations?: string[]
      hourlyRate?: number
    }
  }>
  enrollments?: Array<{
    id: string
    status: string
    enrollmentDate: string
    student: {
      id: string
      name: string
      email: string
      avatar?: string
    }
  }>
  _count?: {
    enrollments: number
    lessons: number
    assignments: number
    sessions: number
  }
}

export default function CourseDetailsPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const { getCurrencySymbol } = useSettings()
  const currencySymbol = getCurrencySymbol()
  const courseId = params.courseId
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (courseId) {
      loadCourse()
    }
  }, [courseId])

  const loadCourse = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load course')
      }
      setCourse(data.data)
    } catch (e: any) {
      console.error('Error fetching course:', e)
      toast.error(e.message || 'Failed to load course')
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

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toUpperCase()) {
      case "BEGINNER": return "bg-green-100 text-green-800 border-green-200"
      case "INTERMEDIATE": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "ADVANCED": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getEnrollmentStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "COMPLETED": return "bg-blue-100 text-blue-800"
      case "CANCELLED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
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
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-gray-500">Course not found</p>
          <Button onClick={() => router.push('/admin/courses')}>
            Back to Courses
          </Button>
        </div>
      </RoleLayoutWrapper>
    )
  }

  return (
    <RoleLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Details</h1>
              <p className="text-gray-600">View and manage course information</p>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => router.push(`/admin/courses/${courseId}/syllabus`)}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            View Syllabus
          </Button>
        </div>

        {/* Course Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{course.title}</h2>
                  <Badge className={getStatusColor(course.status)}>
                    {course.status}
                  </Badge>
                  {course.difficulty && (
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {course.difficulty}
                    </Badge>
                  )}
                </div>
                {course.shortDescription && (
                  <p className="text-gray-600 text-lg">{course.shortDescription}</p>
                )}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  {course.category && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.category.name}
                    </div>
                  )}
                  {course.courseFormat && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.courseFormat.name}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course._count?.enrollments || 0} students enrolled
                  </div>
                </div>
              </div>
              {course.primaryImage && (
                <div className="ml-6">
                  <img 
                    src={course.primaryImage} 
                    alt={course.title}
                    className="w-48 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Enrollments</p>
                  <p className="text-2xl font-bold">{course._count?.enrollments || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sessions</p>
                  <p className="text-2xl font-bold">{course._count?.sessions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lessons</p>
                  <p className="text-2xl font-bold">{course._count?.lessons || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <ClipboardList className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assignments</p>
                  <p className="text-2xl font-bold">{course._count?.assignments || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Format</TabsTrigger>
            <TabsTrigger value="tutors">Tutors</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="media">Media & Resources</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {course.longDescription && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{course.longDescription}</p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Course Details</h3>
                    <div className="space-y-2 text-sm">
                      {course.curriculum && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Curriculum:</span>
                          <span className="font-medium">{course.curriculum.name}</span>
                        </div>
                      )}
                      {course.courseType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Course Type:</span>
                          <span className="font-medium">{course.courseType.name}</span>
                        </div>
                      )}
                      {course.sessionDuration && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Session Duration:</span>
                          <span className="font-medium">{course.sessionDuration} minutes</span>
                        </div>
                      )}
                      {course.sessionsPerWeek && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sessions per Week:</span>
                          <span className="font-medium">{course.sessionsPerWeek}</span>
                        </div>
                      )}
                      {course.totalSessions && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Sessions:</span>
                          <span className="font-medium">{course.totalSessions}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Requirements</h3>
                    <div className="space-y-2 text-sm">
                      {(course.minAge || course.maxAge) && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Age Range:</span>
                          <span className="font-medium">
                            {course.minAge && course.maxAge 
                              ? `${course.minAge} - ${course.maxAge} years`
                              : course.minAge 
                                ? `${course.minAge}+ years`
                                : `Up to ${course.maxAge} years`
                            }
                          </span>
                        </div>
                      )}
                      {course.prerequisiteLevel && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Prerequisite Level:</span>
                          <span className="font-medium">{course.prerequisiteLevel}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {course.tags && course.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {course.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(course.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2 font-medium">
                      {new Date(course.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* One-to-One Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>One-to-One Sessions</span>
                    {course.oneToOneActive ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.oneToOnePrice ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {currencySymbol}{course.oneToOnePrice}
                        </span>
                        <span className="text-gray-600">per session</span>
                      </div>
                      {course.oneToOneOffer && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-green-800">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-medium">Special Offer</span>
                          </div>
                          <p className="text-2xl font-bold text-green-900 mt-1">
                            {currencySymbol}{course.oneToOneOffer}
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            Save {currencySymbol}{course.oneToOnePrice - course.oneToOneOffer}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">No pricing set</p>
                  )}
                </CardContent>
              </Card>

              {/* Group Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Group Sessions</span>
                    {course.groupActive ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.groupPrice ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {currencySymbol}{course.groupPrice}
                        </span>
                        <span className="text-gray-600">per session</span>
                      </div>
                      {(course.minGroupSize || course.maxGroupSize) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>
                            Group size: {course.minGroupSize || 1} - {course.maxGroupSize || 'unlimited'} students
                          </span>
                        </div>
                      )}
                      {course.groupOffer && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-green-800">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-medium">Special Offer</span>
                          </div>
                          <p className="text-2xl font-bold text-green-900 mt-1">
                            {currencySymbol}{course.groupOffer}
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            Save {currencySymbol}{course.groupPrice - course.groupOffer}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">No pricing set</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tutors Tab */}
          <TabsContent value="tutors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Assigned Tutors ({course.courseTutors?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.courseTutors && course.courseTutors.length > 0 ? (
                  <div className="space-y-4">
                    {course.courseTutors.map(({ tutor, isPrimary }) => (
                      <div key={tutor.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {tutor.avatar ? (
                            <img src={tutor.avatar} alt={tutor.name} className="w-full h-full object-cover" />
                          ) : (
                            <GraduationCap className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{tutor.name}</h3>
                            {isPrimary && (
                              <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{tutor.email}</p>
                          {tutor.qualifications && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Qualifications:</span> {tutor.qualifications}
                            </p>
                          )}
                          {tutor.specializations && tutor.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {tutor.specializations.map((spec, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {tutor.hourlyRate && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Hourly Rate:</span> {currencySymbol}{tutor.hourlyRate}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No tutors assigned to this course</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Enrolled Students ({course.enrollments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.enrollments && course.enrollments.length > 0 ? (
                  <div className="space-y-3">
                    {course.enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {enrollment.student.avatar ? (
                              <img 
                                src={enrollment.student.avatar} 
                                alt={enrollment.student.name} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <Users className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{enrollment.student.name}</h3>
                            <p className="text-sm text-gray-600">{enrollment.student.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right text-sm">
                            <p className="text-gray-600">
                              Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getEnrollmentStatusColor(enrollment.status)}>
                            {enrollment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No students enrolled yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Primary Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {course.primaryImage ? (
                    <img 
                      src={course.primaryImage} 
                      alt="Primary course image"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">No primary image</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Secondary Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Secondary Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {course.secondaryImage ? (
                    <img 
                      src={course.secondaryImage} 
                      alt="Secondary course image"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">No secondary image</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Video */}
            {course.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Course Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <a 
                      href={course.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <Video className="w-5 h-5" />
                      Open Video Link
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </RoleLayoutWrapper>
  )
}

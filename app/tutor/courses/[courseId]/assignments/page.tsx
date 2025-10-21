"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { SubmissionList } from '@/components/assignments/SubmissionList'
import { ArrowLeft, Plus, BookOpen, Users, Calendar, Star, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Assignment = {
  id: string
  title: string
  description?: string
  dueDate: string
  maxPoints: number
  instructions?: string
  isActive: boolean
  createdAt: string
  _count: {
    submissions: number
  }
}

type Submission = {
  id: string
  content?: string
  submissionType: string
  attachments?: any
  status: string
  score?: number
  feedback?: string
  isGraded: boolean
  submittedAt: string
  gradedAt?: string
  student: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  assignment: {
    id: string
    title: string
    maxPoints: number
  }
}

export default function TutorAssignmentsPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const courseId = params.courseId
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (courseId && session?.user?.id) {
      loadAssignments()
    }
  }, [courseId, session])

  const loadAssignments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tutor/courses/${courseId}/assignments`)
      const data = await response.json()
      
      if (data.success) {
        setAssignments(data.data)
      } else {
        toast.error('Failed to load assignments')
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
      toast.error('Failed to load assignments')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAssignmentSubmissions = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submissions`)
      const data = await response.json()
      
      if (data.success) {
        setSubmissions(data.data)
      } else {
        toast.error('Failed to load submissions')
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
      toast.error('Failed to load submissions')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'ARCHIVED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date() > new Date(dueDate)
  }

  if (isLoading) {
    return (
      <RoleLayoutWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading assignments...</span>
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
            <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
            <p className="text-gray-600">Manage assignments and grade submissions</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Assignment
          </Button>
        </div>

        {!selectedAssignment ? (
          /* Assignments List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <Badge className={getStatusColor(assignment.isActive ? 'ACTIVE' : 'DRAFT')}>
                      {assignment.isActive ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      {isOverdue(assignment.dueDate) && (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4" />
                      <span>{assignment.maxPoints} points</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{assignment._count.submissions} submissions</span>
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          loadAssignmentSubmissions(assignment.id)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Submissions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Submissions View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedAssignment(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Assignments
              </Button>
              <div className="text-sm text-gray-600">
                {submissions.length} submissions
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{selectedAssignment.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</span>
                  <span>Points: {selectedAssignment.maxPoints}</span>
                  <span>Submissions: {submissions.length}</span>
                </div>
              </CardHeader>
            </Card>

            <SubmissionList
              submissions={submissions}
              onGrade={handleGradeSubmission}
            />
          </div>
        )}
      </div>
    </RoleLayoutWrapper>
  )
}

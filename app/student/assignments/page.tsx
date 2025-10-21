"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AssignmentSubmissionForm } from '@/components/assignments/AssignmentSubmissionForm'
import { 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface Assignment {
  id: string
  title: string
  description?: string
  instructions?: string
  dueDate: string
  maxPoints: number
  assignmentType: string
  attachments: string[]
  expectedSubmissionTypes?: string[]
  submissions: Array<{
    id: string
    status: string
    score?: number
    feedback?: string
    submittedAt?: string
    gradedAt?: string
    submissionType?: string
  }>
}

export default function StudentAssignmentsPage() {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalAssignments, setTotalAssignments] = useState(0)
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    fetchAssignments()
  }, [currentPage, searchTerm, statusFilter])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setCurrentPage(1) // Reset to first page when searching
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/student/assignments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.data.assignments || [])
        setTotalPages(data.data.pagination?.pages || 1)
        setTotalAssignments(data.data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentStatus = (assignment: Assignment) => {
    if (!assignment.submissions || assignment.submissions.length === 0) return 'pending'
    const hasGraded = assignment.submissions.some(s => s.status === 'GRADED')
    if (hasGraded) return 'graded'
    const hasCompleted = assignment.submissions.some(s => s.status === 'COMPLETED')
    if (hasCompleted) return 'completed'
    const hasProgress = assignment.submissions.some(s => s.status === 'PROGRESS')
    if (hasProgress) return 'progress'
    return 'pending'
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Not Started', color: 'bg-gray-100 text-gray-800', icon: Clock }
      case 'progress':
        return { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: AlertCircle }
      case 'completed':
        return { label: 'Submitted', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'graded':
        return { label: 'Graded', color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Clock }
    }
  }

  const isOverdue = (dueDate: string) => {
    return isAfter(new Date(), new Date(dueDate))
  }

  const isDueSoon = (dueDate: string) => {
    const threeDaysFromNow = addDays(new Date(), 3)
    return isBefore(new Date(dueDate), threeDaysFromNow) && !isOverdue(dueDate)
  }

  // Remove client-side filtering since we're using server-side filtering

  const getUpcomingAssignments = () => {
    return assignments.filter(assignment => {
      const status = getAssignmentStatus(assignment)
      return status === 'pending' || status === 'progress'
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }

  const getOverdueAssignments = () => {
    return assignments.filter(assignment => {
      const status = getAssignmentStatus(assignment)
      return isOverdue(assignment.dueDate) && (status === 'pending' || status === 'progress')
    })
  }

  const getCompletedAssignments = () => {
    return assignments.filter(assignment => {
      const status = getAssignmentStatus(assignment)
      return status === 'completed' || status === 'graded'
    })
  }

  const handleStartAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setShowSubmissionModal(true)
  }

  const handleSubmissionSuccess = () => {
    setShowSubmissionModal(false)
    setSelectedAssignment(null)
    fetchAssignments()
  }

  if (loading) {
    return (
      <RoleLayoutWrapper allowedRoles={['STUDENT']}>
        <div className="container mx-auto p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </RoleLayoutWrapper>
    )
  }

  return (
    <RoleLayoutWrapper allowedRoles={['STUDENT']}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Assignments</h1>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search assignments..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value)
            setCurrentPage(1) // Reset to first page when filtering
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignments</SelectItem>
              <SelectItem value="pending">Not Started</SelectItem>
              <SelectItem value="progress">In Progress</SelectItem>
              <SelectItem value="completed">Submitted</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold">{getUpcomingAssignments().length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold">{getOverdueAssignments().length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{getCompletedAssignments().length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{assignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments found</h3>
                <p className="text-gray-600">
                  {searchInput || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'You don\'t have any assignments yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => {
              const status = getAssignmentStatus(assignment)
              const statusInfo = getStatusInfo(status)
              const submission = assignment.submissions[0]
              const StatusIcon = statusInfo.icon

              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{assignment.title}</h3>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          {isOverdue(assignment.dueDate) && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                          {isDueSoon(assignment.dueDate) && !isOverdue(assignment.dueDate) && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              Due Soon
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {assignment.maxPoints} points
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="capitalize">{assignment.assignmentType.toLowerCase()}</span>
                          </div>
                        </div>

                        {assignment.description && (
                          <div 
                            className="text-sm text-gray-700 mb-3 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: assignment.description }}
                          />
                        )}

                        {submission?.score !== undefined && (
                          <div className="text-sm">
                            <span className="font-medium">Score: </span>
                            <span className={cn(
                              "font-semibold",
                              submission.score >= (assignment.maxPoints * 0.8) ? "text-green-600" :
                              submission.score >= (assignment.maxPoints * 0.6) ? "text-yellow-600" : "text-red-600"
                            )}>
                              {submission.score}/{assignment.maxPoints}
                            </span>
                          </div>
                        )}

                        {submission?.feedback && (
                          <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                            <span className="font-medium">Feedback: </span>
                            <span>{submission.feedback}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        {status === 'pending' || status === 'progress' ? (
                          <Button onClick={() => handleStartAssignment(assignment)}>
                            {status === 'pending' ? 'Start Assignment' : 'Continue'}
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => handleStartAssignment(assignment)}>
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalAssignments)} of {totalAssignments} assignments
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  const isActive = pageNum === currentPage
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Submission Modal */}
        <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAssignment?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedAssignment && (
              <AssignmentSubmissionForm
                assignment={selectedAssignment}
                onSuccess={handleSubmissionSuccess}
                onCancel={() => setShowSubmissionModal(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleLayoutWrapper>
  )
}



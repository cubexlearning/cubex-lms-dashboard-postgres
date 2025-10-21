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
import { AssignmentForm } from '@/components/assignments/AssignmentForm'
import { AssignmentGradingInterface } from '@/components/assignments/AssignmentGradingInterface'
import { 
  Search, 
  Plus,
  Filter,
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Assignment {
  id: string
  title: string
  description?: string
  dueDate: string
  maxPoints: number
  assignmentType: string
  targetType: string
  isActive: boolean
  createdAt: string
  submissions: Array<{
    id: string
    status: string
    score?: number
    submittedAt?: string
    gradedAt?: string
    student: {
      id: string
      name: string
      email: string
    }
  }>
  _count: {
    submissions: number
  }
}

export default function TutorAssignmentsPage() {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
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

      const response = await fetch(`/api/assignments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.data.assignments || [])
        setTotalPages(data.data.pagination.pages || 1)
        setTotalAssignments(data.data.pagination.total || 0)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentStats = (assignment: Assignment) => {
    const total = assignment._count.submissions
    const submitted = assignment.submissions.filter(s => s.status === 'COMPLETED').length
    const graded = assignment.submissions.filter(s => s.status === 'GRADED').length
    const pending = assignment.submissions.filter(s => s.status === 'PENDING' || s.status === 'PROGRESS').length

    return { total, submitted, graded, pending }
  }

  const isOverdue = (dueDate: string) => {
    return isAfter(new Date(), new Date(dueDate))
  }

  const isDueSoon = (dueDate: string) => {
    const threeDaysFromNow = addDays(new Date(), 3)
    return isBefore(new Date(dueDate), threeDaysFromNow) && !isOverdue(dueDate)
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && assignment.isActive) ||
      (statusFilter === 'inactive' && !assignment.isActive)
    return matchesSearch && matchesStatus
  })

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchAssignments()
    toast.success('Assignment created successfully!')
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This will hide it from students and cannot be undone.')) {
      return
    }

    setLoadingStates(prev => ({ ...prev, [`delete-${assignmentId}`]: true }))

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Assignment deleted successfully')
        fetchAssignments()
      } else {
        toast.error('Failed to delete assignment')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error('Failed to delete assignment')
    } finally {
      setLoadingStates(prev => ({ ...prev, [`delete-${assignmentId}`]: false }))
    }
  }

  const handleToggleActive = async (assignmentId: string, isActive: boolean) => {
    setLoadingStates(prev => ({ ...prev, [assignmentId]: true }))
    
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        toast.success(`Assignment ${!isActive ? 'activated' : 'deactivated'} successfully`)
        fetchAssignments()
      } else {
        toast.error('Failed to update assignment')
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      toast.error('Failed to update assignment')
    } finally {
      setLoadingStates(prev => ({ ...prev, [assignmentId]: false }))
    }
  }

  if (loading) {
    return (
      <RoleLayoutWrapper allowedRoles={['TUTOR', 'ADMIN']}>
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
    <RoleLayoutWrapper allowedRoles={['TUTOR', 'ADMIN']}>
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Assignments</h1>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Assignments</p>
                  <p className="text-2xl font-bold">{assignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">{assignments.filter(a => a.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold">
                    {assignments.reduce((sum, a) => {
                      const stats = getAssignmentStats(a)
                      return sum + stats.submitted + stats.graded
                    }, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending Grading</p>
                  <p className="text-2xl font-bold">
                    {assignments.reduce((sum, a) => {
                      const stats = getAssignmentStats(a)
                      return sum + stats.submitted
                    }, 0)}
                  </p>
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
                    : 'Create your first assignment to get started.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => {
              const stats = getAssignmentStats(assignment)
              const submissionRate = stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0

              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{assignment.title}</h3>
                          <Badge variant={assignment.isActive ? "default" : "secondary"}>
                            {assignment.isActive ? 'Active' : 'Inactive'}
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
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {stats.total} students
                          </div>
                        </div>

                        {assignment.description && (
                          <div 
                            className="text-sm text-gray-700 mb-3 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: assignment.description }}
                          />
                        )}

                        {/* Progress Stats */}
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-semibold text-blue-600">{stats.submitted}</div>
                            <div className="text-blue-600">Submitted</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-semibold text-green-600">{stats.graded}</div>
                            <div className="text-green-600">Graded</div>
                          </div>
                          <div className="text-center p-2 bg-orange-50 rounded">
                            <div className="font-semibold text-orange-600">{stats.pending}</div>
                            <div className="text-orange-600">Pending</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-semibold text-gray-600">{submissionRate.toFixed(0)}%</div>
                            <div className="text-gray-600">Rate</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment)
                            setShowGradingModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(assignment.id, assignment.isActive)}
                          disabled={loadingStates[assignment.id]}
                        >
                          {loadingStates[assignment.id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                              {assignment.isActive ? 'Deactivating...' : 'Activating...'}
                            </>
                          ) : (
                            assignment.isActive ? 'Deactivate' : 'Activate'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          disabled={loadingStates[`delete-${assignment.id}`]}
                          className="text-red-600 hover:text-red-700"
                        >
                          {loadingStates[`delete-${assignment.id}`] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                              Deleting...
                            </>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
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

        {/* Create Assignment Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <AssignmentForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateModal(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Grading Modal */}
        <Dialog open={showGradingModal} onOpenChange={setShowGradingModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedAssignment?.title} - Submissions
              </DialogTitle>
            </DialogHeader>
            {selectedAssignment && (
              <AssignmentGradingInterface
                assignment={selectedAssignment}
                onClose={() => setShowGradingModal(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleLayoutWrapper>
  )
}

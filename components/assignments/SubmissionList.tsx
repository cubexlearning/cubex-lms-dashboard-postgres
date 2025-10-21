"use client"
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SubmissionCard } from './SubmissionCard'
import { SubmissionViewer } from './SubmissionViewer'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Search, Filter, Grid, List, Star, Clock, CheckCircle } from 'lucide-react'

interface SubmissionListProps {
  submissions: Array<{
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
  }>
  onGrade?: (submissionId: string) => void
  viewMode?: 'card' | 'list'
}

export function SubmissionList({ submissions, onGrade, viewMode = 'card' }: SubmissionListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [currentViewMode, setCurrentViewMode] = useState<'card' | 'list'>(viewMode)

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter
    const matchesType = typeFilter === 'all' || submission.submissionType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Get unique statuses and types for filters
  const statuses = [...new Set(submissions.map(s => s.status))]
  const types = [...new Set(submissions.map(s => s.submissionType))]

  // Get statistics
  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s.isGraded).length,
    pending: submissions.filter(s => !s.isGraded).length,
    late: submissions.filter(s => s.status === 'LATE').length
  }

  const selectedSubmissionData = selectedSubmission 
    ? submissions.find(s => s.id === selectedSubmission)
    : null

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assignment Submissions</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={currentViewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentViewMode('card')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={currentViewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
              <div className="text-sm text-gray-600">Graded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.late}</div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by student name, email, or assignment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Filter className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No submissions have been made yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={
          currentViewMode === 'card' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onView={(id) => setSelectedSubmission(id)}
              onGrade={onGrade}
            />
          ))}
        </div>
      )}

      {/* Submission Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmissionData && (
            <SubmissionViewer submission={selectedSubmissionData} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

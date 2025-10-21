"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  Star,
  MessageSquare,
  User,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AssignmentGradingInterfaceProps {
  assignment: {
    id: string
    title: string
    maxPoints: number
    dueDate: string
    submissions: Array<{
      id: string
      status: string
      score?: number
      feedback?: string
      submittedAt?: string
      gradedAt?: string
      content?: string
      submissionType?: string
      student: {
        id: string
        name: string
        email: string
      }
    }>
  }
  onClose: () => void
}

export function AssignmentGradingInterface({ assignment, onClose }: AssignmentGradingInterfaceProps) {
  const [submissions, setSubmissions] = useState(assignment.submissions)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [gradingData, setGradingData] = useState({
    score: 0,
    feedback: ''
  })

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Not Started', color: 'bg-gray-100 text-gray-800', icon: Clock }
      case 'PROGRESS':
        return { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: AlertCircle }
      case 'COMPLETED':
        return { label: 'Submitted', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'GRADED':
        return { label: 'Graded', color: 'bg-purple-100 text-purple-800', icon: Star }
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: Clock }
    }
  }

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStats = () => {
    const total = submissions.length
    const submitted = submissions.filter(s => s.status === 'COMPLETED').length
    const graded = submissions.filter(s => s.status === 'GRADED').length
    const pending = total - submitted
    const averageScore = graded > 0 ? submissions.filter(s => s.status === 'GRADED').reduce((sum, s) => sum + (s.score || 0), 0) / graded : 0

    return { total, submitted, graded, pending, averageScore }
  }

  const handleGradeSubmission = async (submissionId: string) => {
    if (gradingData.score < 0 || gradingData.score > assignment.maxPoints) {
      toast.error(`Score must be between 0 and ${assignment.maxPoints}`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gradingData)
      })

      if (response.ok) {
        toast.success('Submission graded successfully!')
        setSelectedSubmission(null)
        setGradingData({ score: 0, feedback: '' })
        
        // Update local state
        setSubmissions(prev => prev.map(s => 
          s.id === submissionId 
            ? { ...s, status: 'GRADED', score: gradingData.score, feedback: gradingData.feedback, gradedAt: new Date().toISOString() }
            : s
        ))
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to grade submission')
      }
    } catch (error) {
      console.error('Error grading submission:', error)
      toast.error('Failed to grade submission')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSubmission = (submission: any) => {
    setSelectedSubmission(submission)
    setGradingData({
      score: submission.score || 0,
      feedback: submission.feedback || ''
    })
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold">{stats.submitted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Graded</p>
                <p className="text-2xl font-bold">{stats.graded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Submissions</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="PENDING">Not Started</SelectItem>
                      <SelectItem value="PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Submitted</SelectItem>
                      <SelectItem value="GRADED">Graded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredSubmissions.map((submission) => {
                  const statusInfo = getStatusInfo(submission.status)
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={submission.id}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-colors",
                        selectedSubmission?.id === submission.id 
                          ? "border-blue-500 bg-blue-50" 
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleSelectSubmission(submission)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{submission.student.name}</span>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{submission.student.email}</p>
                          {submission.submittedAt && (
                            <p className="text-xs text-gray-500">
                              Submitted: {format(new Date(submission.submittedAt), 'MMM dd, yyyy')}
                            </p>
                          )}
                          {submission.status === 'GRADED' && submission.score !== undefined && (
                            <p className="text-sm font-medium text-green-600">
                              Score: {submission.score}/{assignment.maxPoints}
                            </p>
                          )}
                        </div>
                        {submission.status === 'COMPLETED' && (
                          <Button size="sm" variant="outline">
                            Grade
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grading Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Grade Submission</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSubmission ? (
                <div className="space-y-4">
                  {/* Student Info */}
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-medium">{selectedSubmission.student.name}</h4>
                    <p className="text-sm text-gray-600">{selectedSubmission.student.email}</p>
                    {selectedSubmission.submittedAt && (
                      <p className="text-xs text-gray-500">
                        Submitted: {format(new Date(selectedSubmission.submittedAt), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>

                  {/* Submission Content */}
                  {selectedSubmission.content && (
                    <div>
                      <Label>Submission</Label>
                      <div className="mt-1 p-3 border rounded bg-gray-50 max-h-32 overflow-y-auto">
                        {selectedSubmission.submissionType === 'TEXT' ? (
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: selectedSubmission.content }}
                          />
                        ) : (
                          <a 
                            href={selectedSubmission.content} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {selectedSubmission.content}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Grading Form */}
                  {selectedSubmission.status === 'COMPLETED' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="score">Score</Label>
                        <Input
                          id="score"
                          type="number"
                          min="0"
                          max={assignment.maxPoints}
                          value={gradingData.score}
                          onChange={(e) => setGradingData(prev => ({ ...prev, score: Number(e.target.value) }))}
                        />
                        <p className="text-xs text-gray-500">Max: {assignment.maxPoints} points</p>
                      </div>

                      <div>
                        <Label htmlFor="feedback">Feedback</Label>
                        <Textarea
                          id="feedback"
                          value={gradingData.feedback}
                          onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                          placeholder="Provide feedback to the student..."
                          rows={4}
                        />
                      </div>

                      <Button 
                        onClick={() => handleGradeSubmission(selectedSubmission.id)}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Grading...' : 'Grade Submission'}
                      </Button>
                    </div>
                  )}

                  {/* Already Graded */}
                  {selectedSubmission.status === 'GRADED' && (
                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 rounded">
                        <p className="font-medium text-green-800">Already Graded</p>
                        <p className="text-green-600">
                          Score: {selectedSubmission.score}/{assignment.maxPoints}
                        </p>
                        {selectedSubmission.feedback && (
                          <p className="text-sm text-green-700 mt-1">
                            Feedback: {selectedSubmission.feedback}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Select a submission to grade</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}

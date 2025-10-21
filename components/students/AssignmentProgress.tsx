"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { BookOpen, CheckCircle, Clock, AlertCircle, Star, Eye } from 'lucide-react'

interface AssignmentProgressProps {
  assignments: Array<{
    id: string
    status: string
    submittedAt: string
    grade?: number
    feedback?: string
    assignment: {
      title: string
      dueDate: string
      maxPoints: number
    }
  }>
  onViewSubmission?: (submissionId: string) => void
  onGradeSubmission?: (submissionId: string) => void
}

export function AssignmentProgress({ 
  assignments, 
  onViewSubmission, 
  onGradeSubmission 
}: AssignmentProgressProps) {
  const totalAssignments = assignments.length
  const submittedCount = assignments.filter(a => a.status === 'SUBMITTED' || a.status === 'LATE').length
  const gradedCount = assignments.filter(a => a.grade !== null && a.grade !== undefined).length
  const completionRate = totalAssignments > 0 ? Math.round((submittedCount / totalAssignments) * 100) : 0
  const averageGrade = gradedCount > 0 
    ? Math.round(assignments.reduce((sum, a) => sum + (a.grade || 0), 0) / gradedCount)
    : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'LATE': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'DRAFT': return <AlertCircle className="w-4 h-4 text-gray-600" />
      default: return <AlertCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-green-100 text-green-800'
      case 'LATE': return 'bg-yellow-100 text-yellow-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-red-100 text-red-800'
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date() > new Date(dueDate)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Assignment Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
            <div className="text-sm text-blue-700">Completion Rate</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{averageGrade}</div>
            <div className="text-sm text-purple-700">Average Grade</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Assignment Completion</span>
            <span className="text-sm text-gray-600">{submittedCount}/{totalAssignments}</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Assignment List */}
        <div>
          <h4 className="font-medium mb-3">Recent Assignments</h4>
          <div className="space-y-3">
            {assignments.slice(0, 5).map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(assignment.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{assignment.assignment.title}</div>
                    <div className="text-xs text-gray-500">
                      Due: {new Date(assignment.assignment.dueDate).toLocaleDateString()}
                      {isOverdue(assignment.assignment.dueDate) && assignment.status !== 'SUBMITTED' && (
                        <span className="text-red-600 ml-2">(Overdue)</span>
                      )}
                    </div>
                    {assignment.grade !== null && assignment.grade !== undefined && (
                      <div className="text-xs text-gray-600 mt-1">
                        Grade: {assignment.grade}/{assignment.assignment.maxPoints}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(assignment.status)}>
                    {assignment.status}
                  </Badge>
                  <div className="flex gap-1">
                    {onViewSubmission && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewSubmission(assignment.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {onGradeSubmission && assignment.status === 'SUBMITTED' && !assignment.grade && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGradeSubmission(assignment.id)}
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="p-2 bg-green-50 rounded">
            <div className="font-medium text-green-600">{submittedCount}</div>
            <div className="text-green-700">Submitted</div>
          </div>
          <div className="p-2 bg-yellow-50 rounded">
            <div className="font-medium text-yellow-600">{gradedCount}</div>
            <div className="text-yellow-700">Graded</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="font-medium text-gray-600">{totalAssignments - submittedCount}</div>
            <div className="text-gray-700">Pending</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

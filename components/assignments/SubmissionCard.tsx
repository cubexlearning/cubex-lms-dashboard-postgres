"use client"
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Github, 
  Link, 
  Camera, 
  Video, 
  File, 
  ExternalLink, 
  Star,
  Calendar,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SubmissionCardProps {
  submission: {
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
  onView?: (submissionId: string) => void
  onGrade?: (submissionId: string) => void
}

export function SubmissionCard({ submission, onView, onGrade }: SubmissionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-green-100 text-green-800'
      case 'LATE': return 'bg-orange-100 text-orange-800'
      case 'GRADED': return 'bg-blue-100 text-blue-800'
      case 'RETURNED': return 'bg-red-100 text-red-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSubmissionIcon = (type: string) => {
    switch (type) {
      case 'TEXT': return File
      case 'GITHUB_URL': return Github
      case 'LIVE_URL': return Link
      case 'SCREENSHOTS': return Camera
      case 'SCREENRECORDINGS': return Video
      case 'FILE_UPLOAD': return File
      case 'MULTIPLE_TYPES': return File
      default: return File
    }
  }

  const getSubmissionPreview = () => {
    if (!submission.attachments) {
      return submission.content ? submission.content.substring(0, 100) + '...' : 'No content'
    }

    const attachments = submission.attachments

    switch (submission.submissionType) {
      case 'TEXT':
        return attachments.data?.content || submission.content || 'Text submission'
      
      case 'GITHUB_URL':
        return attachments.data?.repositoryUrl || 'GitHub repository'
      
      case 'LIVE_URL':
        return attachments.data?.url || 'Live demo'
      
      case 'SCREENSHOTS':
        return `${attachments.data?.images?.length || 0} screenshot(s)`
      
      case 'SCREENRECORDINGS':
        return `${attachments.data?.videos?.length || 0} recording(s)`
      
      case 'FILE_UPLOAD':
        return `${attachments.data?.files?.length || 0} file(s)`
      
      case 'MULTIPLE_TYPES':
        const parts = []
        if (attachments.data?.githubUrl) parts.push('GitHub')
        if (attachments.data?.liveUrl) parts.push('Live Demo')
        if (attachments.data?.screenshots?.length) parts.push(`${attachments.data.screenshots.length} Screenshot(s)`)
        if (attachments.data?.files?.length) parts.push(`${attachments.data.files.length} File(s)`)
        return parts.join(', ') || 'Multiple types'
      
      default:
        return 'Unknown submission type'
    }
  }

  const Icon = getSubmissionIcon(submission.submissionType)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={submission.student.avatar} />
              <AvatarFallback>
                {submission.student.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-sm">{submission.student.name}</h4>
              <p className="text-xs text-gray-600">{submission.student.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-600" />
            <Badge className={`text-xs ${getStatusColor(submission.status)}`}>
              {submission.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Submission Preview */}
        <div>
          <p className="text-sm text-gray-700 line-clamp-2">
            {getSubmissionPreview()}
          </p>
        </div>

        {/* Grading Info */}
        {submission.isGraded && (
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">
                {submission.score}/{submission.assignment.maxPoints}
              </span>
            </div>
            {submission.feedback && (
              <span className="text-xs text-gray-600">Has feedback</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(submission.submittedAt))} ago</span>
          </div>
          
          <div className="flex items-center gap-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(submission.id)}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            )}
            {onGrade && !submission.isGraded && (
              <Button
                size="sm"
                onClick={() => onGrade(submission.id)}
              >
                <Star className="w-3 h-3 mr-1" />
                Grade
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Download,
  Calendar,
  User,
  Star,
  MessageSquare
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SubmissionViewerProps {
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
}

export function SubmissionViewer({ submission }: SubmissionViewerProps) {
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

  const renderSubmissionContent = () => {
    if (!submission.attachments) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No submission content available</p>
        </div>
      )
    }

    const attachments = submission.attachments

    switch (submission.submissionType) {
      case 'TEXT':
        return (
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{attachments.data?.content || submission.content}</p>
          </div>
        )

      case 'GITHUB_URL':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Repository</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-mono text-sm text-blue-600 break-all">
                {attachments.data?.repositoryUrl}
              </p>
              {attachments.data?.branch && (
                <p className="text-sm text-gray-600 mt-1">
                  Branch: {attachments.data.branch}
                </p>
              )}
              {attachments.data?.commitHash && (
                <p className="text-sm text-gray-600 font-mono">
                  Commit: {attachments.data.commitHash}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(attachments.data?.repositoryUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              View Repository
            </Button>
          </div>
        )

      case 'LIVE_URL':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Live Demo</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-mono text-sm text-blue-600 break-all">
                {attachments.data?.url}
              </p>
              {attachments.data?.technologies && attachments.data.technologies.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Technologies:</p>
                  <div className="flex flex-wrap gap-1">
                    {attachments.data.technologies.map((tech: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(attachments.data?.url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Visit Demo
            </Button>
          </div>
        )

      case 'SCREENSHOTS':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Screenshots ({attachments.data?.images?.length || 0})</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {attachments.data?.images?.map((image: any, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => window.open(image.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'SCREENRECORDINGS':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Screen Recordings ({attachments.data?.videos?.length || 0})</span>
            </div>
            <div className="space-y-4">
              {attachments.data?.videos?.map((video: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Recording {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {(video.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(video.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                  <video
                    src={video.url}
                    controls
                    className="w-full max-h-64 rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        )

      case 'FILE_UPLOAD':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <File className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Files ({attachments.data?.files?.length || 0})</span>
            </div>
            <div className="space-y-2">
              {attachments.data?.files?.map((file: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )

      case 'MULTIPLE_TYPES':
        return (
          <div className="space-y-6">
            {attachments.data?.githubUrl && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub Repository
                </h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-mono text-sm text-blue-600 break-all">
                    {attachments.data.githubUrl}
                  </p>
                </div>
              </div>
            )}

            {attachments.data?.liveUrl && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Live Demo
                </h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-mono text-sm text-blue-600 break-all">
                    {attachments.data.liveUrl}
                  </p>
                </div>
              </div>
            )}

            {attachments.data?.screenshots && attachments.data.screenshots.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Screenshots ({attachments.data.screenshots.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attachments.data.screenshots.map((image: any, index: number) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}

            {attachments.data?.files && attachments.data.files.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <File className="w-4 h-4" />
                  Files ({attachments.data.files.length})
                </h4>
                <div className="space-y-2">
                  {attachments.data.files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{file.name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Unknown submission type</p>
          </div>
        )
    }
  }

  const Icon = getSubmissionIcon(submission.submissionType)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={submission.student.avatar} />
              <AvatarFallback>
                {submission.student.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{submission.student.name}</h3>
                <Badge className={getStatusColor(submission.status)}>
                  {submission.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{submission.student.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600 capitalize">
              {submission.submissionType.toLowerCase().replace('_', ' ')}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Submission Content */}
        {renderSubmissionContent()}

        {/* Description */}
        {submission.attachments?.data?.description && (
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
              {submission.attachments.data.description}
            </p>
          </div>
        )}

        {/* Grading Information */}
        {submission.isGraded && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Grading</h4>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">
                  {submission.score}/{submission.assignment.maxPoints}
                </span>
              </div>
            </div>
            {submission.feedback && (
              <div className="mt-2">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-600 mt-1" />
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                    {submission.feedback}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submission Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Submitted {formatDistanceToNow(new Date(submission.submittedAt))} ago</span>
            </div>
            {submission.gradedAt && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>Graded {formatDistanceToNow(new Date(submission.gradedAt))} ago</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

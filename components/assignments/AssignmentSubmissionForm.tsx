"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RichEditor } from '@/components/ui/rich-editor'
import { 
  Github, 
  Link, 
  FileText, 
  Upload,
  ExternalLink,
  Calendar,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface AssignmentSubmissionFormProps {
  assignment: {
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
      content?: string
      submissionType?: string
      score?: number
      feedback?: string
    }>
  }
  onSuccess: () => void
  onCancel: () => void
}

const submissionTypes = [
  {
    type: 'TEXT',
    label: 'Text Submission',
    description: 'Submit your work as text content',
    icon: FileText,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    type: 'GITHUB_URL',
    label: 'GitHub Repository',
    description: 'Submit a link to your GitHub repository',
    icon: Github,
    color: 'bg-gray-100 text-gray-800'
  },
  {
    type: 'LIVE_URL',
    label: 'Live Demo',
    description: 'Submit a link to your live application',
    icon: Link,
    color: 'bg-green-100 text-green-800'
  },
  {
    type: 'GOOGLE_DRIVE_URL',
    label: 'Google Drive',
    description: 'Submit a link to your Google Drive file/folder',
    icon: Upload,
    color: 'bg-yellow-100 text-yellow-800'
  }
]

export function AssignmentSubmissionForm({ assignment, onSuccess, onCancel }: AssignmentSubmissionFormProps) {
  const [loading, setLoading] = useState(false)
  const [submissionType, setSubmissionType] = useState('TEXT')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')

  const isOverdue = new Date() > new Date(assignment.dueDate)
  const isSubmitted = assignment.submissions?.some(s => s.status === 'COMPLETED' || s.status === 'GRADED')

  const validateSubmission = () => {
    if (submissionType === 'TEXT' && !content.trim()) {
      toast.error('Please provide your submission content')
      return false
    }
    
    if (submissionType !== 'TEXT' && !url.trim()) {
      toast.error('Please provide a valid URL')
      return false
    }

    // URL validation for non-text submissions
    if (submissionType !== 'TEXT' && url.trim()) {
      const urlPattern = /^https?:\/\/.+\..+/
      if (!urlPattern.test(url.trim())) {
        toast.error('Please provide a valid URL starting with http:// or https://')
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateSubmission()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: submissionType === 'TEXT' ? content : url,
          submissionType
        })
      })

      if (response.ok) {
        toast.success('Assignment submitted successfully!')
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit assignment')
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      toast.error('Failed to submit assignment')
    } finally {
      setLoading(false)
    }
  }

  const renderSubmissionInput = () => {
    switch (submissionType) {
      case 'TEXT':
        return (
          <div>
            <Label htmlFor="content">Your Submission</Label>
            <RichEditor
              content={content}
              onChange={setContent}
              placeholder="Write your submission here..."
              height="300px"
            />
          </div>
        )
      
      case 'GITHUB_URL':
        return (
          <div>
            <Label htmlFor="url">GitHub Repository URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
            />
            <p className="text-sm text-gray-600 mt-1">
              Make sure your repository is public or you've granted access to your instructor.
            </p>
            {url && !url.includes('github.com') && (
              <p className="text-sm text-red-600 mt-1">
                Please provide a valid GitHub repository URL
              </p>
            )}
          </div>
        )
      
      case 'LIVE_URL':
        return (
          <div>
            <Label htmlFor="url">Live Demo URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-demo-site.com"
            />
            <p className="text-sm text-gray-600 mt-1">
              Ensure your demo is accessible and working properly.
            </p>
          </div>
        )
      
      case 'GOOGLE_DRIVE_URL':
        return (
          <div>
            <Label htmlFor="url">Google Drive Link</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
            />
            <p className="text-sm text-gray-600 mt-1">
              Make sure the file/folder is set to "Anyone with the link can view".
            </p>
            {url && !url.includes('drive.google.com') && (
              <p className="text-sm text-red-600 mt-1">
                Please provide a valid Google Drive URL
              </p>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{assignment.title}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {assignment.maxPoints} points
                </div>
                <Badge variant="outline" className="capitalize">
                  {assignment.assignmentType.toLowerCase()}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignment.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: assignment.description }}
              />
            </div>
          )}

          {assignment.instructions && (
            <div>
              <h4 className="font-medium mb-2">Instructions</h4>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: assignment.instructions }}
              />
            </div>
          )}

          {assignment.attachments.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Resources</h4>
              <div className="space-y-2">
                {assignment.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                    <a 
                      href={attachment} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {attachment}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assignment.submissions?.some(s => s.status === 'GRADED' && s.score !== undefined) && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-1">Your Score</h4>
              <p className="text-2xl font-bold text-green-600">
                {assignment.submissions.find(s => s.status === 'GRADED')?.score}/{assignment.maxPoints}
              </p>
            </div>
          )}

          {assignment.submissions?.some(s => s.feedback) && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Feedback</h4>
              <p className="text-blue-700">{assignment.submissions.find(s => s.feedback)?.feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Form */}
      {!isSubmitted && (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(assignment.expectedSubmissionTypes?.length ? submissionTypes.filter(t => assignment.expectedSubmissionTypes?.includes(t.type)) : submissionTypes).map((type) => {
              const Icon = type.icon
              const isActive = submissionType === type.type
              return (
                <div key={type.type} className="border rounded-md p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div className="font-medium">{type.label}</div>
                    <Badge variant="outline" className="ml-2">{type.type.replace('_',' ')}</Badge>
                  </div>
                  {/* Switch context to this type when interacting */}
                  <div onFocus={() => setSubmissionType(type.type)} onClick={() => setSubmissionType(type.type)}>
                    {(() => {
                      switch (type.type) {
                        case 'TEXT':
                          return (
                            <div>
                              <Label>Your Submission</Label>
                              <RichEditor
                                content={isActive ? content : ''}
                                onChange={(val) => { setSubmissionType('TEXT'); setContent(val) }}
                                placeholder="Write your submission here..."
                                height="220px"
                              />
                            </div>
                          )
                        case 'GITHUB_URL':
                          return (
                            <div>
                              <Label>GitHub Repository URL</Label>
                              <Input
                                type="url"
                                value={isActive && submissionType==='GITHUB_URL' ? url : ''}
                                onChange={(e) => { setSubmissionType('GITHUB_URL'); setUrl(e.target.value) }}
                                placeholder="https://github.com/username/repository"
                              />
                              <p className="text-sm text-gray-600 mt-1">Make sure your repository is public or you've granted access to your instructor.</p>
                            </div>
                          )
                        case 'LIVE_URL':
                          return (
                            <div>
                              <Label>Live Demo URL</Label>
                              <Input
                                type="url"
                                value={isActive && submissionType==='LIVE_URL' ? url : ''}
                                onChange={(e) => { setSubmissionType('LIVE_URL'); setUrl(e.target.value) }}
                                placeholder="https://your-demo-site.com"
                              />
                            </div>
                          )
                        case 'GOOGLE_DRIVE_URL':
                          return (
                            <div>
                              <Label>Google Drive Link</Label>
                              <Input
                                type="url"
                                value={isActive && submissionType==='GOOGLE_DRIVE_URL' ? url : ''}
                                onChange={(e) => { setSubmissionType('GOOGLE_DRIVE_URL'); setUrl(e.target.value) }}
                                placeholder="https://drive.google.com/file/d/..."
                              />
                              <p className="text-sm text-gray-600 mt-1">Ensure link is set to Anyone with the link can view.</p>
                            </div>
                          )
                        default:
                          return null
                      }
                    })()}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSubmit} disabled={loading || (isOverdue && !assignment.allowLate)}>
                      {loading && submissionType === type.type ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </div>
              )
            })}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Assignment'
                )}
              </Button>
            </div>
            
            {isOverdue && !assignment.allowLate && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Assignment is overdue.</strong> Late submissions are not allowed for this assignment.
                </p>
              </div>
            )}
            
            {isOverdue && assignment.allowLate && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Assignment is overdue.</strong> You can still submit, but late penalties may apply.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Submission */}
      {isSubmitted && (
        <Card>
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Submission Type</Label>
                <p className="text-sm text-gray-600 capitalize">
                  {assignment.submissions[0]?.submissionType?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
              
              <div>
                <Label>Content</Label>
                {assignment.submissions[0]?.submissionType === 'TEXT' ? (
                  <div 
                    className="prose prose-sm max-w-none p-4 bg-gray-50 rounded"
                    dangerouslySetInnerHTML={{ __html: assignment.submissions[0]?.content || '' }}
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded">
                    <a 
                      href={assignment.submissions[0]?.content} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {assignment.submissions[0]?.content}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={onCancel}>
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

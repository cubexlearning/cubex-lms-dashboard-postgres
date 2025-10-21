"use client"
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TextSubmissionForm } from './TextSubmissionForm'
import { GitHubSubmissionForm } from './GitHubSubmissionForm'
import { LiveUrlSubmissionForm } from './LiveUrlSubmissionForm'
import { ScreenshotSubmissionForm } from './ScreenshotSubmissionForm'
import { RecordingSubmissionForm } from './RecordingSubmissionForm'
import { FileSubmissionForm } from './FileSubmissionForm'
import { MultipleTypesSubmissionForm } from './MultipleTypesSubmissionForm'
import { FileText, Github, Link, Camera, Video, Upload, Layers } from 'lucide-react'

interface SubmissionFormProps {
  assignmentId: string
  assignmentTitle: string
  dueDate?: Date
  instructions?: string
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
    type: 'SCREENSHOTS',
    label: 'Screenshots',
    description: 'Upload screenshots of your work',
    icon: Camera,
    color: 'bg-purple-100 text-purple-800'
  },
  {
    type: 'SCREENRECORDINGS',
    label: 'Screen Recordings',
    description: 'Upload video recordings of your work',
    icon: Video,
    color: 'bg-red-100 text-red-800'
  },
  {
    type: 'FILE_UPLOAD',
    label: 'File Upload',
    description: 'Upload files (documents, code, etc.)',
    icon: Upload,
    color: 'bg-orange-100 text-orange-800'
  },
  {
    type: 'MULTIPLE_TYPES',
    label: 'Multiple Types',
    description: 'Combine different submission types',
    icon: Layers,
    color: 'bg-indigo-100 text-indigo-800'
  }
]

export function SubmissionForm({ assignmentId, assignmentTitle, dueDate, instructions }: SubmissionFormProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const renderSubmissionForm = () => {
    if (!selectedType) return null

    const commonProps = {
      assignmentId,
      onSuccess: () => {
        setIsSubmitting(false)
        // Handle success (redirect, show message, etc.)
      },
      onError: (error: string) => {
        setIsSubmitting(false)
        console.error('Submission error:', error)
        // Handle error (show toast, etc.)
      }
    }

    switch (selectedType) {
      case 'TEXT':
        return <TextSubmissionForm {...commonProps} />
      case 'GITHUB_URL':
        return <GitHubSubmissionForm {...commonProps} />
      case 'LIVE_URL':
        return <LiveUrlSubmissionForm {...commonProps} />
      case 'SCREENSHOTS':
        return <ScreenshotSubmissionForm {...commonProps} />
      case 'SCREENRECORDINGS':
        return <RecordingSubmissionForm {...commonProps} />
      case 'FILE_UPLOAD':
        return <FileSubmissionForm {...commonProps} />
      case 'MULTIPLE_TYPES':
        return <MultipleTypesSubmissionForm {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle>{assignmentTitle}</CardTitle>
          {dueDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Due: {dueDate.toLocaleDateString()}</span>
              {new Date() > dueDate && (
                <Badge variant="destructive">Overdue</Badge>
              )}
            </div>
          )}
        </CardHeader>
        {instructions && (
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700">{instructions}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Submission Type Selection */}
      {!selectedType ? (
        <Card>
          <CardHeader>
            <CardTitle>Choose Submission Type</CardTitle>
            <p className="text-sm text-gray-600">
              Select how you want to submit your assignment
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissionTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.type}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2"
                    onClick={() => setSelectedType(type.type)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-xs text-gray-600 text-left">
                      {type.description}
                    </p>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {submissionTypes.find(t => t.type === selectedType)?.label}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedType(null)}
              >
                Change Type
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderSubmissionForm()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

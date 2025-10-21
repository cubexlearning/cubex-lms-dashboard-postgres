"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface TextSubmissionFormProps {
  assignmentId: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function TextSubmissionForm({ assignmentId, onSuccess, onError }: TextSubmissionFormProps) {
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error('Please enter your submission content')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('submissionType', 'TEXT')
      formData.append('content', content)
      formData.append('description', description)

      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Text submission submitted successfully!')
        onSuccess()
      } else {
        throw new Error(result.error || 'Failed to submit text')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit text')
      onError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="content">Your Submission *</Label>
        <Textarea
          id="content"
          placeholder="Enter your submission content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="min-h-[200px]"
        />
        <p className="text-sm text-gray-500">
          {content.length} characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Provide additional context or notes about your submission..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Text'}
        </Button>
      </div>
    </form>
  )
}

"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Link, ExternalLink, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface LiveUrlSubmissionFormProps {
  assignmentId: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function LiveUrlSubmissionForm({ assignmentId, onSuccess, onError }: LiveUrlSubmissionFormProps) {
  const [url, setUrl] = useState('')
  const [technologies, setTechnologies] = useState<string[]>([])
  const [newTech, setNewTech] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addTechnology = () => {
    if (newTech.trim() && !technologies.includes(newTech.trim())) {
      setTechnologies([...technologies, newTech.trim()])
      setNewTech('')
    }
  }

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter(t => t !== tech))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      toast.error('Please enter a live URL')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('submissionType', 'LIVE_URL')
      formData.append('url', url)
      formData.append('technologies', JSON.stringify(technologies))
      formData.append('description', description)

      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Live URL submitted successfully!')
        onSuccess()
      } else {
        throw new Error(result.error || 'Failed to submit URL')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit URL')
      onError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Link className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Live Demo Submission</span>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Live URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://your-demo.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Technologies Used</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., React, Node.js, MongoDB"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                />
                <Button type="button" onClick={addTechnology} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTechnology(tech)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your live demo, key features, or any additional notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {url && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Live Demo Preview</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Visit
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2 font-mono">
              {url}
            </p>
            {technologies.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Technologies:</p>
                <div className="flex flex-wrap gap-1">
                  {technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!url.trim() || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Live Demo'}
        </Button>
      </div>
    </form>
  )
}

"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Github, Link, Camera, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface MultipleTypesSubmissionFormProps {
  assignmentId: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function MultipleTypesSubmissionForm({ assignmentId, onSuccess, onError }: MultipleTypesSubmissionFormProps) {
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [screenshots, setScreenshots] = useState<File[]>([])
  const [fileUploads, setFileUploads] = useState<File[]>([])
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleScreenshotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setScreenshots(prev => [...prev, ...files])
  }

  const handleFileUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFileUploads(prev => [...prev, ...files])
  }

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index))
  }

  const removeFileUpload = (index: number) => {
    setFileUploads(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!githubUrl && !liveUrl && screenshots.length === 0 && fileUploads.length === 0) {
      toast.error('Please provide at least one submission type')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('submissionType', 'MULTIPLE_TYPES')
      formData.append('githubUrl', githubUrl)
      formData.append('liveUrl', liveUrl)
      formData.append('description', description)
      
      // Add screenshots
      screenshots.forEach(file => {
        formData.append('screenshots', file)
      })
      
      // Add file uploads
      fileUploads.forEach(file => {
        formData.append('fileUploads', file)
      })

      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Multi-type submission submitted successfully!')
        onSuccess()
      } else {
        throw new Error(result.error || 'Failed to submit')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit')
      onError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="github" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="github" className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            GitHub
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Live Demo
          </TabsTrigger>
          <TabsTrigger value="screenshots" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Screenshots
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="github" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                GitHub Repository
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="githubUrl">Repository URL</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/username/repository"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Live Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="liveUrl">Live URL</Label>
                <Input
                  id="liveUrl"
                  type="url"
                  placeholder="https://your-demo.com"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screenshots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Screenshots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="screenshots">Upload Screenshots</Label>
                  <Input
                    id="screenshots"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="mt-1"
                  />
                </div>
                {screenshots.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Screenshots ({screenshots.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {screenshots.map((file, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {file.name}
                          <button
                            type="button"
                            onClick={() => removeScreenshot(index)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                File Uploads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fileUploads">Upload Files</Label>
                  <Input
                    id="fileUploads"
                    type="file"
                    multiple
                    onChange={handleFileUploadChange}
                    className="mt-1"
                  />
                </div>
                {fileUploads.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files ({fileUploads.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {fileUploads.map((file, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {file.name}
                          <button
                            type="button"
                            onClick={() => removeFileUpload(index)}
                            className="ml-1 hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Describe your submission or provide additional context..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={(!githubUrl && !liveUrl && screenshots.length === 0 && fileUploads.length === 0) || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Submitting...' : 'Submit All'}
        </Button>
      </div>
    </form>
  )
}

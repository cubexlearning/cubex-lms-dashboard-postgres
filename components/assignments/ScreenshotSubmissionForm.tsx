"use client"
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Camera, Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ScreenshotSubmissionFormProps {
  assignmentId: string
  onSuccess: () => void
  onError: (error: string) => void
}

interface UploadedFile {
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  error?: string
  url?: string
}

export function ScreenshotSubmissionForm({ assignmentId, onSuccess, onError }: ScreenshotSubmissionFormProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const invalidFiles = selectedFiles.filter(file => !validTypes.includes(file.type))
    
    if (invalidFiles.length > 0) {
      toast.error(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}`)
      return
    }

    // Validate file sizes (max 10MB per image)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      toast.error(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}`)
      return
    }

    // Add files to state
    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false
    }))

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (files.length === 0) {
      toast.error('Please select at least one image')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('submissionType', 'SCREENSHOTS')
      formData.append('description', description)
      
      // Add image files
      files.forEach(file => {
        formData.append('images', file.file)
      })

      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Screenshots submitted successfully!')
        onSuccess()
      } else {
        throw new Error(result.error || 'Failed to submit screenshots')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit screenshots')
      onError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div className="space-y-4">
        <Label htmlFor="screenshots">Upload Screenshots</Label>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Click to upload screenshots
          </p>
          <p className="text-sm text-gray-500 mb-4">
            PNG, JPG, GIF, WebP up to 10MB each
          </p>
          <Button type="button" variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected Files Preview */}
      {files.length > 0 && (
        <div className="space-y-4">
          <Label>Selected Images ({files.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-2">
                  <div className="aspect-square relative">
                    <img
                      src={file.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    {file.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-xs">Uploading...</div>
                      </div>
                    )}
                    {file.uploaded && (
                      <div className="absolute inset-0 bg-green-500 bg-opacity-50 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {file.error && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Describe your screenshots or provide additional context..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Upload Progress */}
      {isSubmitting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setFiles([])}
          disabled={isSubmitting}
        >
          Clear All
        </Button>
        <Button
          type="submit"
          disabled={files.length === 0 || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Screenshots'}
        </Button>
      </div>
    </form>
  )
}

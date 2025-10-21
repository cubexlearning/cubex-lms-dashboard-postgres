"use client"
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface FileSubmissionFormProps {
  assignmentId: string
  onSuccess: () => void
  onError: (error: string) => void
}

interface UploadedFile {
  file: File
  uploading: boolean
  uploaded: boolean
  error?: string
  url?: string
}

export function FileSubmissionForm({ assignmentId, onSuccess, onError }: FileSubmissionFormProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // Check file sizes (max 50MB per file)
    const maxSize = 50 * 1024 * 1024 // 50MB
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      toast.error(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}`)
      return
    }

    // Add files to state
    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      file,
      uploading: false,
      uploaded: false
    }))

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type.startsWith('video/')) return '🎥'
    if (file.type.includes('pdf')) return '📄'
    if (file.type.includes('text')) return '📝'
    if (file.type.includes('zip') || file.type.includes('rar')) return '📦'
    return '📁'
  }

  const getFileCategory = (file: File) => {
    if (file.type.startsWith('image/')) return 'Image'
    if (file.type.startsWith('video/')) return 'Video'
    if (file.type.includes('pdf')) return 'PDF'
    if (file.type.includes('text')) return 'Text'
    if (file.type.includes('zip') || file.type.includes('rar')) return 'Archive'
    return 'File'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (files.length === 0) {
      toast.error('Please select at least one file')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('submissionType', 'FILE_UPLOAD')
      formData.append('description', description)
      
      // Add files
      files.forEach(file => {
        formData.append('files', file.file)
      })

      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Files submitted successfully!')
        onSuccess()
      } else {
        throw new Error(result.error || 'Failed to submit files')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit files')
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
        <Label htmlFor="files">Upload Files</Label>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Click to upload files
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Any file type up to 50MB each
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
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected Files Preview */}
      {files.length > 0 && (
        <div className="space-y-4">
          <Label>Selected Files ({files.length})</Label>
          <div className="space-y-2">
            {files.map((file, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getFileIcon(file.file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {file.file.name}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {getFileCategory(file.file)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.uploading && (
                        <div className="text-xs text-blue-600">Uploading...</div>
                      )}
                      {file.uploaded && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {file.error && (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
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
          placeholder="Describe your files or provide additional context..."
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
          {isSubmitting ? 'Submitting...' : 'Submit Files'}
        </Button>
      </div>
    </form>
  )
}

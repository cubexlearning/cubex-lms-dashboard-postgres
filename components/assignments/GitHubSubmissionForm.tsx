"use client"
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Github, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface GitHubSubmissionFormProps {
  assignmentId: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function GitHubSubmissionForm({ assignmentId, onSuccess, onError }: GitHubSubmissionFormProps) {
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [commitHash, setCommitHash] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateGitHubUrl = (url: string) => {
    const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/
    return githubRegex.test(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!repositoryUrl.trim()) {
      toast.error('Please enter a GitHub repository URL')
      return
    }

    if (!validateGitHubUrl(repositoryUrl)) {
      toast.error('Please enter a valid GitHub repository URL')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('submissionType', 'GITHUB_URL')
      formData.append('repositoryUrl', repositoryUrl)
      formData.append('branch', branch)
      formData.append('commitHash', commitHash)
      formData.append('description', description)

      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('GitHub repository submitted successfully!')
        onSuccess()
      } else {
        throw new Error(result.error || 'Failed to submit repository')
      }
    } catch (error) {
      console.error('Submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit repository')
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
            <Github className="w-5 h-5 text-gray-600" />
            <span className="font-medium">GitHub Repository Submission</span>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repositoryUrl">Repository URL *</Label>
              <Input
                id="repositoryUrl"
                type="url"
                placeholder="https://github.com/username/repository"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                className="font-mono text-sm"
              />
              {repositoryUrl && !validateGitHubUrl(repositoryUrl) && (
                <p className="text-sm text-red-600">
                  Please enter a valid GitHub repository URL
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commitHash">Commit Hash (Optional)</Label>
                <Input
                  id="commitHash"
                  placeholder="abc123def456..."
                  value={commitHash}
                  onChange={(e) => setCommitHash(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your project, key features, or any additional notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {repositoryUrl && validateGitHubUrl(repositoryUrl) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Repository Preview</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(repositoryUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2 font-mono">
              {repositoryUrl}
            </p>
            {branch && (
              <p className="text-xs text-gray-500 mt-1">
                Branch: {branch}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!repositoryUrl.trim() || !validateGitHubUrl(repositoryUrl) || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Repository'}
        </Button>
      </div>
    </form>
  )
}

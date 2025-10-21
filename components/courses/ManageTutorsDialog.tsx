"use client"
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, User, Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

type Tutor = {
  id: string
  name: string
  email: string
  avatar?: string
  qualifications?: string
  experience?: string
  specializations?: string[]
  hourlyRate?: number
  isAssigned?: boolean
  isPrimary?: boolean
}

type Course = {
  id: string
  title: string
  courseTutors?: Array<{
    tutorId: string
    isPrimary: boolean
    specialization: string
  }>
}

interface ManageTutorsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  onSuccess?: () => void
}

export function ManageTutorsDialog({ open, onOpenChange, course, onSuccess }: ManageTutorsDialogProps) {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTutors, setSelectedTutors] = useState<string[]>([])
  const [primaryTutor, setPrimaryTutor] = useState<string>('')

  // Load tutors when dialog opens
  useEffect(() => {
    if (open && course) {
      loadTutors()
      loadCourseTutors()
    }
  }, [open, course])

  const loadTutors = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users?role=TUTOR')
      const data = await response.json()
      if (data.success) {
        setTutors(data.data)
      } else {
        toast.error('Failed to load tutors')
      }
    } catch (error) {
      console.error('Error loading tutors:', error)
      toast.error('Failed to load tutors')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCourseTutors = async () => {
    if (!course) return
    
    try {
      const response = await fetch(`/api/courses/${course.id}`)
      const data = await response.json()
      if (data.success && data.data.courseTutors) {
        const assignedTutorIds = data.data.courseTutors.map((ct: any) => ct.tutorId)
        const primaryTutorId = data.data.courseTutors.find((ct: any) => ct.isPrimary)?.tutorId || ''
        
        setSelectedTutors(assignedTutorIds)
        setPrimaryTutor(primaryTutorId)
      }
    } catch (error) {
      console.error('Error loading course tutors:', error)
    }
  }

  const handleTutorToggle = (tutorId: string) => {
    setSelectedTutors(prev => {
      if (prev.includes(tutorId)) {
        // If removing tutor, also remove as primary if it was primary
        if (primaryTutor === tutorId) {
          setPrimaryTutor('')
        }
        return prev.filter(id => id !== tutorId)
      } else {
        return [...prev, tutorId]
      }
    })
  }

  const handlePrimaryChange = (tutorId: string) => {
    if (selectedTutors.includes(tutorId)) {
      setPrimaryTutor(tutorId)
    }
  }

  const handleSave = async () => {
    if (!course) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/courses/${course.id}/tutors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorIds: selectedTutors,
          primaryTutorId: primaryTutor
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('Tutors updated successfully')
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(data.error || 'Failed to update tutors')
      }
    } catch (error) {
      console.error('Error updating tutors:', error)
      toast.error('Failed to update tutors')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTutors = tutors.filter(tutor =>
    tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Manage Tutors - {course?.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tutors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tutors List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading tutors...</span>
                </div>
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tutors found
              </div>
            ) : (
              filteredTutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className={`p-4 border rounded-lg flex items-center justify-between ${
                    selectedTutors.includes(tutor.id) ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedTutors.includes(tutor.id)}
                      onCheckedChange={() => handleTutorToggle(tutor.id)}
                    />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={tutor.avatar} alt={tutor.name} />
                      <AvatarFallback>
                        {tutor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{tutor.name}</div>
                      <div className="text-sm text-gray-500">{tutor.email}</div>
                      {tutor.qualifications && (
                        <div className="text-xs text-gray-400">{tutor.qualifications}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedTutors.includes(tutor.id) && (
                      <Button
                        variant={primaryTutor === tutor.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePrimaryChange(tutor.id)}
                        className="text-xs"
                      >
                        {primaryTutor === tutor.id ? "Primary" : "Set Primary"}
                      </Button>
                    )}
                    {tutor.hourlyRate && (
                      <Badge variant="secondary">
                        ${tutor.hourlyRate}/hr
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          {selectedTutors.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <div className="text-sm text-gray-600">
                <strong>{selectedTutors.length}</strong> tutor{selectedTutors.length > 1 ? 's' : ''} selected
                {primaryTutor && (
                  <span className="ml-2">
                    • <strong>Primary:</strong> {tutors.find(t => t.id === primaryTutor)?.name}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { RichEditor } from '@/components/ui/rich-editor'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { CalendarIcon, Plus, X, Users, BookOpen, UserCheck, Search, Check } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
}

interface Student {
  id: string
  name: string
  email: string
}

interface AssignmentFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: any
}

type TargetType = 'ALL_STUDENTS' | 'COURSES' | 'SELECTED_INDIVIDUALS'
type AssignmentType = 'REGULAR' | 'PROJECT' | 'QUIZ' | 'PEER_REVIEW' | 'GROUP_WORK'

export function AssignmentForm({ onSuccess, onCancel, initialData }: AssignmentFormProps) {
  const { data: session } = useSession()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [courseSearch, setCourseSearch] = useState('')
  const [showStudentSearch, setShowStudentSearch] = useState(false)
  const [showCourseSearch, setShowCourseSearch] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    attachments: [] as string[],
    dueDate: new Date(),
    maxPoints: 100,
    assignmentType: 'REGULAR' as AssignmentType,
    targetType: 'ALL_STUDENTS' as TargetType,
    allowLate: true,
    latePenalty: 0,
    courseId: '',
    expectedSubmissionTypes: [] as Array<'TEXT'|'GITHUB_URL'|'LIVE_URL'|'GOOGLE_DRIVE_URL'>
  })

  const [newAttachment, setNewAttachment] = useState('')

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  useEffect(() => {
    fetchCourses()
    fetchStudents()
  }, [])

  // Close search dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.search-dropdown')) {
        setShowCourseSearch(false)
        setShowStudentSearch(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchCourses = async (search = '') => {
    try {
      const response = await fetch(`/api/courses${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      if (response.ok) {
        const data = await response.json()
        setCourses(data.data.courses || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchStudents = async (search = '') => {
    try {
      const response = await fetch(`/api/students${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data.data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addAttachment = () => {
    if (newAttachment.trim()) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment.trim()]
      }))
      setNewAttachment('')
    }
  }

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!formData.dueDate) {
      toast.error('Please select a due date')
      return
    }

    if (formData.targetType === 'COURSES' && selectedCourses.length === 0) {
      toast.error('Please select at least one course')
      return
    }

    if (formData.targetType === 'SELECTED_INDIVIDUALS' && selectedStudents.length === 0) {
      toast.error('Please select at least one student')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        targetCourseIds: selectedCourses,
        targetStudentIds: selectedStudents
      }

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success('Assignment created successfully')
        onSuccess?.()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create assignment')
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
      toast.error('Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  const getTargetDescription = () => {
    switch (formData.targetType) {
      case 'ALL_STUDENTS':
        return 'All students in the system'
      case 'COURSES':
        return `${selectedCourses.length} course(s) selected`
      case 'SELECTED_INDIVIDUALS':
        return `${selectedStudents.length} student(s) selected`
      default:
        return ''
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="title">Assignment Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter assignment title"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <RichEditor
          content={formData.description}
          onChange={(content) => handleInputChange('description', content)}
          placeholder="Enter assignment description..."
          height="120px"
        />
      </div>

      <div>
        <Label htmlFor="instructions">Instructions</Label>
        <RichEditor
          content={formData.instructions}
          onChange={(content) => handleInputChange('instructions', content)}
          placeholder="Enter detailed instructions..."
          height="200px"
        />
      </div>

      <div>
        <Label>External Resources</Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newAttachment}
              onChange={(e) => setNewAttachment(e.target.value)}
              placeholder="Enter URL (Google Drive, YouTube, etc.)"
            />
            <Button type="button" onClick={addAttachment} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.attachments.map((attachment, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="text-sm truncate flex-1">{attachment}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label>Assignment Type</Label>
        <Select
          value={formData.assignmentType}
          onValueChange={(value) => handleInputChange('assignmentType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REGULAR">Regular Assignment</SelectItem>
            <SelectItem value="PROJECT">Project</SelectItem>
            <SelectItem value="QUIZ">Quiz</SelectItem>
            <SelectItem value="PEER_REVIEW">Peer Review</SelectItem>
            <SelectItem value="GROUP_WORK">Group Work</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Target Audience</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="all-students"
              name="targetType"
              value="ALL_STUDENTS"
              checked={formData.targetType === 'ALL_STUDENTS'}
              onChange={(e) => handleInputChange('targetType', e.target.value)}
            />
            <Label htmlFor="all-students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Students
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="courses"
              name="targetType"
              value="COURSES"
              checked={formData.targetType === 'COURSES'}
              onChange={(e) => handleInputChange('targetType', e.target.value)}
            />
            <Label htmlFor="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Specific Courses
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="individuals"
              name="targetType"
              value="SELECTED_INDIVIDUALS"
              checked={formData.targetType === 'SELECTED_INDIVIDUALS'}
              onChange={(e) => handleInputChange('targetType', e.target.value)}
            />
            <Label htmlFor="individuals" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Selected Individuals
            </Label>
          </div>
        </div>

        {formData.targetType === 'COURSES' && (
          <div className="mt-4 space-y-2">
            <Label>Select Courses</Label>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => {
                    setCourseSearch(e.target.value)
                    fetchCourses(e.target.value)
                  }}
                  onFocus={() => setShowCourseSearch(true)}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              
              {showCourseSearch && (
                <div className="search-dropdown border rounded-md max-h-40 overflow-y-auto">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCourses(prev => [...prev, course.id])
                          } else {
                            setSelectedCourses(prev => prev.filter(id => id !== course.id))
                          }
                        }}
                      />
                      <Label htmlFor={`course-${course.id}`} className="text-sm flex-1 cursor-pointer">
                        {course.title}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCourses.map((courseId) => {
                    const course = courses.find(c => c.id === courseId)
                    return (
                      <Badge key={courseId} variant="secondary" className="flex items-center gap-1">
                        {course?.title}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setSelectedCourses(prev => prev.filter(id => id !== courseId))}
                        />
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {formData.targetType === 'SELECTED_INDIVIDUALS' && (
          <div className="mt-4 space-y-2">
            <Label>Select Students</Label>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value)
                    fetchStudents(e.target.value)
                  }}
                  onFocus={() => setShowStudentSearch(true)}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              
              {showStudentSearch && (
                <div className="search-dropdown border rounded-md max-h-40 overflow-y-auto">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents(prev => [...prev, student.id])
                          } else {
                            setSelectedStudents(prev => prev.filter(id => id !== student.id))
                          }
                        }}
                      />
                      <Label htmlFor={`student-${student.id}`} className="text-sm flex-1 cursor-pointer">
                        {student.name} ({student.email})
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedStudents.map((studentId) => {
                    const student = students.find(s => s.id === studentId)
                    return (
                      <Badge key={studentId} variant="secondary" className="flex items-center gap-1">
                        {student?.name}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setSelectedStudents(prev => prev.filter(id => id !== studentId))}
                        />
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-2">
          <Badge variant="secondary">{getTargetDescription()}</Badge>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxPoints">Max Points</Label>
          <Input
            id="maxPoints"
            type="number"
            value={formData.maxPoints}
            onChange={(e) => handleInputChange('maxPoints', Number(e.target.value))}
            min="1"
            max="1000"
          />
        </div>

        <div>
          <Label>Due Date *</Label>
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.dueDate}
                onSelect={(date) => {
                  if (date) {
                    handleInputChange('dueDate', date)
                    setShowDatePicker(false)
                  }
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Expected Submission Types</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { key: 'TEXT', label: 'Text' },
              { key: 'GITHUB_URL', label: 'GitHub URL' },
              { key: 'LIVE_URL', label: 'Live URL' },
              { key: 'GOOGLE_DRIVE_URL', label: 'Google Drive URL' },
            ].map((opt) => (
              <label key={opt.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.expectedSubmissionTypes.includes(opt.key as any)}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setFormData((prev) => ({
                      ...prev,
                      expectedSubmissionTypes: checked
                        ? [...prev.expectedSubmissionTypes, opt.key as any]
                        : prev.expectedSubmissionTypes.filter((t) => t !== (opt.key as any))
                    }))
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="allowLate"
            checked={formData.allowLate}
            onCheckedChange={(checked) => handleInputChange('allowLate', checked)}
          />
          <Label htmlFor="allowLate">Allow late submissions</Label>
        </div>

        {formData.allowLate && (
          <div>
            <Label htmlFor="latePenalty">Late Penalty (%)</Label>
            <Input
              id="latePenalty"
              type="number"
              value={formData.latePenalty}
              onChange={(e) => handleInputChange('latePenalty', Number(e.target.value))}
              min="0"
              max="100"
              placeholder="0"
            />
          </div>
        )}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Assignment Preview</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Title:</strong> {formData.title}</p>
          <p><strong>Type:</strong> {formData.assignmentType}</p>
          <p><strong>Target:</strong> {getTargetDescription()}</p>
          <p><strong>Due Date:</strong> {format(formData.dueDate, "PPP")}</p>
          <p><strong>Max Points:</strong> {formData.maxPoints}</p>
          {formData.allowLate && (
            <p><strong>Late Penalty:</strong> {formData.latePenalty}%</p>
          )}
        </div>
      </div>

      {formData.description && (
        <div>
          <h4 className="font-medium mb-2">Description:</h4>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formData.description }}
          />
        </div>
      )}

      {formData.instructions && (
        <div>
          <h4 className="font-medium mb-2">Instructions:</h4>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formData.instructions }}
          />
        </div>
      )}
    </div>
  )

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Assignment</CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Step {step} of 4</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onCancel?.()}
          >
            {step > 1 ? 'Previous' : 'Cancel'}
          </Button>
          
          <Button
            onClick={() => step < 4 ? setStep(step + 1) : handleSubmit()}
            disabled={loading}
          >
            {loading ? 'Creating...' : step < 4 ? 'Next' : 'Create Assignment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

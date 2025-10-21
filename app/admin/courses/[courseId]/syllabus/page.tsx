"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { ArrowLeft, Plus, BookOpen, Clock, Users, Loader2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

type Phase = { id: string; name: string; order: number }
type Item = { id: string; phaseId: string; title: string; description?: string; order: number }
type Course = {
  id: string
  title: string
  shortDescription?: string
  status: string
  category?: { name: string }
  courseFormat?: { name: string }
  _count?: { enrollments: number }
}

export default function CourseSyllabusPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const courseId = params.courseId
  const [phases, setPhases] = useState<Phase[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [newPhase, setNewPhase] = useState('')
  const [newItem, setNewItem] = useState<{ [phaseId: string]: { title: string; description?: string } }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingPhase, setIsAddingPhase] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState<{ [phaseId: string]: boolean }>({})
  const [isDeletingPhase, setIsDeletingPhase] = useState<{ [phaseId: string]: boolean }>({})
  const [isDeletingItem, setIsDeletingItem] = useState<{ [itemId: string]: boolean }>({})
  const [expandedPhases, setExpandedPhases] = useState<{ [phaseId: string]: boolean }>({})

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load course')
      }
      setCourse(data.data)
    } catch (e: any) {
      console.error('Error fetching course:', e)
      toast.error(e.message || 'Failed to load course')
      // Don't set course to null, let the loading state handle it
    }
  }

  const fetchSyllabus = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/syllabus/phases`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load')
      setPhases(data.data.phases)
      setItems(data.data.items)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load syllabus')
    }
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([fetchCourse(), fetchSyllabus()])
    } finally {
      setIsLoading(false)
    }
  }

  // Set first phase as expanded by default after loading
  useEffect(() => {
    if (phases.length > 0 && Object.keys(expandedPhases).length === 0) {
      setExpandedPhases({ [phases[0].id]: true })
    }
  }, [phases])

  useEffect(() => { 
    if (courseId) loadData() 
  }, [courseId])

  const addPhase = async () => {
    if (!newPhase.trim()) return
    setIsAddingPhase(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/syllabus/phases`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ name: newPhase })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add phase')
      setNewPhase('')
      await fetchSyllabus()
      toast.success('Phase added successfully')
    } catch (e: any) { 
      toast.error(e.message || 'Failed to add phase') 
    } finally {
      setIsAddingPhase(false)
    }
  }

  const addItem = async (phaseId: string) => {
    const payload = newItem[phaseId]
    if (!payload?.title?.trim()) return
    setIsAddingItem(prev => ({ ...prev, [phaseId]: true }))
    try {
      const res = await fetch(`/api/courses/${courseId}/syllabus/items`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ phaseId, title: payload.title, description: payload.description })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add item')
      setNewItem((s) => ({ ...s, [phaseId]: { title: '', description: '' } }))
      await fetchSyllabus()
      toast.success('Item added successfully')
    } catch (e: any) { 
      toast.error(e.message || 'Failed to add item') 
    } finally {
      setIsAddingItem(prev => ({ ...prev, [phaseId]: false }))
    }
  }

  const deletePhase = async (phaseId: string) => {
    if (!confirm('Are you sure you want to delete this phase? This will also delete all items in this phase.')) return
    
    setIsDeletingPhase(prev => ({ ...prev, [phaseId]: true }))
    try {
      const res = await fetch(`/api/courses/${courseId}/syllabus/phases/${phaseId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete phase')
      await fetchSyllabus()
      toast.success('Phase deleted successfully')
    } catch (e: any) { 
      toast.error(e.message || 'Failed to delete phase') 
    } finally {
      setIsDeletingPhase(prev => ({ ...prev, [phaseId]: false }))
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    setIsDeletingItem(prev => ({ ...prev, [itemId]: true }))
    try {
      const res = await fetch(`/api/courses/${courseId}/syllabus/items/${itemId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete item')
      await fetchSyllabus()
      toast.success('Item deleted successfully')
    } catch (e: any) { 
      toast.error(e.message || 'Failed to delete item') 
    } finally {
      setIsDeletingItem(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }))
  }

  const itemsByPhase = phases.map(phase => ({
    phase,
    items: (items || []).filter(i => i.phaseId === phase.id).sort((a,b)=>a.order-b.order)
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-800 border-green-200"
      case "DRAFT": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "ARCHIVED": return "bg-gray-100 text-gray-800 border-gray-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <RoleLayoutWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading syllabus...</span>
          </div>
        </div>
      </RoleLayoutWrapper>
    )
  }

  return (
    <RoleLayoutWrapper>
      <div className="space-y-6">
        {/* Header with back button and course info */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {course ? `${course.title} - Syllabus Management` : `Course Syllabus (${courseId.slice(0, 8)}...)`}
            </h1>
            <p className="text-gray-600">Manage course curriculum and learning phases</p>
          </div>
        </div>

        {/* Course Information */}
        {course && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{course.title}</h2>
                    <Badge className={getStatusColor(course.status)}>
                      {course.status}
                    </Badge>
                  </div>
                  {course.shortDescription && (
                    <p className="text-gray-600">{course.shortDescription}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {course.category && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.category.name}
                      </div>
                    )}
                    {course.courseFormat && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.courseFormat.name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course._count?.enrollments || 0} enrollments
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Syllabus Management */}
        <Card>
          <CardHeader>
            <CardTitle>Syllabus Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="New phase name" 
                value={newPhase} 
                onChange={e=>setNewPhase(e.target.value)}
                disabled={isAddingPhase}
              />
              <Button 
                onClick={addPhase}
                disabled={isAddingPhase || !newPhase.trim()}
                className="flex items-center gap-2"
              >
                {isAddingPhase ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Phase
              </Button>
            </div>
            <Separator />
            <div className="space-y-6">
              {itemsByPhase.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No phases added yet. Create your first phase to get started.
                </div>
              ) : (
                itemsByPhase.map(({ phase, items }) => (
                  <div key={phase.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        onClick={() => togglePhase(phase.id)}
                        className="flex items-center gap-2 p-0 h-auto font-medium text-lg"
                      >
                        {expandedPhases[phase.id] ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        {phase.order + 1}. {phase.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePhase(phase.id)}
                        disabled={isDeletingPhase[phase.id]}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {isDeletingPhase[phase.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {expandedPhases[phase.id] && (
                      <>
                        <div className="space-y-2">
                          {items.length === 0 ? (
                            <div className="text-sm text-gray-400 italic">No items in this phase</div>
                          ) : (
                            items.map((it, idx) => (
                              <div key={it.id} className="p-3 rounded border text-sm flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{phase.order + 1}.{idx + 1} {it.title}</div>
                                  {it.description && (<div className="text-gray-500">{it.description}</div>)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteItem(it.id)}
                                  disabled={isDeletingItem[it.id]}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {isDeletingItem[it.id] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="New item title" 
                            value={newItem[phase.id]?.title || ''} 
                            onChange={e=>setNewItem(s=>({ ...s, [phase.id]: { ...s[phase.id], title: e.target.value } }))}
                            disabled={isAddingItem[phase.id]}
                          />
                          <Input 
                            placeholder="Description (optional)" 
                            value={newItem[phase.id]?.description || ''} 
                            onChange={e=>setNewItem(s=>({ ...s, [phase.id]: { ...s[phase.id], description: e.target.value } }))}
                            disabled={isAddingItem[phase.id]}
                          />
                          <Button 
                            onClick={()=>addItem(phase.id)}
                            disabled={isAddingItem[phase.id] || !newItem[phase.id]?.title?.trim()}
                            className="flex items-center gap-2"
                          >
                            {isAddingItem[phase.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                            Add Item
                          </Button>
                        </div>
                      </>
                    )}
                    <Separator />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleLayoutWrapper>
  )
}
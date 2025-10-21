"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SyllabusProgress } from '@/components/students/SyllabusProgress'
import { Loader2, ArrowLeft } from 'lucide-react'

type SyllabusItem = {
  itemId: string
  title: string
  completedByStudent: boolean
  completedByTutor: boolean
  completedAt?: string
}

type SyllabusPhase = {
  phaseId: string
  phaseName: string
  items: SyllabusItem[]
  completedByStudent: boolean
  completedByTutor: boolean
  completedAt?: string
}

type Course = {
  id: string
  title: string
  shortDescription?: string
  status: string
}

export default function StudentCourseViewPage() {
  const params = useParams<{ courseId: string }>()
  const router = useRouter()
  const courseId = params.courseId
  const [course, setCourse] = useState<Course | null>(null)
  const [syllabus, setSyllabus] = useState<SyllabusPhase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (courseId) {
      loadData()
    }
  }, [courseId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // fetch course minimal (reuse tutor endpoint if needed)
      const courseRes = await fetch(`/api/tutor/courses/${courseId}`)
      const courseJson = await courseRes.json()
      if (courseJson.success) {
        setCourse({ id: courseJson.data.id, title: courseJson.data.title, shortDescription: courseJson.data.shortDescription, status: courseJson.data.status })
      }

      // fetch student syllabus with items
      const progressRes = await fetch(`/api/tutor/courses/${courseId}/students/${'me'}/progress`)
      const progressJson = await progressRes.json()
      // If tutor endpoint not suitable, fallback to student endpoint without items
      if (progressJson.success && Array.isArray(progressJson.data) && progressJson.data[0]?.items) {
        setSyllabus(progressJson.data)
      } else {
        // fallback: try student nested endpoint
        const studentProgress = await fetch(`/api/student/courses/${courseId}/syllabus/progress`)
        const studentJson = await studentProgress.json()
        if (studentJson.success) setSyllabus(studentJson.data)
      }
    } catch (e) {
      console.error('Load error', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkItemComplete = async (itemId: string) => {
    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/student/courses/${courseId}/syllabus/${itemId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedAt: new Date().toISOString() })
      })
      const json = await res.json()
      if (!json.success) {
        console.error('Failed to confirm item', json)
      } else {
        await loadData()
      }
    } catch (e) {
      console.error('Confirm error', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <RoleLayoutWrapper allowedRoles={["STUDENT"]}>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading course...
        </div>
      </RoleLayoutWrapper>
    )
  }

  return (
    <RoleLayoutWrapper allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">{course?.title || 'Course'}</h1>
          {course?.status && (
            <Badge className="ml-2">{course.status}</Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Syllabus</CardTitle>
          </CardHeader>
          <CardContent>
            <SyllabusProgress progress={syllabus} onMarkComplete={isSubmitting ? undefined : handleMarkItemComplete} />
          </CardContent>
        </Card>
      </div>
    </RoleLayoutWrapper>
  )
}



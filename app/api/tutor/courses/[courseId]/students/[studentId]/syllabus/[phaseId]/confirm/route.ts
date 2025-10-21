import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// POST - Tutor confirms a syllabus phase as completed for a student
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; studentId: string; phaseId: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { courseId, studentId, phaseId } = await params

    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TUTOR') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify tutor is assigned to this course
    const courseTutor = await prisma.courseTutor.findFirst({
      where: { courseId, tutorId: session.user.id }
    })
    if (!courseTutor) {
      return NextResponse.json({ success: false, error: 'Course not assigned to you' }, { status: 403 })
    }

    // Verify phase belongs to course (also accept syllabus item id and record item progress)
    let effectivePhaseId = phaseId
    let itemIdForProgress: string | null = null
    let phase = await prisma.courseSyllabusPhase.findFirst({ where: { id: effectivePhaseId, courseId } })
    if (!phase) {
      const item = await prisma.courseSyllabusItem.findFirst({ where: { id: effectivePhaseId, courseId } })
      if (item) {
        itemIdForProgress = item.id
        effectivePhaseId = item.phaseId
        phase = await prisma.courseSyllabusPhase.findFirst({ where: { id: effectivePhaseId, courseId } })
      }
    }
    if (!phase) {
      return NextResponse.json({ success: false, error: 'Phase not found' }, { status: 404 })
    }

    // Verify student has an enrollment in this course (any status)
    const enrollment = await prisma.enrollment.findFirst({ where: { studentId, courseId } })
    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Student not enrolled' }, { status: 403 })
    }

    // Upsert progress and lock if both confirmed
    const body = await request.json().catch(() => ({})) as any
    const completedAtFromClient = body?.completedAt ? new Date(body.completedAt) : null
    const updated = await prisma.$transaction(async (tx) => {
      // If item specified, record item-level progress
      if (itemIdForProgress) {
        const itemNext = await tx.studentSyllabusItemProgress.upsert({
          where: { studentId_itemId: { studentId, itemId: itemIdForProgress } },
          create: { 
            studentId, 
            itemId: itemIdForProgress, 
            completedByTutor: true,
            completedAt: completedAtFromClient || new Date(),
          },
          update: { 
            completedByTutor: true,
            completedAt: completedAtFromClient || new Date(),
          }
        })

        // After marking item, compute phase completion from all items
        const phaseItems = await tx.courseSyllabusItem.findMany({ where: { phaseId: effectivePhaseId } })
        const itemIds = phaseItems.map(i => i.id)
        const itemProg = await tx.studentSyllabusItemProgress.findMany({ where: { studentId, itemId: { in: itemIds } } })
        const allTutor = itemIds.length > 0 && itemIds.every(id => itemProg.find(p => p.itemId === id)?.completedByTutor)
        const allStudent = itemIds.length > 0 && itemIds.every(id => itemProg.find(p => p.itemId === id)?.completedByStudent)

        const phaseExisting = await tx.studentSyllabusProgress.findUnique({ where: { studentId_phaseId: { studentId, phaseId: effectivePhaseId } } })
        if (allTutor || phaseExisting?.completedByTutor) {
          const phaseUpdated = await tx.studentSyllabusProgress.upsert({
            where: { studentId_phaseId: { studentId, phaseId: effectivePhaseId } },
            create: { studentId, phaseId: effectivePhaseId, completedByTutor: true, completedByStudent: allStudent, completedAt: allTutor && allStudent ? new Date() : null },
            update: { completedByTutor: true, completedByStudent: allStudent, completedAt: allTutor && allStudent ? new Date() : phaseExisting?.completedAt || null }
          })
          return phaseUpdated
        }
        return itemNext
      }

      // No item specified: fallback to phase-level confirm
      const existing = await tx.studentSyllabusProgress.findUnique({ where: { studentId_phaseId: { studentId, phaseId: effectivePhaseId } } })
      if (existing?.completedByStudent && existing?.completedByTutor) return existing
      return await tx.studentSyllabusProgress.upsert({
        where: { studentId_phaseId: { studentId, phaseId: effectivePhaseId } },
        create: { studentId, phaseId: effectivePhaseId, completedByTutor: true },
        update: { completedByTutor: true }
      })
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Tutor confirm phase error:', error)
    return NextResponse.json({ success: false, error: 'Failed to confirm phase' }, { status: 500 })
  }
}



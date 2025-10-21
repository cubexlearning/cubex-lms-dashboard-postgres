import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// POST - Student confirms a syllabus item (or phase) as completed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; phaseId: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { courseId, phaseId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const studentId = session.user.id

    // Verify enrollment
    const enrollment = await prisma.enrollment.findFirst({ where: { studentId, courseId } })
    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Not enrolled in course' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({})) as any
    const completedAtFromClient = body?.completedAt ? new Date(body.completedAt) : null

    // Accept item id or phase id
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

    const updated = await prisma.$transaction(async (tx) => {
      if (itemIdForProgress) {
        const itemNext = await tx.studentSyllabusItemProgress.upsert({
          where: { studentId_itemId: { studentId, itemId: itemIdForProgress } },
          create: { studentId, itemId: itemIdForProgress, completedByStudent: true, completedAt: completedAtFromClient || new Date() },
          update: { completedByStudent: true, completedAt: completedAtFromClient || new Date() }
        })

        // Recompute phase completion from items
        const phaseItems = await tx.courseSyllabusItem.findMany({ where: { phaseId: effectivePhaseId } })
        const itemIds = phaseItems.map(i => i.id)
        const itemProg = await tx.studentSyllabusItemProgress.findMany({ where: { studentId, itemId: { in: itemIds } } })
        const allTutor = itemIds.length > 0 && itemIds.every(id => itemProg.find(p => p.itemId === id)?.completedByTutor)
        const allStudent = itemIds.length > 0 && itemIds.every(id => itemProg.find(p => p.itemId === id)?.completedByStudent)

        const phaseUpdated = await tx.studentSyllabusProgress.upsert({
          where: { studentId_phaseId: { studentId, phaseId: effectivePhaseId } },
          create: { studentId, phaseId: effectivePhaseId, completedByTutor: allTutor, completedByStudent: allStudent, completedAt: allTutor && allStudent ? new Date() : null },
          update: { completedByTutor: allTutor, completedByStudent: allStudent, completedAt: allTutor && allStudent ? new Date() : null }
        })

        return phaseUpdated
      }

      // Fallback: phase-level confirm
      const existing = await tx.studentSyllabusProgress.findUnique({ where: { studentId_phaseId: { studentId, phaseId: effectivePhaseId } } })
      if (existing?.completedByStudent && existing?.completedByTutor) return existing
      return await tx.studentSyllabusProgress.upsert({
        where: { studentId_phaseId: { studentId, phaseId: effectivePhaseId } },
        create: { studentId, phaseId: effectivePhaseId, completedByStudent: true },
        update: { completedByStudent: true }
      })
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Student confirm phase error:', error)
    return NextResponse.json({ success: false, error: 'Failed to confirm phase' }, { status: 500 })
  }
}



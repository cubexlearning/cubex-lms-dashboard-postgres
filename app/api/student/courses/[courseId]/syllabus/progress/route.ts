import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET - list syllabus progress for the current student in a course (with items)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { courseId } = await params
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

    // Phases with items
    const phases = await prisma.courseSyllabusPhase.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: { items: { orderBy: { order: 'asc' } } }
    })

    const phaseProgress = await prisma.studentSyllabusProgress.findMany({
      where: { studentId, phase: { courseId } }
    })

    const itemProgress = await prisma.studentSyllabusItemProgress.findMany({
      where: { studentId, item: { courseId } }
    })

    const data = phases.map(p => {
      const items = (p.items || []).map(it => {
        const ip = itemProgress.find(x => x.itemId === it.id)
        return {
          itemId: it.id,
          title: it.title,
          completedByStudent: ip?.completedByStudent || false,
          completedByTutor: ip?.completedByTutor || false,
          completedAt: ip?.completedAt ? new Date(ip.completedAt).toISOString() : undefined,
        }
      })
      const allTutor = items.length > 0 && items.every(i => i.completedByTutor)
      const allStudent = items.length > 0 && items.every(i => i.completedByStudent)
      const pr = phaseProgress.find(x => x.phaseId === p.id)
      return {
        phaseId: p.id,
        phaseName: p.name,
        items,
        completedByStudent: items.length ? allStudent : (pr?.completedByStudent || false),
        completedByTutor: items.length ? allTutor : (pr?.completedByTutor || false),
        completedAt: (items.length && allTutor && allStudent) ? new Date().toISOString() : (pr?.completedAt?.toISOString()),
      }
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Student syllabus progress error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch progress' }, { status: 500 })
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/courses/[courseId]/students/[studentId]/progress - Get student syllabus progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; studentId: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { courseId, studentId } = await params

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify tutor is assigned to this course
    const courseTutor = await prisma.courseTutor.findFirst({
      where: {
        courseId: courseId,
        tutorId: session.user.id
      }
    })

    if (!courseTutor) {
      return NextResponse.json(
        { success: false, error: 'Course not assigned to you' },
        { status: 403 }
      )
    }

    // Get syllabus phases with items
    const phases = await prisma.courseSyllabusPhase.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // Get student progress for each phase (fail-safe to empty if table not yet migrated)
    let progressRecords: any[] = []
    try {
      progressRecords = await prisma.studentSyllabusProgress.findMany({
        where: {
          studentId: studentId,
          phase: {
            courseId: courseId
          }
        },
        include: {
          phase: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    } catch (e) {
      // If the relation/table doesn't exist yet, default to no progress
      progressRecords = []
    }

    // Create progress data for each phase
    // Fetch item progress
    const itemProgress = await prisma.studentSyllabusItemProgress.findMany({
      where: { studentId, item: { courseId } }
    })

    const progressData = phases.map(phase => {
      const phaseProgress = progressRecords.find(p => p.phaseId === phase.id)
      const items = (phase.items || []).map(item => {
        const ip = itemProgress.find(x => x.itemId === item.id)
        return {
          itemId: item.id,
          title: item.title,
          completedByStudent: ip?.completedByStudent || false,
          completedByTutor: ip?.completedByTutor || false,
          completedAt: ip?.completedAt?.toISOString(),
        }
      })
      const allItemsTutor = items.length > 0 && items.every(i => i.completedByTutor)
      const allItemsStudent = items.length > 0 && items.every(i => i.completedByStudent)
      return {
        phaseId: phase.id,
        phaseName: phase.name,
        items,
        // phase status computed from items, fallback to phase record if no items
        completedByTutor: items.length ? allItemsTutor : (phaseProgress?.completedByTutor || false),
        completedByStudent: items.length ? allItemsStudent : (phaseProgress?.completedByStudent || false),
        completedAt: (items.length && allItemsTutor && allItemsStudent) ? new Date().toISOString() : (phaseProgress?.completedAt?.toISOString()),
      }
    })

    return NextResponse.json({
      success: true,
      data: progressData
    })

  } catch (error) {
    console.error('Error fetching student progress:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student progress' },
      { status: 500 }
    )
  }
}

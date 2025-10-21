import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/courses/[courseId]/sessions - Get sessions for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { courseId } = await params

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

    // Get sessions for this course
    const sessions = await prisma.classSession.findMany({
      where: {
        courseId: courseId
      },
      include: {
        _count: {
          select: {
            attendance: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    })

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: session.title,
      description: session.description,
      scheduledAt: session.scheduledAt.toISOString(),
      duration: session.duration,
      type: session.type,
      status: session.status,
      notes: session.notes,
      _count: {
        attendance: session._count.attendance
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedSessions
    })

  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

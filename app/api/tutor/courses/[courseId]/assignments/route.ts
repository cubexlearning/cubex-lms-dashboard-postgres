import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/courses/[courseId]/assignments - Get assignments for a course
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

    // Get assignments for this course
    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: courseId
      },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate?.toISOString(),
      maxPoints: assignment.maxPoints,
      instructions: assignment.instructions,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt.toISOString(),
      _count: {
        submissions: assignment._count.submissions
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedAssignments
    })

  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/assignments/submissions/[id] - Get specific submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { id: submissionId } = await params

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get submission with related data
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        assignment: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        enrollment: {
          select: {
            id: true,
            status: true,
            enrolledAt: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    if (session.user.role === 'STUDENT') {
      if (submission.studentId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    } else if (session.user.role === 'TUTOR') {
      // Check if tutor is assigned to this course
      const courseTutor = await prisma.courseTutor.findFirst({
        where: {
          tutorId: session.user.id,
          courseId: submission.assignment.courseId
        }
      })

      if (!courseTutor) {
        return NextResponse.json(
          { success: false, error: 'You are not assigned to this course' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: submission
    })

  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}

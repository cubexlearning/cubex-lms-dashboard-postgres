import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/courses/[courseId]/students/[studentId]/assignments - Get student assignment submissions
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

    // Get assignment submissions
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: studentId,
        assignment: {
          courseId: courseId
        }
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            maxPoints: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      assignmentId: submission.assignmentId,
      status: submission.status,
      submittedAt: submission.submittedAt.toISOString(),
      grade: submission.grade,
      feedback: submission.feedback,
      assignment: {
        title: submission.assignment.title,
        dueDate: submission.assignment.dueDate.toISOString(),
        maxPoints: submission.assignment.maxPoints
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedSubmissions
    })

  } catch (error) {
    console.error('Error fetching student assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignment submissions' },
      { status: 500 }
    )
  }
}

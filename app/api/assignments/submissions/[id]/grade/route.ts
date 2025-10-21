import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

export const runtime = 'nodejs'

const gradeSubmissionSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().optional(),
  status: z.enum(['GRADED', 'RETURNED']).optional()
})

// PUT /api/assignments/submissions/[id]/grade - Grade a submission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { id: submissionId } = await params

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user.role !== 'TUTOR' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get submission with assignment info
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: true
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

    // Check if tutor is assigned to this course
    if (session.user.role === 'TUTOR') {
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

    const body = await request.json()
    const validatedData = gradeSubmissionSchema.parse(body)

    // Update submission with grade
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: validatedData.score,
        feedback: validatedData.feedback,
        status: validatedData.status || 'GRADED',
        isGraded: true,
        gradedAt: new Date()
      },
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
          select: {
            id: true,
            title: true,
            maxPoints: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission graded successfully'
    })

  } catch (error) {
    console.error('Error grading submission:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to grade submission' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

export const runtime = 'nodejs'

const gradeSubmissionSchema = z.object({
  score: z.number().min(0).max(1000),
  feedback: z.string().optional()
})

// POST - Grade a submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { id: submissionId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'TUTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = gradeSubmissionSchema.parse(body)

    // Check if submission exists
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: { maxPoints: true, creatorId: true }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'TUTOR' && submission.assignment.creatorId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Validate score
    if (validatedData.score > submission.assignment.maxPoints) {
      return NextResponse.json({ 
        success: false, 
        error: `Score cannot exceed ${submission.assignment.maxPoints} points` 
      }, { status: 400 })
    }

    // Update submission with grade
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: validatedData.score,
        feedback: validatedData.feedback,
        isGraded: true,
        status: 'GRADED',
        gradedAt: new Date()
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        assignment: {
          select: { id: true, title: true, maxPoints: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedSubmission })
  } catch (error) {
    console.error('Grade submission error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to grade submission' }, { status: 500 })
  }
}

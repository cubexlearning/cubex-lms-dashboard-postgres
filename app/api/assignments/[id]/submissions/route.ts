import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

export const runtime = 'nodejs'

const createSubmissionSchema = z.object({
  content: z.string().optional(),
  submissionType: z.enum(['TEXT', 'GITHUB_URL', 'LIVE_URL', 'GOOGLE_DRIVE_URL', 'MULTIPLE_TYPES']).default('TEXT')
})

const updateSubmissionSchema = z.object({
  content: z.string().optional(),
  submissionType: z.enum(['TEXT', 'GITHUB_URL', 'LIVE_URL', 'GOOGLE_DRIVE_URL', 'MULTIPLE_TYPES']).optional(),
  status: z.enum(['PENDING', 'PROGRESS', 'COMPLETED', 'GRADED']).optional()
})

// GET - Get assignment submissions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')

    const where: any = { assignmentId: id }
    
    if (status) {
      where.status = status
    }
    
    if (studentId) {
      where.studentId = studentId
    }

    // If user is a student, only show their own submissions
    if (session.user.role === 'STUDENT') {
      where.studentId = session.user.id
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        assignment: {
          select: { id: true, title: true, maxPoints: true, dueDate: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: submissions })
  } catch (error) {
    console.error('Get submissions error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

// POST - Create or update submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { id: assignmentId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSubmissionSchema.parse(body)

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { dueDate: true, allowLate: true }
    })

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 })
    }

    // Late submissions allowed globally (business rule)

    // Upsert submission per type (manual upsert to avoid client unique type name issues)
    const existing = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: session.user.id,
        submissionType: validatedData.submissionType
      }
    })

    const submission = existing
      ? await prisma.assignmentSubmission.update({
          where: { id: existing.id },
          data: {
            content: validatedData.content,
            status: 'COMPLETED',
            submittedAt: new Date()
          },
          include: {
            student: { select: { id: true, name: true, email: true } },
            assignment: { select: { id: true, title: true, maxPoints: true } }
          }
        })
      : await prisma.assignmentSubmission.create({
          data: {
            assignmentId,
            studentId: session.user.id,
            content: validatedData.content,
            submissionType: validatedData.submissionType,
            status: 'COMPLETED',
            submittedAt: new Date()
          },
          include: {
            student: { select: { id: true, name: true, email: true } },
            assignment: { select: { id: true, title: true, maxPoints: true } }
          }
        })

    return NextResponse.json({ success: true, data: submission })
  } catch (error) {
    console.error('Create submission error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to submit assignment' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

export const runtime = 'nodejs'

const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  maxPoints: z.number().min(1).max(1000).optional(),
  assignmentType: z.enum(['REGULAR', 'PROJECT', 'QUIZ', 'PEER_REVIEW', 'GROUP_WORK']).optional(),
  allowLate: z.boolean().optional(),
  latePenalty: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional()
})

// GET - Get assignment details
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

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { id: true, title: true }
        },
        submissions: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { submittedAt: 'desc' }
        },
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'TUTOR' && assignment.creatorId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: assignment })
  } catch (error) {
    console.error('Get assignment error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch assignment' }, { status: 500 })
  }
}

// PUT - Update assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'TUTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateAssignmentSchema.parse(body)

    // Check if assignment exists and user has permission
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      select: { creatorId: true }
    })

    if (!existingAssignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 })
    }

    if (session.user.role === 'TUTOR' && existingAssignment.creatorId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: validatedData,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { id: true, title: true }
        },
        submissions: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: updatedAssignment })
  } catch (error) {
    console.error('Update assignment error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to update assignment' }, { status: 500 })
  }
}

// DELETE - Delete assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'TUTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if assignment exists and user has permission
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      select: { creatorId: true }
    })

    if (!existingAssignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 })
    }

    if (session.user.role === 'TUTOR' && existingAssignment.creatorId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Soft delete assignment by setting isActive to false
    await prisma.assignment.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Delete assignment error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete assignment' }, { status: 500 })
  }
}

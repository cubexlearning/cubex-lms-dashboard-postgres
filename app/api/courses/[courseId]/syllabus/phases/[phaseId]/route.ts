import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

function isAdmin(role?: string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

// DELETE /api/courses/[courseId]/syllabus/phases/[phaseId] - Delete a phase
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; phaseId: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { courseId, phaseId } = await params

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user?.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if phase exists and belongs to the course
    const phase = await prisma.courseSyllabusPhase.findFirst({
      where: {
        id: phaseId,
        courseId: courseId
      }
    })

    if (!phase) {
      return NextResponse.json(
        { success: false, error: 'Phase not found' },
        { status: 404 }
      )
    }

    // Delete the phase (this will cascade delete all items in the phase)
    await prisma.courseSyllabusPhase.delete({
      where: { id: phaseId }
    })

    return NextResponse.json({
      success: true,
      message: 'Phase deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting phase:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete phase' },
      { status: 500 }
    )
  }
}

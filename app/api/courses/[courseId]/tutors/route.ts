import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

export const runtime = 'nodejs'

function isAdmin(role?: string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

const updateTutorsSchema = z.object({
  tutorIds: z.array(z.string()),
  primaryTutorId: z.string().optional()
})

// GET /api/courses/[courseId]/tutors - Get course tutors
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        courseTutors: {
          include: {
            tutor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                qualifications: true,
                experience: true,
                specializations: true,
                hourlyRate: true,
              }
            }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: course.courseTutors
    })

  } catch (error) {
    console.error('Error fetching course tutors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course tutors' },
      { status: 500 }
    )
  }
}

// PUT /api/courses/[courseId]/tutors - Update course tutors
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { courseId } = await params

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user?.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tutorIds, primaryTutorId } = updateTutorsSchema.parse(body)

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

    // Validate that primary tutor is in the selected tutors
    if (primaryTutorId && !tutorIds.includes(primaryTutorId)) {
      return NextResponse.json(
        { success: false, error: 'Primary tutor must be selected' },
        { status: 400 }
      )
    }

    // Remove existing tutor relationships
    await prisma.courseTutor.deleteMany({
      where: { courseId: courseId }
    })

    // Create new tutor relationships
    if (tutorIds.length > 0) {
      await prisma.courseTutor.createMany({
        data: tutorIds.map((tutorId) => ({
          courseId: courseId,
          tutorId: tutorId,
          isPrimary: tutorId === primaryTutorId,
          specialization: 'General',
          canTeachOneToOne: true,
          canTeachGroup: true,
        }))
      })
    }

    // Fetch updated course with tutors
    const updatedCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        courseTutors: {
          include: {
            tutor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                qualifications: true,
                experience: true,
                specializations: true,
                hourlyRate: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCourse?.courseTutors || [],
      message: 'Tutors updated successfully'
    })

  } catch (error) {
    console.error('Error updating course tutors:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update course tutors' },
      { status: 500 }
    )
  }
}

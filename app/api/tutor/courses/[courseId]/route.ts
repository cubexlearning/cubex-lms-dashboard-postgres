import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/courses/[courseId] - Get specific course details for tutor
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

    // Get course details with tutor verification
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        courseTutors: {
          some: {
            tutorId: session.user.id
          }
        }
      },
      include: {
        category: true,
        curriculum: true,
        courseFormat: true,
        courseType: true,
        courseTutors: {
          where: {
            tutorId: session.user.id
          },
          select: {
            isPrimary: true,
            specialization: true,
            canTeachOneToOne: true,
            canTeachGroup: true,
          }
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            syllabusPhases: true,
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found or not assigned to you' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: course
    })

  } catch (error) {
    console.error('Error fetching tutor course details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course details' },
      { status: 500 }
    )
  }
}

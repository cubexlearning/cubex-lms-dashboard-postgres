import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/courses/[courseId] - Get course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await ensurePrismaConnected()
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { courseId } = await params
    
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        curriculum: true,
        courseFormat: true,
        courseType: true,
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
        lessons: true,
        assignments: true,
        sessions: {
          include: {
            attendance: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
            assignments: true,
            sessions: true,
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
      data: course
    })

  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

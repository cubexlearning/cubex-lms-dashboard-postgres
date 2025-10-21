import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/courses/[courseId]/students - Get students for a specific course
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || '' // Don't filter by status by default

    // Debug: Log the course ID and status filter
    console.log('Fetching students for course:', courseId)
    console.log('Status filter:', status || 'ALL')

    // Build where clause for enrollments
    const where: any = {
      courseId: courseId
    }
    
    // Only add status filter if explicitly provided
    if (status) {
      where.status = status.toUpperCase()
    }
    
    if (search) {
      where.student = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }]
      }
    }

    // Debug: Check all enrollments for this course first
    const allEnrollments = await prisma.enrollment.findMany({
      where: {
        courseId: courseId
      },
      select: {
        id: true,
        studentId: true,
        status: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('All enrollments for course:', allEnrollments)

    // Get enrollments with student data
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true}
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    })

    console.log('Filtered enrollments:', enrollments.length)

    // Get additional stats for each student
    const studentsWithStats = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get attendance rate
        const totalSessions = await prisma.classSession.count({
          where: {
            courseId: courseId,
            status: { in: ['COMPLETED', 'CANCELLED'] }
          }
        })

        const attendedSessions = await prisma.attendanceRecord.count({
          where: {
            studentId: enrollment.studentId,
            session: {
              courseId: courseId,
              status: 'COMPLETED'
            },
            status: 'PRESENT'
          }
        })

        const attendanceRate = totalSessions > 0 
          ? Math.round((attendedSessions / totalSessions) * 100) 
          : 0

        // Get assignment completion
        const totalAssignments = await prisma.assignment.count({
          where: {
            courseId: courseId
          }
        })

        const completedAssignments = await prisma.assignmentSubmission.count({
          where: {
            studentId: enrollment.studentId,
            assignment: {
              courseId: courseId
            },
            status: { in: ['COMPLETED', 'GRADED'] }
          }
        })

        // Get last activity
        const lastAttendance = await prisma.attendanceRecord.findFirst({
          where: {
            studentId: enrollment.studentId,
            session: {
              courseId: courseId
            }
          },
          orderBy: {
            markedAt: 'desc'
          },
          include: {
            session: {
              select: {
                scheduledAt: true
              }
            }
          }
        })

        return {
          id: enrollment.student.id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          avatar: enrollment.student.avatar,
          enrollment: {
            id: enrollment.id,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt.toISOString(),
            progress: Math.round((completedAssignments / Math.max(totalAssignments, 1)) * 100)
          },
          attendanceRate,
          completedAssignments,
          totalAssignments,
          lastActivity: lastAttendance?.session?.scheduledAt?.toISOString()
        }
      })
    )

    console.log('Final students count:', studentsWithStats.length)

    return NextResponse.json({
      success: true,
      data: studentsWithStats
    })

  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

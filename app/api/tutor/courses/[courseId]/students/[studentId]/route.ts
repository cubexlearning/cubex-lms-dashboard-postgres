import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/courses/[courseId]/students/[studentId] - Get specific student details
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

    // Get student enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: courseId,
        studentId: studentId
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true}
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Student not enrolled in this course' },
        { status: 404 }
      )
    }

    // Get attendance rate
    const totalSessions = await prisma.classSession.count({
      where: {
        courseId: courseId,
        status: { in: ['COMPLETED', 'CANCELLED'] }
      }
    })

    const attendedSessions = await prisma.attendanceRecord.count({
      where: {
        studentId: studentId,
        session: {
          courseId: courseId,
          status: 'COMPLETED'
        },
        status: 'PRESENT'
      }
    })

    const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0

    // Get assignment stats
    const totalAssignments = await prisma.assignment.count({
      where: {
        courseId: courseId
      }
    })

    const completedAssignments = await prisma.assignmentSubmission.count({
      where: {
        studentId: studentId,
        assignment: {
          courseId: courseId
        }}
    })

    // Get last activity
    const lastSession = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: studentId,
        session: {
          courseId: courseId
        }
      },
      orderBy: {
        markedAt: "desc"
      },
      include: {
        session: {
          select: {
            scheduledAt: true
          }
        }
      }
    })

    const lastAssignment = await prisma.assignmentSubmission.findFirst({
      where: {
        studentId: studentId,
        assignment: {
          courseId: courseId
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    let lastActivity = null
    if (lastSession && lastAssignment) {
      lastActivity = new Date(lastSession.session.scheduledAt) > new Date(lastAssignment.submittedAt) 
        ? lastSession.session.scheduledAt 
        : lastAssignment.submittedAt
    } else if (lastSession) {
      lastActivity = lastSession.session.scheduledAt
    } else if (lastAssignment) {
      lastActivity = lastAssignment.submittedAt
    }

    const studentData = {
      id: enrollment.student.id,
      name: enrollment.student.name,
      email: enrollment.student.email,
      avatar: enrollment.student.avatar,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        progress: 0 // TODO: Calculate actual progress based on syllabus completion
      },
      lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
      attendanceRate,
      completedAssignments,
      totalAssignments
    }

    return NextResponse.json({
      success: true,
      data: studentData
    })

  } catch (error) {
    console.error('Error fetching student details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student details' },
      { status: 500 }
    )
  }
}

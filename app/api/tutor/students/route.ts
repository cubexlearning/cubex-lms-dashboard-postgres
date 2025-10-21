import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/students - Get all students from all courses assigned to tutor
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TUTOR') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const courseId = searchParams.get('courseId') || ''

    // Get all courses assigned to this tutor
    const assignedCourses = await prisma.courseTutor.findMany({
      where: {
        tutorId: session.user.id
      },
      select: {
        courseId: true
      }
    })

    const courseIds = assignedCourses.map(ct => ct.courseId)

    if (courseIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Build where clause for enrollments
    const where: any = {
      courseId: { in: courseIds }
    }
    
    if (search) {
      where.student = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }]
      }
    }
    
    if (status) {
      where.status = status.toUpperCase()
    }

    if (courseId) {
      where.courseId = courseId
    }

    // Get enrollments with student and course data
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true}
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    })

    // Group enrollments by student
    const studentsMap = new Map()

    for (const enrollment of enrollments) {
      const studentId = enrollment.student.id
      
      if (!studentsMap.has(studentId)) {
        // Get overall stats for this student across all courses
        const totalSessions = await prisma.classSession.count({
          where: {
            courseId: { in: courseIds },
            status: { in: ['COMPLETED', 'CANCELLED'] }
          }
        })

        const attendedSessions = await prisma.attendanceRecord.count({
          where: {
            studentId: studentId,
            session: {
              courseId: { in: courseIds },
              status: 'COMPLETED'
            },
            status: 'PRESENT'
          }
        })

        const totalAttendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0

        const totalAssignments = await prisma.assignment.count({
          where: {
            courseId: { in: courseIds }
          }
        })

        const completedAssignments = await prisma.assignmentSubmission.count({
          where: {
            studentId: studentId,
            assignment: {
              courseId: { in: courseIds }
            }}
        })

        // Get last activity
        const lastSession = await prisma.attendanceRecord.findFirst({
          where: {
            studentId: studentId,
            session: {
              courseId: { in: courseIds }
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
              courseId: { in: courseIds }
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

        studentsMap.set(studentId, {
          id: enrollment.student.id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          avatar: enrollment.student.avatar,
          courses: [],
          totalAttendanceRate,
          totalCompletedAssignments: completedAssignments,
          totalAssignments,
          lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null
        })
      }

      // Add this enrollment to the student's courses
      const student = studentsMap.get(studentId)
      student.courses.push({
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        enrollmentId: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        progress: 0 // TODO: Calculate actual progress based on syllabus completion
      })
    }

    const students = Array.from(studentsMap.values())

    return NextResponse.json({
      success: true,
      data: students
    })

  } catch (error) {
    console.error('Error fetching tutor students:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

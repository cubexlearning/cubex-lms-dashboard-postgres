import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

export const runtime = 'nodejs'

const markAttendanceSchema = z.object({
  studentId: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional()
})

// POST /api/tutor/courses/[courseId]/sessions/[sessionId]/attendance - Mark attendance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; sessionId: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { courseId, sessionId } = await params

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

    // Verify session belongs to this course
    const classSession = await prisma.classSession.findFirst({
      where: {
        id: sessionId,
        courseId: courseId
      }
    })

    if (!classSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = markAttendanceSchema.parse(body)

    // Check if student is enrolled in this course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: validatedData.studentId,
        courseId: courseId,
        status: 'ACTIVE'
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Student not enrolled in this course' },
        { status: 404 }
      )
    }

    // Create or update attendance record
    const attendanceRecord = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentId: {
          sessionId: sessionId,
          studentId: validatedData.studentId
        }
      },
      update: {
        status: validatedData.status,
        checkInTime: validatedData.checkInTime ? new Date(validatedData.checkInTime) : null,
        checkOutTime: validatedData.checkOutTime ? new Date(validatedData.checkOutTime) : null,
        notes: validatedData.notes,
        markedBy: session.user.id
      },
      create: {
        sessionId: sessionId,
        studentId: validatedData.studentId,
        status: validatedData.status,
        checkInTime: validatedData.checkInTime ? new Date(validatedData.checkInTime) : null,
        checkOutTime: validatedData.checkOutTime ? new Date(validatedData.checkOutTime) : null,
        notes: validatedData.notes,
        markedBy: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      data: attendanceRecord,
      message: 'Attendance marked successfully'
    })

  } catch (error) {
    console.error('Error marking attendance:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}

// GET /api/tutor/courses/[courseId]/sessions/[sessionId]/attendance - Get session attendance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; sessionId: string }> }
) {
  try {
    await ensurePrismaConnected()
    const { courseId, sessionId } = await params

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

    // Get session with attendance records
    const classSession = await prisma.classSession.findFirst({
      where: {
        id: sessionId,
        courseId: courseId
      },
      include: {
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    if (!classSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get all enrolled students for this course
    const enrolledStudents = await prisma.enrollment.findMany({
      where: {
        courseId: courseId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // Create attendance data for all students
    const attendanceData = enrolledStudents.map(enrollment => {
      const attendanceRecord = classSession.attendance.find(
        record => record.studentId === enrollment.student.id
      )

      return {
        id: enrollment.student.id,
        name: enrollment.student.name,
        email: enrollment.student.email,
        avatar: enrollment.student.avatar,
        currentAttendance: attendanceRecord ? {
          status: attendanceRecord.status,
          checkInTime: attendanceRecord.checkInTime?.toISOString(),
          checkOutTime: attendanceRecord.checkOutTime?.toISOString(),
          notes: attendanceRecord.notes
        } : null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: classSession.id,
          title: classSession.title,
          scheduledAt: classSession.scheduledAt.toISOString(),
          duration: classSession.duration,
          status: classSession.status
        },
        students: attendanceData
      }
    })

  } catch (error) {
    console.error('Error fetching session attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance data' },
      { status: 500 }
    )
  }
}

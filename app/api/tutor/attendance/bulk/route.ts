import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

export const runtime = 'nodejs'

const bulkAttendanceSchema = z.object({
  date: z.string(),
  courseId: z.string(),
  attendance: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['present', 'absent', 'late', 'excused']),
    activity: z.string().optional(),
    remarks: z.string().optional(),
    absenceReason: z.string().optional(),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional()
  }))
})

// GET /api/tutor/attendance/bulk - Get existing attendance for a date
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
    const courseId = searchParams.get('courseId')
    const date = searchParams.get('date')

    if (!courseId || !date) {
      return NextResponse.json(
        { success: false, error: 'Course ID and date are required' },
        { status: 400 }
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

    // FIXED: Use exact date matching to prevent cross-date data leakage
    const sessionDate = new Date(date)
    const year = sessionDate.getFullYear()
    const month = sessionDate.getMonth()
    const day = sessionDate.getDate()
    
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0)
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999)

    console.log('Looking for session between:', startOfDay, 'and', endOfDay, 'for date:', date)

    const classSession = await prisma.classSession.findFirst({
      where: {
        courseId: courseId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    if (!classSession) {
      console.log('No session found for date:', date)
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    console.log('Found session:', classSession.id, 'with status:', classSession.status)

    // Get attendance records for this session
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        sessionId: classSession.id
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('Found attendance records:', attendanceRecords.length)

    // Get related activity and absence data
    const studentActivities = await prisma.studentActivity.findMany({
      where: {
        sessionId: classSession.id
      }
    })

    const studentAbsences = await prisma.studentAbsence.findMany({
      where: {
        sessionId: classSession.id
      }
    })

    const formattedAttendance = attendanceRecords.map(record => {
      // Find related activity for this student
      const activity = studentActivities.find(a => a.studentId === record.studentId)
      
      // Find related absence reason for this student
      const absence = studentAbsences.find(a => a.studentId === record.studentId)

      return {
        studentId: record.studentId,
        studentName: record.student.name,
        studentEmail: record.student.email,
        status: record.status.toLowerCase(),
        activity: activity?.activity || '',
        remarks: record.notes || '',
        absenceReason: absence?.reason || '',
        checkInTime: record.checkInTime?.toISOString() || '',
        checkOutTime: record.checkOutTime?.toISOString() || '',
        markedAt: record.markedAt.toISOString()
      }
    })

    console.log('Formatted attendance data for date:', date, ':', formattedAttendance)

    return NextResponse.json({
      success: true,
      data: formattedAttendance
    })

  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

// POST /api/tutor/attendance/bulk - Bulk mark attendance
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { date, courseId, attendance, cancelReason, holidayReason } = body

    if (!date || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Date and course ID are required' },
        { status: 400 }
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

    // Handle class cancellation
    if (cancelReason) {
      const sessionDate = new Date(date)
      const year = sessionDate.getFullYear()
      const month = sessionDate.getMonth()
      const day = sessionDate.getDate()
      const scheduledAt = new Date(year, month, day, 9, 0, 0, 0)
      
      // Check if session already exists
      const existingSession = await prisma.classSession.findFirst({
        where: {
          courseId: courseId,
          scheduledAt: {
            gte: new Date(year, month, day, 0, 0, 0, 0),
            lte: new Date(year, month, day, 23, 59, 59, 999)
          }
        }
      })

      let classSession
      if (existingSession) {
        // Update existing session
        classSession = await prisma.classSession.update({
          where: { id: existingSession.id },
          data: {
            status: 'CANCELLED',
            notes: cancelReason
          }
        })
      } else {
        // Create new cancelled session
        classSession = await prisma.classSession.create({
          data: {
            courseId: courseId,
            scheduledAt: scheduledAt,
            duration: 60,
            type: 'GROUP',
            status: 'CANCELLED',
            notes: cancelReason,
            tutorId: session.user.id,
            title: 'Cancelled Session'
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Class cancelled successfully',
        sessionId: classSession.id
      })
    }

    // Handle holiday marking
    if (holidayReason) {
      const sessionDate = new Date(date)
      const year = sessionDate.getFullYear()
      const month = sessionDate.getMonth()
      const day = sessionDate.getDate()
      const scheduledAt = new Date(year, month, day, 9, 0, 0, 0)

      const existingSession = await prisma.classSession.findFirst({
        where: {
          courseId: courseId,
          scheduledAt: {
            gte: new Date(year, month, day, 0, 0, 0, 0),
            lte: new Date(year, month, day, 23, 59, 59, 999)
          }
        }
      })

      let classSession
      if (existingSession) {
        classSession = await prisma.classSession.update({
          where: { id: existingSession.id },
          data: {
            status: 'CANCELLED',
            notes: holidayReason,
            title: 'Holiday'
          }
        })
      } else {
        classSession = await prisma.classSession.create({
          data: {
            courseId: courseId,
            scheduledAt: scheduledAt,
            duration: 60,
            type: 'GROUP',
            status: 'CANCELLED',
            notes: holidayReason,
            tutorId: session.user.id,
            title: 'Holiday'
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Day marked as holiday successfully',
        sessionId: classSession.id
      })
    }

    // Handle attendance marking
    if (!attendance || !Array.isArray(attendance)) {
      return NextResponse.json(
        { success: false, error: 'Attendance data is required' },
        { status: 400 }
      )
    }

    // Validate attendance data
    const validatedAttendance = attendance.map((record: any) => ({
      studentId: record.studentId,
      status: record.status,
      activity: record.activity || '',
      remarks: record.remarks || '',
      absenceReason: record.absenceReason || '',
      checkInTime: record.checkInTime ? new Date(record.checkInTime) : null,
      checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : null
    }))

    // Create or get session for this date
    const sessionDate = new Date(date)
    const year = sessionDate.getFullYear()
    const month = sessionDate.getMonth()
    const day = sessionDate.getDate()
    const scheduledAt = new Date(year, month, day, 9, 0, 0, 0)
    
    // Check if session already exists
    const existingSession = await prisma.classSession.findFirst({
      where: {
        courseId: courseId,
        scheduledAt: {
          gte: new Date(year, month, day, 0, 0, 0, 0),
          lte: new Date(year, month, day, 23, 59, 59, 999)
        }
      }
    })

    let classSession
    if (existingSession) {
      // Update existing session - FIXED: Handle cancelled sessions
      const updateData: any = {
        status: 'COMPLETED'
      }
      
      // If session was cancelled, add a note about reactivation
      if (existingSession.status === 'CANCELLED') {
        updateData.notes = `Session reactivated from cancelled state. Original cancellation: ${existingSession.notes || 'No reason provided'}`
      }
      
      classSession = await prisma.classSession.update({
        where: { id: existingSession.id },
        data: updateData
      })
    } else {
      // Create new session
      classSession = await prisma.classSession.create({
        data: {
          courseId: courseId,
          scheduledAt: scheduledAt,
          duration: 60,
          type: 'GROUP',
          status: 'COMPLETED',
          tutorId: session.user.id,
          title: 'Class Session'
        }
      })
    }

    // Delete existing attendance records for this session
    await prisma.attendanceRecord.deleteMany({
      where: {
        sessionId: classSession.id
      }
    })

    // Delete existing activities and absences
    await prisma.studentActivity.deleteMany({
      where: {
        sessionId: classSession.id
      }
    })

    await prisma.studentAbsence.deleteMany({
      where: {
        sessionId: classSession.id
      }
    })

    // Create new attendance records
    const attendanceRecords = await Promise.all(
      validatedAttendance.map(async (record) => {
        const attendanceRecord = await prisma.attendanceRecord.create({
          data: {
            sessionId: classSession.id,
            studentId: record.studentId,
            status: record.status.toUpperCase(),
            notes: record.remarks,
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            markedAt: new Date(),
            markedBy: session.user.id
          }
        })

        // Create activity record if present/late
        if ((record.status === 'present' || record.status === 'late') && record.activity) {
          await prisma.studentActivity.create({
            data: {
              studentId: record.studentId,
              sessionId: classSession.id,
              activity: record.activity,
              status: 'COMPLETED',
              remarks: record.remarks,
              createdBy: session.user.id
            }
          })
        }

        // Create absence record if absent
        if (record.status === 'absent' && record.absenceReason) {
          await prisma.studentAbsence.create({
            data: {
              studentId: record.studentId,
              sessionId: classSession.id,
              reason: record.absenceReason,
              status: 'APPROVED',
              createdBy: session.user.id
            }
          })
        }

        return attendanceRecord
      })
    )

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      records: attendanceRecords.length
    })

  } catch (error) {
    console.error('Error marking attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}
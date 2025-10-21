import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/courses/[courseId]/students/[studentId]/attendance - Get student attendance history
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

    // Get attendance records
    const attendance = await prisma.attendanceRecord.findMany({
      where: {
        studentId: studentId,
        session: {
          courseId: courseId
        }
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            status: true
          }
        }
      },
      orderBy: {
        markedAt: "desc"
      }
    })

    const formattedRecords = attendance.map(record => ({
      id: record.id,
      sessionId: record.sessionId,
      status: record.status,
      checkInTime: record.checkInTime?.toISOString(),
      checkOutTime: record.checkOutTime?.toISOString(),
      notes: record.notes,
      session: {
        title: record.session.title,
        scheduledAt: record.session.scheduledAt.toISOString(),
        status: record.session.status
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedRecords
    })

  } catch (error) {
    console.error('Error fetching student attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

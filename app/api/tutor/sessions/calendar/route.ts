import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/sessions/calendar - Get calendar events for tutor
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
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const courseId = searchParams.get('courseId')

    // Build where clause
    const where: any = {
      course: {
        courseTutors: {
          some: {
            tutorId: session.user.id
          }
        }
      }
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (startDate && endDate) {
      where.scheduledAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Get sessions with related data
    const sessions = await prisma.classSession.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        },
        attendance: {
          select: {
            status: true
          }
        },
        _count: {
          select: {
            attendance: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    // Calculate attendance rate for each session
    const events = sessions.map(session => {
      const totalRecords = session._count.attendance
      const presentRecords = session.attendance.filter(record => 
        record.status === 'PRESENT'
      ).length
      const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

      const startDate = new Date(session.scheduledAt)
      // Ensure the session doesn't span across days by capping duration
      const maxDuration = 24 * 60 // 24 hours in minutes
      const actualDuration = Math.min(session.duration, maxDuration)
      const endDate = new Date(startDate.getTime() + (actualDuration * 60000))

      return {
        id: session.id,
        title: session.title,
        start: startDate,
        end: endDate,
        resource: {
          courseId: session.courseId,
          courseName: session.course.title,
          studentCount: session._count.attendance,
          attendanceRate,
          status: session.status.toLowerCase().replace('_', '-')
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: events
    })

  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}

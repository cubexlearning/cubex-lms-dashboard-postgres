import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/stats - Get tutor statistics
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

    const tutorId = session.user.id

    // Get upcoming sessions (this week)
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    const upcomingSessions = await prisma.classSession.count({
      where: {
        course: {
          courseTutors: {
            some: {
              tutorId: tutorId
            }
          }
        },
        scheduledAt: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    })

    // Get completed sessions (this month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const endOfMonth = new Date()
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 1)
    endOfMonth.setHours(0, 0, 0, 0)

    const completedSessions = await prisma.classSession.count({
      where: {
        course: {
          courseTutors: {
            some: {
              tutorId: tutorId
            }
          }
        },
        status: 'COMPLETED',
        endedAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        upcomingSessions,
        completedSessions
      }
    })

  } catch (error) {
    console.error('Error fetching tutor stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

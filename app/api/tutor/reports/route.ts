export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

function getRange(range: string) {
  const now = new Date()
  const start = new Date(now)
  switch (range) {
    case 'last_7_days':
      start.setDate(start.getDate() - 7)
      break
    case 'this_quarter': {
      const month = start.getMonth()
      const qStartMonth = Math.floor(month / 3) * 3
      start.setMonth(qStartMonth, 1)
      start.setHours(0, 0, 0, 0)
      break
    }
    case 'this_year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      break
    case 'last_30_days':
    default:
      start.setDate(start.getDate() - 30)
      break
  }
  return { start, end: now }
}

// GET /api/tutor/reports?range=last_30_days
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'TUTOR') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'last_30_days'
    const { start, end } = getRange(range)

    // Courses assigned to this tutor
    const courses = await prisma.course.findMany({
      where: {
        courseTutors: { some: { tutorId: session.user.id } },
      },
      select: { id: true, title: true }
    })

    const courseIds = courses.map(c => c.id)
    if (courseIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Students per course
    const enrollCounts = await prisma.enrollment.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds }, status: 'ACTIVE' },
      _count: { _all: true }
    })

    // Attendance: completed sessions in range and PRESENT records
    const completedSessions = await prisma.classSession.findMany({
      where: {
        courseId: { in: courseIds },
        status: 'COMPLETED',
        endedAt: { gte: start, lte: end },
      },
      select: { id: true, courseId: true }
    })
    const sessionIds = completedSessions.map(s => s.id)

    const presentCounts = sessionIds.length
      ? await prisma.attendanceRecord.groupBy({
          by: ['sessionId'],
          where: { sessionId: { in: sessionIds }, status: 'PRESENT' },
          _count: { _all: true }
        })
      : []

    // Total expected attendance per session equals number of ACTIVE enrollments in the course at least; we approximate using active enrollments
    const enrollCountByCourse = new Map(enrollCounts.map(ec => [ec.courseId, ec._count._all]))
    const sessionsByCourse = new Map<string, string[]>()
    for (const s of completedSessions) {
      const list = sessionsByCourse.get(s.courseId) || []
      list.push(s.id)
      sessionsByCourse.set(s.courseId, list)
    }
    const presentBySession = new Map(presentCounts.map(pc => [pc.sessionId, pc._count._all]))

    // Average assignment score (graded) within range window by submission time
    const graded = await prisma.assignmentSubmission.groupBy({
      by: ['assignmentId'],
      where: {
        assignment: { courseId: { in: courseIds } },
        isGraded: true,
        gradedAt: { gte: start, lte: end },
      },
      _avg: { score: true },
      _count: { _all: true }
    })

    // Need mapping from assignmentId to courseId
    const assignmentCourseMap = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true, courseId: true }
    })
    const assignmentToCourse = new Map(assignmentCourseMap.map(a => [a.id, a.courseId]))

    const avgScoreByCourse = new Map<string, { total: number; count: number }>()
    for (const g of graded) {
      const courseId = assignmentToCourse.get(g.assignmentId)
      if (!courseId) continue
      const current = avgScoreByCourse.get(courseId) || { total: 0, count: 0 }
      const avg = g._avg.score ?? 0
      current.total += avg
      current.count += 1
      avgScoreByCourse.set(courseId, current)
    }

    const rows = courses.map(c => {
      const students = enrollCountByCourse.get(c.id) || 0
      const sessions = sessionsByCourse.get(c.id) || []
      const totalExpected = sessions.reduce((sum, sid) => sum + (enrollCountByCourse.get(c.id) || 0), 0)
      const totalPresent = sessions.reduce((sum, sid) => sum + (presentBySession.get(sid) || 0), 0)
      const attendanceRate = totalExpected > 0 ? totalPresent / totalExpected : 0

      const scoreAgg = avgScoreByCourse.get(c.id)
      const avgAssignmentScore = scoreAgg && scoreAgg.count > 0 ? scoreAgg.total / scoreAgg.count : 0

      return {
        courseId: c.id,
        courseTitle: c.title,
        totalStudents: students,
        attendanceRate,
        avgAssignmentScore,
      }
    })

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error('GET /api/tutor/reports error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate reports' }, { status: 500 })
  }
}



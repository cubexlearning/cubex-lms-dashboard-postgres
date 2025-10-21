import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'

export const runtime = 'nodejs'

// GET /api/debug/enrollments - Debug enrollment statuses
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Get all enrollments for this course with their statuses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: courseId
      },
      select: {
        id: true,
        studentId: true,
        status: true,
        enrolledAt: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Group by status
    const statusCounts = enrollments.reduce((acc, enrollment) => {
      acc[enrollment.status] = (acc[enrollment.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        courseId,
        totalEnrollments: enrollments.length,
        statusCounts,
        enrollments: enrollments.map(e => ({
          id: e.id,
          studentName: e.student.name,
          studentEmail: e.student.email,
          status: e.status,
          enrolledAt: e.enrolledAt
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching enrollment debug data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollment data' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/student/courses - current student's enrollments with course info
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: session.user.id,
        course: search
          ? { title: { contains: search, mode: 'insensitive' } }
          : undefined,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            shortDescription: true,
            status: true,
            category: { select: { name: true } },
            courseFormat: { select: { name: true } },
            _count: { select: { enrollments: true, syllabusPhases: true } },
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    })

    const data = enrollments
      .filter(e => e.course)
      .map(e => ({
        enrollmentId: e.id,
        course: e.course!,
        enrolledAt: e.enrolledAt,
        status: e.status,
      }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching student courses:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch courses' }, { status: 500 })
  }
}



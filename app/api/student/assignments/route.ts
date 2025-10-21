import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET - Get assignments for current student
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get student's enrollments to find relevant assignments
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        studentId: session.user.id,
        status: 'ACTIVE'
      },
      select: { courseId: true }
    })

    const courseIds = enrollments.map(e => e.courseId)

    const where: any = {
      isActive: true,
      OR: [
        { targetType: 'ALL_STUDENTS' },
        { targetType: 'COURSES', targetCourseIds: { hasSome: courseIds } },
        { targetType: 'SELECTED_INDIVIDUALS', targetStudentIds: { has: session.user.id } }
      ]
    }

    if (status) {
      where.submissions = {
        some: {
          studentId: session.user.id,
          status: status.toUpperCase()
        }
      }
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { id: true, title: true }
        },
        submissions: {
          where: { studentId: session.user.id },
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.assignment.count({ where })

    return NextResponse.json({ 
      success: true, 
      data: { 
        assignments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      } 
    })
  } catch (error) {
    console.error('Get student assignments error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

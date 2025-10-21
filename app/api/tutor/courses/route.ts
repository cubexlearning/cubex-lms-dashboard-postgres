import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/tutor/courses - Get courses assigned to the current tutor
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
    const rawStatus = searchParams.get('status') || ''
    // Normalize status to match Prisma enum values if provided
    const status = rawStatus ? rawStatus.toUpperCase() : ''

    // Build where clause
    const where: any = {
      courseTutors: {
        some: {
          tutorId: session.user.id
        }
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (status) {
      // Accept only known statuses; ignore invalid values to prevent errors
      const allowedStatuses = new Set(['PUBLISHED', 'DRAFT', 'ARCHIVED'])
      if (allowedStatuses.has(status)) {
        where.status = status
      }
    }

    // Get courses assigned to this tutor
    const courses = await prisma.course.findMany({
      where,
      include: {
        category: true,
        curriculum: true,
        courseFormat: true,
        courseType: true,
        courseTutors: {
          where: {
            tutorId: session.user.id
          },
          select: {
            isPrimary: true,
            specialization: true,
            canTeachOneToOne: true,
            canTeachGroup: true,
          }
        },
        enrollments: {
          select: {
            id: true,
            status: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
            syllabusPhases: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      success: true,
      data: courses
    })

  } catch (error) {
    console.error('Error fetching tutor courses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

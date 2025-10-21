import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

export const runtime = 'nodejs'

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  attachments: z.array(z.string()).default([]),
  dueDate: z.string().transform(str => new Date(str)),
  maxPoints: z.number().min(1).max(1000).default(100),
  assignmentType: z.enum(['REGULAR', 'PROJECT', 'QUIZ', 'PEER_REVIEW', 'GROUP_WORK']).default('REGULAR'),
  targetType: z.enum(['ALL_STUDENTS', 'COURSES', 'SELECTED_INDIVIDUALS']),
  targetCourseIds: z.array(z.string()).default([]),
  targetStudentIds: z.array(z.string()).default([]),
  allowLate: z.boolean().default(false),
  latePenalty: z.number().min(0).max(100).optional(),
  expectedSubmissionTypes: z.array(z.enum(['TEXT','GITHUB_URL','LIVE_URL','GOOGLE_DRIVE_URL','MULTIPLE_TYPES'])).optional(),
  courseId: z.string().optional()
})

// GET - List assignments
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {
      isActive: true // Only show active assignments by default
    }
    
    if (courseId) {
      where.courseId = courseId
    }
    
    if (status) {
      where.isActive = status === 'active'
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // If user is a tutor, only show assignments they created
    if (session.user.role === 'TUTOR') {
      where.creatorId = session.user.id
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
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' },
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
    console.error('Get assignments error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

// POST - Create assignment
export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'TUTOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAssignmentSchema.parse(body)

    // Validate targeting
    if (validatedData.targetType === 'COURSES' && validatedData.targetCourseIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'At least one course must be selected for course targeting' 
      }, { status: 400 })
    }

    if (validatedData.targetType === 'SELECTED_INDIVIDUALS' && validatedData.targetStudentIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'At least one student must be selected for individual targeting' 
      }, { status: 400 })
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        attachments: validatedData.attachments,
        dueDate: validatedData.dueDate,
        maxPoints: validatedData.maxPoints,
        assignmentType: validatedData.assignmentType,
        targetType: validatedData.targetType,
        targetCourseIds: validatedData.targetCourseIds,
        targetStudentIds: validatedData.targetStudentIds,
        allowLate: validatedData.allowLate,
        latePenalty: validatedData.latePenalty,
        courseId: validatedData.courseId || null,
        expectedSubmissionTypes: validatedData.expectedSubmissionTypes || [],
        creatorId: session.user.id
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { id: true, title: true }
        }
      }
    })

    // Create assignment submissions for targeted students
    let targetStudentIds: string[] = []

    if (validatedData.targetType === 'ALL_STUDENTS') {
      const allStudents = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true }
      })
      targetStudentIds = allStudents.map(s => s.id)
    } else if (validatedData.targetType === 'COURSES') {
      const enrollments = await prisma.enrollment.findMany({
        where: { 
          courseId: { in: validatedData.targetCourseIds },
          status: 'ACTIVE'
        },
        select: { studentId: true }
      })
      targetStudentIds = [...new Set(enrollments.map(e => e.studentId))]
    } else if (validatedData.targetType === 'SELECTED_INDIVIDUALS') {
      targetStudentIds = validatedData.targetStudentIds
    }

    // Create pending submissions for all targeted students
    if (targetStudentIds.length > 0) {
      await prisma.assignmentSubmission.createMany({
        data: targetStudentIds.map(studentId => ({
          assignmentId: assignment.id,
          studentId,
          status: 'PENDING'
        }))
      })
    }

    return NextResponse.json({ success: true, data: assignment })
  } catch (error) {
    console.error('Create assignment error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to create assignment' }, { status: 500 })
  }
}

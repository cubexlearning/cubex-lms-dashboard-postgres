import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// GET /api/courses/[courseId] - Get course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await ensurePrismaConnected()
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { courseId } = await params
    
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        curriculum: true,
        courseFormat: true,
        courseType: true,
        courseTutors: {
          include: {
            tutor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                qualifications: true,
                experience: true,
                specializations: true,
                hourlyRate: true,
              }
            }
          }
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              }
            }
          }
        },
        lessons: true,
        assignments: true,
        sessions: {
          include: {
            attendance: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
            assignments: true,
            sessions: true,
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: course
    })

  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

// PUT /api/courses/[courseId] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    await ensurePrismaConnected()
    
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { courseId } = await params
    const body = await request.json().catch(() => ({}))

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    // Basic information
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription.trim()
    if (body.longDescription !== undefined) updateData.longDescription = body.longDescription || null
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.curriculumId !== undefined) updateData.curriculumId = body.curriculumId || null
    if (body.courseFormatId !== undefined) updateData.courseFormatId = body.courseFormatId || null
    if (body.courseTypeId !== undefined) updateData.courseTypeId = body.courseTypeId || null

    // Pricing
    if (body.oneToOnePrice !== undefined) updateData.oneToOnePrice = body.oneToOnePrice ?? null
    if (body.oneToOneOffer !== undefined) updateData.oneToOneOffer = body.oneToOneOffer ?? null
    if (body.oneToOneActive !== undefined) updateData.oneToOneActive = body.oneToOneActive
    if (body.groupPrice !== undefined) updateData.groupPrice = body.groupPrice ?? null
    if (body.groupOffer !== undefined) updateData.groupOffer = body.groupOffer ?? null
    if (body.groupActive !== undefined) updateData.groupActive = body.groupActive
    if (body.maxGroupSize !== undefined) updateData.maxGroupSize = body.maxGroupSize ?? null
    if (body.minGroupSize !== undefined) updateData.minGroupSize = body.minGroupSize ?? null

    // Session details
    if (body.sessionDuration !== undefined) updateData.sessionDuration = body.sessionDuration ?? null
    if (body.sessionsPerWeek !== undefined) updateData.sessionsPerWeek = body.sessionsPerWeek ?? null
    if (body.totalSessions !== undefined) updateData.totalSessions = body.totalSessions ?? null

    // Requirements
    if (body.minAge !== undefined) updateData.minAge = body.minAge ?? null
    if (body.maxAge !== undefined) updateData.maxAge = body.maxAge ?? null
    if (body.prerequisiteLevel !== undefined) updateData.prerequisiteLevel = body.prerequisiteLevel || null

    // Media & Tags
    if (body.primaryImage !== undefined) updateData.primaryImage = body.primaryImage || null
    if (body.secondaryImage !== undefined) updateData.secondaryImage = body.secondaryImage || null
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl || null
    if (body.tags !== undefined) updateData.tags = body.tags || []
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty || null

    // Status
    if (body.status !== undefined) updateData.status = body.status

    // Update the course
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        category: true,
        curriculum: true,
        courseFormat: true,
        courseType: true,
        courseTutors: {
          include: {
            tutor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                qualifications: true,
                experience: true,
                specializations: true,
                hourlyRate: true,
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true,
            lessons: true,
            assignments: true,
            sessions: true,
          }
        }
      }
    })

    // Handle tutor assignments if provided
    if (body.tutorIds !== undefined && Array.isArray(body.tutorIds)) {
      // Remove all existing tutor assignments
      await prisma.courseTutor.deleteMany({
        where: { courseId }
      })

      // Add new tutor assignments
      if (body.tutorIds.length > 0) {
        const tutorAssignments = body.tutorIds.map((tutorId: string) => ({
          courseId,
          tutorId,
          isPrimary: tutorId === body.primaryTutorId,
        }))

        await prisma.courseTutor.createMany({
          data: tutorAssignments,
          skipDuplicates: true,
        })
      }

      // Fetch the updated course with tutors
      const updatedCourse = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          category: true,
          curriculum: true,
          courseFormat: true,
          courseType: true,
          courseTutors: {
            include: {
              tutor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                  qualifications: true,
                  experience: true,
                  specializations: true,
                  hourlyRate: true,
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true,
              lessons: true,
              assignments: true,
              sessions: true,
            }
          }
        }
      })

      return NextResponse.json({ success: true, data: updatedCourse })
    }

    return NextResponse.json({ success: true, data: updated })

  } catch (error: any) {
    console.error('Update course error:', error)
    
    // Handle specific Prisma errors
    if (error?.code === 'P2002') {
      const field = error.meta?.target?.[0]
      return NextResponse.json({ 
        success: false, 
        error: `A course with this ${field} already exists` 
      }, { status: 409 })
    }
    
    if (error?.code === 'P2003') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid reference to related data. Please check your selections.' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update course. Please try again.' 
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

// Helper function to generate unique slug
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  let finalSlug = baseSlug
  let counter = 1
  
  while (await prisma.course.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${counter}`
    counter++
  }
  
  return finalSlug
}

// GET - List courses
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {}
    
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (category && category !== 'all') {
      where.category = {
        slug: category
      }
    }

    // If user is a tutor, only show courses they're assigned to
    if (session.user.role === 'TUTOR') {
      where.courseTutors = {
        some: {
          tutorId: session.user.id
        }
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.course.count({ where })

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit)
    const skip = (page - 1) * limit

    const courses = await prisma.course.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    return NextResponse.json({ 
      success: true, 
      data: { 
        courses,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages
        }
      } 
    })
  } catch (error) {
    console.error('Get courses error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch courses' }, { status: 500 })
  }
}

// POST - Create course
export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    // Minimal validation; rely on DB defaults for the rest
    const title: string = (body?.title || '').toString().trim()
    const shortDescription: string = (body?.shortDescription || '').toString().trim()
    const categoryId: string | undefined = body?.categoryId
    const courseFormatId: string | undefined = body?.courseFormatId
    const courseTypeId: string | undefined = body?.courseTypeId

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }
    if (!shortDescription) {
      return NextResponse.json({ success: false, error: 'Short description is required' }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 })
    }

    // Generate unique slug
    const finalSlug = await generateUniqueSlug(title)

    const created = await prisma.course.create({
      data: {
        title,
        slug: finalSlug,
        shortDescription,
        longDescription: body?.longDescription || null,
        categoryId,
        courseFormatId: courseFormatId || null,
        courseTypeId: courseTypeId || null,
        curriculumId: body?.curriculumId || null,
        oneToOnePrice: body?.oneToOnePrice ?? null,
        oneToOneOffer: body?.oneToOneOffer ?? null,
        oneToOneActive: body?.oneToOneActive ?? true,
        groupPrice: body?.groupPrice ?? null,
        groupOffer: body?.groupOffer ?? null,
        groupActive: body?.groupActive ?? true,
        maxGroupSize: body?.maxGroupSize ?? null,
        minGroupSize: body?.minGroupSize ?? null,
        sessionDuration: body?.sessionDuration ?? null,
        sessionsPerWeek: body?.sessionsPerWeek ?? null,
        totalSessions: body?.totalSessions ?? null,
        minAge: body?.minAge ?? null,
        maxAge: body?.maxAge ?? null,
        prerequisiteLevel: body?.prerequisiteLevel || null,
        primaryImage: body?.primaryImage || null,
        secondaryImage: body?.secondaryImage || null,
        videoUrl: body?.videoUrl || null,
        tags: body?.tags || [],
        difficulty: body?.difficulty || null,
        status: (body?.status as any) || 'DRAFT',
      },
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
    if (body?.tutorIds && Array.isArray(body.tutorIds) && body.tutorIds.length > 0) {
      const tutorAssignments = body.tutorIds.map((tutorId: string) => ({
        courseId: created.id,
        tutorId: tutorId,
        isPrimary: tutorId === body?.primaryTutorId,
      }))

      await prisma.courseTutor.createMany({
        data: tutorAssignments,
        skipDuplicates: true,
      })

      // Fetch the updated course with tutors
      const updatedCourse = await prisma.course.findUnique({
        where: { id: created.id },
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

    return NextResponse.json({ success: true, data: created })
  } catch (error: any) {
    console.error('Create course error:', error)
    
    // Handle specific Prisma errors
    if (error?.code === 'P2002') {
      const field = error.meta?.target?.[0]
      if (field === 'slug') {
        return NextResponse.json({ 
          success: false, 
          error: 'A course with this title already exists. Please try a different title.' 
        }, { status: 409 })
      }
      return NextResponse.json({ 
        success: false, 
        error: `A course with this ${field} already exists` 
      }, { status: 409 })
    }
    
    // Handle validation errors
    if (error?.code === 'P2003') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid reference to related data. Please check your selections.' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create course. Please try again.' 
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for bulk actions
const bulkActionSchema = z.object({
  action: z.enum(['publish', 'archive', 'delete', 'assign-tutors']),
  courseIds: z.array(z.string()).min(1, 'At least one course must be selected'),
  tutorIds: z.array(z.string()).optional(), // For assign-tutors action
  primaryTutorId: z.string().optional(), // For assign-tutors action
})

// POST /api/courses/bulk - Handle bulk actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = bulkActionSchema.parse(body)
    
    const { action, courseIds, tutorIds, primaryTutorId } = validatedData

    let result

    switch (action) {
      case 'publish':
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: { 
            status: 'PUBLISHED',
            publishedAt: new Date()
          }
        })
        break

      case 'archive':
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: { status: 'ARCHIVED' }
        })
        break

      case 'delete':
        // Check for active enrollments
        const activeEnrollments = await prisma.enrollment.count({
          where: {
            courseId: { in: courseIds },
            status: 'ACTIVE'
          }
        })

        if (activeEnrollments > 0) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Cannot delete courses with active enrollments. Please archive instead.` 
            },
            { status: 400 }
          )
        }

        // Archive courses instead of hard delete
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: { status: 'ARCHIVED' }
        })
        break

      case 'assign-tutors':
        if (!tutorIds || tutorIds.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Tutor IDs are required for assign-tutors action' },
            { status: 400 }
          )
        }

        // Remove existing tutor relationships for selected courses
        await prisma.courseTutor.deleteMany({
          where: { courseId: { in: courseIds } }
        })

        // Create new tutor relationships
        const tutorAssignments = []
        for (const courseId of courseIds) {
          for (const tutorId of tutorIds) {
            tutorAssignments.push({
              courseId,
              tutorId,
              isPrimary: tutorId === primaryTutorId,
              specialization: tutorId === primaryTutorId ? 'Primary' : 'Secondary',
              canTeachOneToOne: true,
              canTeachGroup: true,
            })
          }
        }

        await prisma.courseTutor.createMany({
          data: tutorAssignments
        })

        result = { count: tutorAssignments.length }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Bulk ${action} completed successfully`
    })

  } catch (error) {
    console.error('Error performing bulk action:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}

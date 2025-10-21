export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

// Validation schema for enrollment update
const updateEnrollmentSchema = z.object({
  sessionCount: z.number().int().positive().optional(),
  sessionDuration: z.number().int().positive().optional(),
  preferredDays: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIAL']).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/enrollments/[id] - Get single enrollment with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: params.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            ageGroup: true,
            parentName: true,
            parentEmail: true,
            parentPhone: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            shortDescription: true,
            fullDescription: true,
            category: true,
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            method: true,
            status: true,
            dueDate: true,
            paidAt: true,
            transactionId: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            dueDate: 'asc'
          }
        },
        sessions: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            status: true,
            duration: true,
          },
          orderBy: {
            scheduledAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Calculate payment summary
    const totalPaid = enrollment.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    
    const totalPending = enrollment.payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    return NextResponse.json({
      success: true,
      data: {
        ...enrollment,
        paymentSummary: {
          totalAmount: Number(enrollment.finalPrice),
          paidAmount: totalPaid,
          pendingAmount: totalPending,
          paymentPercentage: (totalPaid / Number(enrollment.finalPrice)) * 100
        }
      }
    })

  } catch (error) {
    console.error('Error fetching enrollment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollment' },
      { status: 500 }
    )
  }
}

// PUT /api/enrollments/[id] - Update enrollment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    const body = await request.json()
    const validatedData = updateEnrollmentSchema.parse(body)

    // Check if enrollment exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { id: params.id }
    })

    if (!existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    
    if (validatedData.sessionCount !== undefined) updateData.sessionCount = validatedData.sessionCount
    if (validatedData.sessionDuration !== undefined) updateData.sessionDuration = validatedData.sessionDuration
    if (validatedData.preferredDays !== undefined) updateData.preferredDays = validatedData.preferredDays
    if (validatedData.preferredTimes !== undefined) updateData.preferredTimes = validatedData.preferredTimes
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.paymentStatus !== undefined) updateData.paymentStatus = validatedData.paymentStatus
    if (validatedData.paymentMethod !== undefined) updateData.paymentMethod = validatedData.paymentMethod

    // Update enrollment
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            shortDescription: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedEnrollment,
      message: 'Enrollment updated successfully'
    })

  } catch (error) {
    console.error('Error updating enrollment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update enrollment' },
      { status: 500 }
    )
  }
}

// DELETE /api/enrollments/[id] - Cancel enrollment (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'Cancelled by admin'

    // Check if enrollment exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { id: params.id },
      include: {
        payments: {
          where: {
            status: 'PAID'
          }
        }
      }
    })

    if (!existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Check if there are paid payments (might need refund)
    const hasPaidPayments = existingEnrollment.payments.length > 0

    // Update enrollment status to CANCELLED
    const cancelledEnrollment = await prisma.enrollment.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        // Note: In a real system, store cancellation reason in a separate field
      }
    })

    return NextResponse.json({
      success: true,
      data: cancelledEnrollment,
      message: 'Enrollment cancelled successfully',
      warning: hasPaidPayments ? 'This enrollment has paid payments. Please process refund if applicable.' : null
    })

  } catch (error) {
    console.error('Error cancelling enrollment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel enrollment' },
      { status: 500 }
    )
  }
}

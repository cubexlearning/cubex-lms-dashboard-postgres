export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

// Validation schema for payment update
const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIAL']).optional(),
  paidAt: z.string().optional(),
  transactionId: z.string().optional(),
  description: z.string().optional(),
})

// PUT /api/payments/[id] - Update a payment (e.g., mark as paid)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    const body = await request.json()
    const validatedData = updatePaymentSchema.parse(body)

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        enrollment: {
          include: {
            payments: true
          }
        }
      }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}
    
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.transactionId !== undefined) updateData.transactionId = validatedData.transactionId
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    
    // If marking as paid and paidAt not provided, use current time
    if (validatedData.status === 'PAID' && !validatedData.paidAt) {
      updateData.paidAt = new Date()
    } else if (validatedData.paidAt) {
      updateData.paidAt = new Date(validatedData.paidAt)
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: params.id },
      data: updateData
    })

    // Update enrollment payment status
    const enrollment = existingPayment.enrollment
    const allPayments = enrollment.payments.map(p => 
      p.id === params.id ? { ...p, ...updateData } : p
    )
    
    const totalPaid = allPayments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    let newPaymentStatus: any = 'PENDING'
    if (totalPaid >= Number(enrollment.finalPrice)) {
      newPaymentStatus = 'PAID'
    } else if (totalPaid > 0) {
      newPaymentStatus = 'PARTIAL'
    }

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { paymentStatus: newPaymentStatus }
    })

    return NextResponse.json({
      success: true,
      data: updatedPayment,
      message: 'Payment updated successfully'
    })

  } catch (error) {
    console.error('Error updating payment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}

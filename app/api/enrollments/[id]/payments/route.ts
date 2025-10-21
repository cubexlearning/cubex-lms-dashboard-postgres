export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

// Validation schema for payment creation
const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CASH', 'UPI', 'NET_BANKING', 'WALLET']),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIAL']).default('PENDING'),
  dueDate: z.string().optional(),
  paidAt: z.string().optional(),
  transactionId: z.string().optional(),
  description: z.string().optional(),
})

// GET /api/enrollments/[id]/payments - Get all payments for an enrollment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: params.id },
      select: { id: true }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Get all payments for this enrollment
    const payments = await prisma.payment.findMany({
      where: { enrollmentId: params.id },
      orderBy: { dueDate: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: payments
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST /api/enrollments/[id]/payments - Add a new payment to enrollment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: params.id },
      include: {
        payments: true
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        enrollmentId: params.id,
        amount: validatedData.amount,
        currency: enrollment.currency,
        method: validatedData.method,
        status: validatedData.status,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : new Date(),
        paidAt: validatedData.paidAt ? new Date(validatedData.paidAt) : null,
        transactionId: validatedData.transactionId,
        description: validatedData.description || 'Manual payment entry',
      }
    })

    // Update enrollment payment status
    const totalPaid = [...enrollment.payments, payment]
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    let newPaymentStatus: any = 'PENDING'
    if (totalPaid >= Number(enrollment.finalPrice)) {
      newPaymentStatus = 'PAID'
    } else if (totalPaid > 0) {
      newPaymentStatus = 'PARTIAL'
    }

    await prisma.enrollment.update({
      where: { id: params.id },
      data: { paymentStatus: newPaymentStatus }
    })

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment added successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating payment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

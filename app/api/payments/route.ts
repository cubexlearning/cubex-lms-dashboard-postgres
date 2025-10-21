export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'
import { getDefaultCurrency } from '@/lib/settings'

// Validation schema for payment creation
const createPaymentSchema = z.object({
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  amount: z.number().positive(),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CASH']),
  transactionId: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

// GET /api/payments - List payments with filtering
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || ''
    const method = searchParams.get('method') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (method) {
      where.method = method
    }

    // Get payments with relations
    const payments = await prisma.payment.findMany({
      where,
      skip,
      take: limit,
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            course: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get total count for pagination
    const total = await prisma.payment.count({ where })

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST /api/payments - Create new payment
export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)
    
    // Get default currency from settings
    const defaultCurrency = await getDefaultCurrency()
    
    // Create payment
    const payment = await prisma.payment.create({
      data: {
        enrollmentId: validatedData.enrollmentId,
        amount: validatedData.amount,
        currency: defaultCurrency, // Use settings currency
        method: validatedData.method,
        transactionId: validatedData.transactionId,
        description: validatedData.description,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : new Date(),
        status: 'PENDING',
      },
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            course: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment created successfully'
    })

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
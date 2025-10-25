export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'
import { getDefaultCurrency, getDefaultTimezone } from '@/lib/settings'
import { emailService } from '@/lib/email'
import { signOnboardingToken } from '@/lib/auth/onboarding'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Validation schema for enrollment creation
const createEnrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  format: z.enum(['ONE_TO_ONE', 'GROUP']),
  sessionCount: z.number().int().positive(),
  sessionDuration: z.number().int().positive(),
  
  // Pricing fields
  basePrice: z.number().positive(),
  discountType: z.enum(['PERCENTAGE', 'AMOUNT', 'NONE']).default('NONE'),
  discountValue: z.number().min(0).optional(),
  
  // Legacy support
  offerPrice: z.number().positive().optional(),
  
  paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CASH', 'UPI', 'NET_BANKING', 'WALLET']).optional(),
  preferredDays: z.array(z.string()).default([]),
  preferredTimes: z.array(z.string()).default([]),
  
  // Payment plan options
  paymentPlan: z.enum(['FULL', 'INSTALLMENTS']).default('FULL'),
  installmentCount: z.number().int().min(2).max(12).optional(),
  firstPaymentAmount: z.number().positive().optional(),
  firstPaymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CASH', 'UPI', 'NET_BANKING', 'WALLET']).optional(),
  markFirstPaymentAsPaid: z.boolean().default(false),
  transactionId: z.string().optional(),
})

// GET /api/enrollments - List enrollments with filtering
export async function GET(request: NextRequest) {
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
    
    // Check if user has permission to view enrollments (Admin or Super Admin)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const format = searchParams.get('format') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { email: { contains: search, mode: 'insensitive' } } },
        { course: { title: { contains: search, mode: 'insensitive' } } },
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (format) {
      where.format = format
    }

    // Get enrollments with relations
    const enrollments = await prisma.enrollment.findMany({
      where,
      skip,
      take: limit,
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
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            paidAt: true,
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    })

    // Get total count for pagination
    const total = await prisma.enrollment.count({ where })

    return NextResponse.json({
      success: true,
      data: enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}

// POST /api/enrollments - Create new enrollment with payment plan
export async function POST(request: NextRequest) {
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
    
    // Check if user has permission to create enrollments (Admin or Super Admin)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const validatedData = createEnrollmentSchema.parse(body)
    
    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: validatedData.studentId, role: 'STUDENT' }
    })
    
    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }
    
    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId }
    })
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }
    
    // Check for duplicate enrollment
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: validatedData.studentId,
        courseId: validatedData.courseId,
        format: validatedData.format,
        status: {
          in: ['PENDING', 'ACTIVE']
        }
      }
    })
    
    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Student is already enrolled in this course with the same format' },
        { status: 409 }
      )
    }
    
    // Get default currency, timezone, and tax rate from settings
    const [defaultCurrency, defaultTimezone, settings] = await Promise.all([
      getDefaultCurrency(),
      getDefaultTimezone(),
      prisma.institutionSettings.findFirst({ where: { isActive: true } })
    ])
    
    const taxRate = settings?.taxRate ? Number(settings.taxRate) : 0.18 // Default 18% if not found
    
    // Calculate pricing breakdown
    let discountAmount = 0
    if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountValue) {
      discountAmount = validatedData.basePrice * (validatedData.discountValue / 100)
    } else if (validatedData.discountType === 'AMOUNT' && validatedData.discountValue) {
      discountAmount = validatedData.discountValue
    }
    
    const subtotal = validatedData.basePrice - discountAmount
    const taxAmount = subtotal * taxRate
    const finalPrice = subtotal + taxAmount
    
    // Create enrollment first (avoid interactive transactions on Data Proxy)
    // Then create payment records sequentially
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
        data: {
          studentId: validatedData.studentId,
          courseId: validatedData.courseId,
          format: validatedData.format,
          sessionCount: validatedData.sessionCount,
          sessionDuration: validatedData.sessionDuration,
          
          // Pricing breakdown
          basePrice: validatedData.basePrice,
          discountType: validatedData.discountType !== 'NONE' ? validatedData.discountType : null,
          discountValue: validatedData.discountValue || null,
          discountAmount: discountAmount,
          subtotal: subtotal,
          taxRate: taxRate,
          taxAmount: taxAmount,
          finalPrice: finalPrice,
          
          // Legacy field
          offerPrice: validatedData.offerPrice,
          
          currency: defaultCurrency,
          timezone: defaultTimezone,
          preferredDays: validatedData.preferredDays,
          preferredTimes: validatedData.preferredTimes,
          status: 'PENDING',
          paymentStatus: validatedData.markFirstPaymentAsPaid ? 'PARTIAL' : 'PENDING',
          paymentMethod: validatedData.firstPaymentMethod,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              status: true,
              phone: true,
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              shortDescription: true,
              courseTutors: {
                select: {
                  isPrimary: true,
                  tutor: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    }
                  }
                }
              }
            }
          }
        }
      })

    // Create payment records based on payment plan
    const createdPayments: any[] = []
    if (validatedData.paymentPlan === 'FULL') {
      const payment = await prisma.payment.create({
        data: {
          enrollmentId: enrollment.id,
          amount: finalPrice,
          currency: defaultCurrency,
          method: validatedData.firstPaymentMethod || 'CARD',
          status: validatedData.markFirstPaymentAsPaid ? 'PAID' : 'PENDING',
          dueDate: new Date(),
          paidAt: validatedData.markFirstPaymentAsPaid ? new Date() : null,
          transactionId: validatedData.transactionId,
          description: 'Full payment for enrollment',
        }
      })
      createdPayments.push(payment)
    } else if (validatedData.paymentPlan === 'INSTALLMENTS') {
      const installmentCount = validatedData.installmentCount || 3
      const installmentAmount = finalPrice / installmentCount
      for (let i = 0; i < installmentCount; i++) {
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + (i * 30))
        const isFirstPayment = i === 0
        const payment = await prisma.payment.create({
          data: {
            enrollmentId: enrollment.id,
            amount: installmentAmount,
            currency: defaultCurrency,
            method: isFirstPayment ? (validatedData.firstPaymentMethod || 'CARD') : 'CARD',
            status: (isFirstPayment && validatedData.markFirstPaymentAsPaid) ? 'PAID' : 'PENDING',
            dueDate: dueDate,
            paidAt: (isFirstPayment && validatedData.markFirstPaymentAsPaid) ? new Date() : null,
            transactionId: (isFirstPayment && validatedData.transactionId) ? validatedData.transactionId : null,
            description: `Installment ${i + 1} of ${installmentCount}`,
          }
        })
        createdPayments.push(payment)
      }
    }

    const result = { enrollment, payments: createdPayments, student, course }

    // Note: Onboarding email is sent when student is created via /api/students
    // No need to send duplicate email here for new students
    // For existing students, they already have onboarding access

    return NextResponse.json({
      success: true,
      data: result.enrollment,
      payments: result.payments,
      message: 'Enrollment created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating enrollment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create enrollment' },
      { status: 500 }
    )
  }
}
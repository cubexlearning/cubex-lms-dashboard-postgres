export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { emailService } from '@/lib/email'
import { signOnboardingToken } from '@/lib/auth/onboarding'

// Validation schema for user creation
const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TUTOR', 'STUDENT', 'PARENT'], {
    errorMap: () => ({ message: 'Invalid role' })
  }),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  
  // Optional fields for all roles
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  createdAt: z.string().optional(), // Allow manual setting of joined date
  bio: z.string().optional(),
  avatar: z.string().optional(),
  
  // Tutor-specific fields
  qualifications: z.array(z.string()).optional(),
  experience: z.number().optional(),
  specializations: z.array(z.string()).optional(),
  hourlyRate: z.number().optional(),
  availability: z.any().optional(),
  
  // Student-specific fields
  ageGroup: z.string().optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  parentPhone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  guardianRelation: z.string().optional(),
})

// GET /api/users - List users with search, pagination, and filtering
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (role && role !== 'ALL') {
      where.role = role
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const totalCount = await prisma.user.count({ where })

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        lastLogin: true,
        ageGroup: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get stats by role
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })

    const roleStats = stats.reduce((acc, stat) => {
      acc[stat.role] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        total: totalCount,
        byRole: roleStats
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Role-based authorization check
    const currentUserRole = session.user.role
    const targetRole = validatedData.role

    // Only SUPER_ADMIN can create ADMIN users
    if (targetRole === 'ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admins can create Admin users' },
        { status: 403 }
      )
    }

    // Only SUPER_ADMIN can create SUPER_ADMIN users
    if (targetRole === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admins can create Super Admin users' },
        { status: 403 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true, email: true, name: true }
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email already exists',
          existingUser: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email
          }
        },
        { status: 409 }
      )
    }

    // Initialize with a random strong hash; user will set their own password via onboarding
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        role: validatedData.role,
        status: validatedData.status,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        createdAt: validatedData.createdAt ? new Date(validatedData.createdAt) : undefined, // Allow manual joined date
        bio: validatedData.bio,
        avatar: validatedData.avatar,
        
        // Tutor-specific fields
        qualifications: validatedData.qualifications || [],
        experience: validatedData.experience,
        specializations: validatedData.specializations || [],
        hourlyRate: validatedData.hourlyRate,
        availability: validatedData.availability,
        
        // Student-specific fields
        ageGroup: validatedData.ageGroup,
        parentName: validatedData.parentName,
        parentEmail: validatedData.parentEmail || null,
        parentPhone: validatedData.parentPhone,
        address: validatedData.address,
        emergencyContact: validatedData.emergencyContact,
        guardianRelation: validatedData.guardianRelation,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
      }
    })

    // Send onboarding link for tutors only (ACTIVE)
    if (process.env.EMAIL_ENABLED === 'true' && user.status === 'ACTIVE' && user.role === 'TUTOR') {
      try {
        const token = signOnboardingToken({ userId: user.id, role: user.role as any, purpose: 'onboarding', scope: 'tutor' })
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const link = `${baseUrl}/onboarding?token=${encodeURIComponent(token)}`

        await emailService.sendEmail({
          to: user.email,
          template: 'user.onboarding-link',
          data: {
            userName: user.name || user.email,
            link
          }
        })
      } catch (error) {
        console.error('Onboarding link email error:', error)
        // Don't fail creation on email issues
      }
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully. Onboarding link sent for ACTIVE tutors.'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    
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
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

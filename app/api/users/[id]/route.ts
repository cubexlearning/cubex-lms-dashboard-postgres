export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Validation schema for user update
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TUTOR', 'STUDENT', 'PARENT']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  
  // Optional fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  createdAt: z.string().optional(), // Allow updating joined date
  bio: z.string().optional(),
  avatar: z.string().optional(),
  password: z.string().min(8).optional(),
  
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

// GET /api/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        bio: true,
        
        // Tutor-specific fields
        qualifications: true,
        experience: true,
        specializations: true,
        hourlyRate: true,
        availability: true,
        
        // Student-specific fields
        ageGroup: true,
        parentName: true,
        parentEmail: true,
        parentPhone: true,
        address: true,
        emergencyContact: true,
        guardianRelation: true,
        
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        
        _count: {
          select: {
            enrollments: true,
            courseTutors: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Role-based authorization check
    const currentUserRole = session.user.role
    const targetUserRole = existingUser.role
    const newRole = validatedData.role

    // Admin cannot edit other admins or super admins
    if (currentUserRole === 'ADMIN' && ['ADMIN', 'SUPER_ADMIN'].includes(targetUserRole)) {
      return NextResponse.json(
        { success: false, error: 'Admins cannot edit other Admins or Super Admins' },
        { status: 403 }
      )
    }

    // Only SUPER_ADMIN can change role to ADMIN or SUPER_ADMIN
    if (newRole && ['ADMIN', 'SUPER_ADMIN'].includes(newRole) && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admins can assign Admin or Super Admin roles' },
        { status: 403 }
      )
    }

    // Check email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== existingUser.id) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
        select: { id: true }
      })

      if (emailExists && emailExists.id !== params.id) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
      createdAt: validatedData.createdAt ? new Date(validatedData.createdAt) : undefined, // Allow updating joined date
    }

    // Hash password if provided
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Error updating user:', error)
    
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
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete (soft delete) user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { 
        id: true, 
        role: true,
        _count: {
          select: {
            enrollments: true,
            courseTutors: true
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Role-based authorization check
    const currentUserRole = session.user.role
    const targetUserRole = existingUser.role

    // Admin cannot delete other admins or super admins
    if (currentUserRole === 'ADMIN' && ['ADMIN', 'SUPER_ADMIN'].includes(targetUserRole)) {
      return NextResponse.json(
        { success: false, error: 'Admins cannot delete other Admins or Super Admins' },
        { status: 403 }
      )
    }

    // Prevent deleting self
    if (params.id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account' },
        { status: 403 }
      )
    }

    // Check for dependencies
    const hasEnrollments = existingUser._count.enrollments > 0
    const hasCourseTutors = existingUser._count.courseTutors > 0

    if (hasEnrollments || hasCourseTutors) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User has active enrollments or courses. Please reassign or remove them first.',
          details: {
            enrollments: existingUser._count.enrollments,
            courses: existingUser._count.courseTutors
          }
        },
        { status: 409 }
      )
    }

    // Soft delete - set status to INACTIVE
    await prisma.user.update({
      where: { id: params.id },
      data: { status: 'INACTIVE' }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}


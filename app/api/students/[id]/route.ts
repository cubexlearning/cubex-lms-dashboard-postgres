export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

// Validation schema for student update
const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  ageGroup: z.string().optional(),
  dateOfBirth: z.string().optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  parentPhone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  guardianRelation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
})

// GET /api/students/[id] - Get single student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    const student = await prisma.user.findUnique({
      where: { 
        id: params.id,
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        ageGroup: true,
        dateOfBirth: true,
        parentName: true,
        parentEmail: true,
        parentPhone: true,
        address: true,
        emergencyContact: true,
        guardianRelation: true,
        createdAt: true,
        updatedAt: true,
        enrollments: {
          include: {
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
                status: true,
                paidAt: true,
              }
            }
          },
          orderBy: {
            enrolledAt: 'desc'
          }
        },
        _count: {
          select: {
            enrollments: true,
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: student
    })

  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student' },
      { status: 500 }
    )
  }
}

// PUT /api/students/[id] - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    
    const body = await request.json()
    const validatedData = updateStudentSchema.parse(body)

    // Check if student exists
    const existingStudent = await prisma.user.findUnique({
      where: { 
        id: params.id,
        role: 'STUDENT'
      }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // Update student
    const updateData: any = {}
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (validatedData.ageGroup !== undefined) updateData.ageGroup = validatedData.ageGroup
    if (validatedData.dateOfBirth !== undefined) {
      updateData.dateOfBirth = validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null
    }
    if (validatedData.parentName !== undefined) updateData.parentName = validatedData.parentName
    if (validatedData.parentEmail !== undefined) {
      updateData.parentEmail = validatedData.parentEmail || null
    }
    if (validatedData.parentPhone !== undefined) updateData.parentPhone = validatedData.parentPhone
    if (validatedData.address !== undefined) updateData.address = validatedData.address
    if (validatedData.emergencyContact !== undefined) updateData.emergencyContact = validatedData.emergencyContact
    if (validatedData.guardianRelation !== undefined) updateData.guardianRelation = validatedData.guardianRelation
    if (validatedData.status !== undefined) updateData.status = validatedData.status

    const updatedStudent = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        status: true,
        ageGroup: true,
        dateOfBirth: true,
        parentName: true,
        parentEmail: true,
        parentPhone: true,
        address: true,
        emergencyContact: true,
        guardianRelation: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: 'Student updated successfully'
    })

  } catch (error) {
    console.error('Error updating student:', error)
    
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
      { success: false, error: 'Failed to update student' },
      { status: 500 }
    )
  }
}

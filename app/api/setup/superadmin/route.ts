import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Super admin already exists',
        email: existingAdmin.email,
        alreadyExists: true,
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Create super admin
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@lms.com',
        password: hashedPassword,
        name: 'Super Admin',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        emailVerified: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully!',
      user: {
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
      },
      credentials: {
        email: 'admin@lms.com',
        password: 'admin123'
      }
    })
  } catch (error) {
    console.error('Error creating super admin:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create super admin',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method to check if super admin exists
export async function GET() {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      exists: !!existingAdmin,
      admin: existingAdmin || null,
    })
  } catch (error) {
    console.error('Error checking super admin:', error)
    return NextResponse.json(
      { error: 'Failed to check super admin status' },
      { status: 500 }
    )
  }
}

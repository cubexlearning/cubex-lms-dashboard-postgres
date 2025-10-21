export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'

// GET /api/students/check-email?email=test@example.com
// Check if email already exists in the system
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Check if user exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        // phone: true,
        // role: true,
        // status: true,
        // ageGroup: true,
      }
    })

    if (existingUser) {
      return NextResponse.json({
        success: true,
        exists: true,
        student: existingUser,
        message: `Email already registered to ${existingUser.name}`
      })
    }

    return NextResponse.json({
      success: true,
      exists: false,
      message: 'Email is available'
    })

  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check email' },
      { status: 500 }
    )
  }
}

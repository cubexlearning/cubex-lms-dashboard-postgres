import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    
    // Test basic database operations
    const userCount = await prisma.user.count()
    const categories = await prisma.category.findMany({ take: 5 })
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connected successfully',
      userCount,
      sampleCategories: categories,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    })
  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Create a test user with proper fields
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'temp-password', // In real app, this would be hashed
        name: 'Test User',
        role: 'STUDENT',
        firstName: 'Test',
        lastName: 'User',
        status: 'ACTIVE',
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Test user created successfully!',
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        status: testUser.status,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error creating test user:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create test user',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
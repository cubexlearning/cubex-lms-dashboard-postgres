import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { email } = await request.json()
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 })
    }

    // Check if user exists with the given email
    const user = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase().trim(),
        role: { in: ['STUDENT', 'TUTOR'] }
      },
      select: { 
        id: true, 
        email: true, 
        name: true,
        role: true 
      }
    })

    return NextResponse.json({ 
      success: true, 
      exists: !!user,
      user: user || null
    })
  } catch (error) {
    console.error('Check email error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check email' 
    }, { status: 500 })
  }
}

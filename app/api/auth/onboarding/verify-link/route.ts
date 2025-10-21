export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { verifyOnboardingToken } from '@/lib/auth/onboarding'

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 })
    }

    const payload = verifyOnboardingToken(token)
    if (payload.purpose !== 'onboarding') {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 })
    }

    // Ensure user exists and is ACTIVE
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true, status: true, role: true } })
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'User not active' }, { status: 400 })
    }

    // For students, ensure an enrollment exists
    if (payload.scope === 'student') {
      const hasEnrollment = await prisma.enrollment.findFirst({ where: { studentId: user.id } })
      if (!hasEnrollment) {
        return NextResponse.json({ success: false, error: 'No enrollment found' }, { status: 403 })
      }
    }

    return NextResponse.json({ success: true, email: user.email, role: user.role })
  } catch (error) {
    console.error('verify-link error:', error)
    return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 })
  }
}



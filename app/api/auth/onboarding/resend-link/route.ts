export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { signOnboardingToken } from '@/lib/auth/onboarding'
import { emailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, status: true } })
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'User not active' }, { status: 400 })
    }

    if (user.role === 'STUDENT') {
      const hasEnrollment = await prisma.enrollment.findFirst({ where: { studentId: user.id } })
      if (!hasEnrollment) {
        return NextResponse.json({ success: false, error: 'No enrollment found for student' }, { status: 403 })
      }
    }

    const token = signOnboardingToken({ userId: user.id, role: user.role as any, purpose: 'onboarding', scope: user.role === 'STUDENT' ? 'student' : 'tutor' })
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const link = `${baseUrl}/onboarding?token=${encodeURIComponent(token)}`

    if (process.env.EMAIL_ENABLED === 'true') {
      await emailService.sendEmail({
        to: user.email,
        template: 'user.onboarding-link',
        data: {
          userName: user.name || user.email,
          link
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Onboarding link sent' })
  } catch (error) {
    console.error('resend-link error:', error)
    return NextResponse.json({ success: false, error: 'Failed to resend link' }, { status: 500 })
  }
}



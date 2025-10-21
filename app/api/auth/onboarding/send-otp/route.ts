export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import crypto from 'crypto'
import { emailService } from '@/lib/email'

function generateOtp(): string {
  return (Math.floor(100000 + Math.random() * 900000)).toString()
}

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, status: true } })
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ success: true, message: 'If the account exists and is active, an OTP has been sent.' })
    }

    // Rate limit: last 10 minutes per email
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const sentCount = await prisma.otpSendLog.count({ where: { email, createdAt: { gte: tenMinutesAgo } } })
    if (sentCount >= 3) {
      return NextResponse.json({ success: false, error: 'Too many OTP requests. Try again later.' }, { status: 429 })
    }

    const otp = generateOtp()
    const codeHash = crypto.createHash('sha256').update(otp).digest('hex')
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // Invalidate previous unconsumed OTPs
    await prisma.emailOtp.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: new Date() } })

    await prisma.emailOtp.create({ data: { userId: user.id, codeHash, expiresAt } })
    await prisma.otpSendLog.create({ data: { email } })

    if (process.env.EMAIL_ENABLED === 'true') {
      await emailService.sendEmail({
        to: user.email,
        template: 'user.onboarding-otp',
        data: {
          userName: user.name || user.email,
          otp
        }
      })
    }

    return NextResponse.json({ success: true, message: 'OTP sent if account exists and is active.' })
  } catch (error) {
    console.error('send-otp error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 })
  }
}



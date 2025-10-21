export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ success: false, error: 'Email and code are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, status: true } })
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 400 })
    }

    const otp = await prisma.emailOtp.findFirst({
      where: { userId: user.id, consumedAt: null },
      orderBy: { createdAt: 'desc' }
    })
    if (!otp) {
      return NextResponse.json({ success: false, error: 'OTP not found' }, { status: 400 })
    }
    if (otp.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'OTP expired' }, { status: 400 })
    }
    if (otp.attempts >= otp.maxAttempts) {
      return NextResponse.json({ success: false, error: 'Too many attempts' }, { status: 429 })
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex')
    const isValid = codeHash === otp.codeHash

    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1, consumedAt: isValid ? new Date() : null }
    })

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 })
    }

    // Create short-lived nonce (10 minutes)
    const nonce = await prisma.onboardingNonce.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      },
      select: { id: true, expiresAt: true }
    })

    return NextResponse.json({ success: true, nonce: nonce.id, expiresAt: nonce.expiresAt })
  } catch (error) {
    console.error('verify-otp error:', error)
    return NextResponse.json({ success: false, error: 'Failed to verify OTP' }, { status: 500 })
  }
}



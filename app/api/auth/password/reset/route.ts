import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { token, password } = await request.json()
    if (!token || !password || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
    }

    const prt = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!prt || prt.usedAt || prt.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 12)
    await prisma.$transaction([
      prisma.user.update({ where: { id: prt.userId }, data: { password: hash } }),
      prisma.passwordResetToken.update({ where: { id: prt.id }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: prt.userId, usedAt: null, expiresAt: { lt: new Date() } } })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ success: false, error: 'Failed to reset password' }, { status: 500 })
  }
}



export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { email, newPassword, nonce } = await request.json()

    if (!email || !newPassword || !nonce) {
      return NextResponse.json({ success: false, error: 'Email, password and nonce are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, status: true } })
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Invalid user' }, { status: 400 })
    }

    const nonceRow = await prisma.onboardingNonce.findFirst({ where: { id: nonce, userId: user.id, usedAt: null } })
    if (!nonceRow || nonceRow.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { password: hashedPassword, emailVerified: new Date() } })
      await tx.onboardingNonce.update({ where: { id: nonceRow.id }, data: { usedAt: new Date() } })
    })

    // Auto-login: client should now call NextAuth credentials signIn with (email, newPassword)
    return NextResponse.json({ success: true, message: 'Password set successfully', emailForLogin: email })
  } catch (error) {
    console.error('set-password error:', error)
    return NextResponse.json({ success: false, error: 'Failed to set password' }, { status: 500 })
  }
}



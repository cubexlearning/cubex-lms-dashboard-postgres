import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { emailService } from '@/lib/email'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { email } = await request.json()
    if (!email) return NextResponse.json({ success: true })

    const user = await prisma.user.findFirst({
      where: { email, role: { in: ['STUDENT','TUTOR'] } },
      select: { id: true, name: true }
    })

    // Always return success to avoid user enumeration
    if (!user) {
      console.log('User not found for email:', email)
      return NextResponse.json({ success: true })
    }

    console.log('User found:', user.name, 'Creating password reset token...')

    // Create token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    const resetToken = await prisma.passwordResetToken.create({ 
      data: { userId: user.id, token, expiresAt } 
    })
    console.log('Password reset token created successfully:', resetToken.id)

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    
    console.log('Sending email to:', email)
    const emailResult = await emailService.sendEmail({
      to: email,
      template: 'user.password-reset' as any,
      data: { name: user.name || '', resetUrl }
    })
    
    console.log('Email sent successfully:', emailResult)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ success: true })
  }
}



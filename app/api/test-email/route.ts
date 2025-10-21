export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'

// Test email endpoint - for development only
export async function POST(request: NextRequest) {
  try {
    const { to, template } = await request.json()
    const toEmail = to || 'sarath@maitexa.in'

    // Preflight config checks to help debug
    if (process.env.EMAIL_ENABLED !== 'true') {
      return NextResponse.json(
        { success: false, error: 'EMAIL_ENABLED is not true. Enable email in .env.local and restart dev server.' },
        { status: 400 }
      )
    }
    const provider = (process.env.EMAIL_PROVIDER || 'SMTP').toUpperCase()
    if (provider === 'MAILTRAP' && !process.env.MAILTRAP_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'MAILTRAP_TOKEN is missing. Set a valid token in .env.local and restart dev server.' },
        { status: 400 }
      )
    }

    // Test data for different templates (institution data will be added automatically by email service)
    const testData = {
      'enrollment.welcome': {
        studentName: 'John Doe',
        courseTitle: 'Advanced Mathematics',
        enrollmentId: 'ENR-12345',
        courseDescription: 'A comprehensive course covering advanced mathematical concepts.',
        startDate: new Date().toLocaleDateString(),
        tutorName: 'Dr. Smith'
      },
      'user.welcome': {
        userName: 'jane.doe@example.com',
        temporaryPassword: 'TempPass123',
        role: 'STUDENT',
        loginUrl: `${process.env.NEXTAUTH_URL}/login`
      },
      'payment.confirmation': {
        studentName: 'John Doe',
        courseTitle: 'Advanced Mathematics',
        amount: 299.99,
        currency: 'USD',
        paymentMethod: 'Credit Card',
        transactionId: 'TXN-67890',
        paymentDate: new Date().toLocaleDateString()
      }
    }

    const templateToTest = template || 'enrollment.welcome'
    const data = testData[templateToTest as keyof typeof testData] || testData['enrollment.welcome']

    const emailSent = await emailService.sendEmail({
      to: toEmail,
      template: templateToTest as any,
      data
    })

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${toEmail} using template ${templateToTest}`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email. Verify provider, token/SMTP credentials, and restart the dev server after changing .env.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}

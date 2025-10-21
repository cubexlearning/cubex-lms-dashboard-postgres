export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'
import { getInstitutionSettings } from '@/lib/email/institution-service'

// Debug email endpoint - for production troubleshooting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testEmail = searchParams.get('email') || 'test@example.com'

    // Check environment variables
    const envCheck = {
      EMAIL_ENABLED: process.env.EMAIL_ENABLED,
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USERNAME: process.env.SMTP_USERNAME ? '***' : 'NOT_SET',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '***' : 'NOT_SET',
      SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
      SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    }

    // Test institution settings
    let institutionSettings
    try {
      institutionSettings = await getInstitutionSettings()
    } catch (error) {
      institutionSettings = { error: 'Failed to fetch institution settings', details: error }
    }

    // Test SMTP connection
    let smtpTest
    try {
      const testResult = await emailService.sendEmail({
        to: testEmail,
        template: 'enrollment.welcome',
        data: {
          studentName: 'Test User',
          courseTitle: 'Debug Test Course',
          enrollmentId: 'DEBUG-123',
          courseDescription: 'This is a debug test email',
          startDate: new Date().toLocaleDateString(),
          tutorName: 'Debug Tutor'
        }
      })
      smtpTest = { success: testResult, message: testResult ? 'Email sent successfully' : 'Email sending failed' }
    } catch (error) {
      smtpTest = { success: false, error: error.message, details: error }
    }

    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        environment: envCheck,
        institutionSettings,
        smtpTest,
        recommendations: [
          'Check if EMAIL_ENABLED=true in production',
          'Verify SMTP credentials are correct',
          'Ensure SMTP_HOST and SMTP_PORT are set',
          'Check if SMTP server allows connections from your hosting provider',
          'Verify FROM email address is valid',
          'Check spam folder for test emails'
        ]
      }
    })

  } catch (error) {
    console.error('Debug email error:', error)
    return NextResponse.json(
      { success: false, error: 'Debug email failed', details: error.message },
      { status: 500 }
    )
  }
}

import { EmailTemplate } from '../../types'
import { createEmailLayout } from '../shared/layout'
import { createInfoBox } from '../shared/components'

export const onboardingOtpEmail: EmailTemplate = (data: any) => {
  const institution = data.institution
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Welcome to ${institution?.institutionName || 'Learning Management System'}!</h2>
    <p>Dear ${data.userName},</p>
    <p>Use the following One-Time Password (OTP) to complete your onboarding:</p>
    ${createInfoBox(`<div style=\"font-size:24px; font-weight:bold; letter-spacing: 4px;\">${data.otp}</div>`, 'info')}
    <p>This OTP will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
  `

  return {
    subject: `Your ${institution?.institutionName || 'Learning Management System'} onboarding OTP`,
    html: createEmailLayout({
      title: `Onboarding OTP`,
      content,
      institutionName: institution?.institutionName || 'Learning Management System',
      institutionLogo: institution?.institutionLogo,
      brandPrimaryColor: institution?.brandPrimaryColor,
      brandSecondaryColor: institution?.brandSecondaryColor,
      contactEmail: institution?.contactEmail,
      website: institution?.website
    })
  }
}



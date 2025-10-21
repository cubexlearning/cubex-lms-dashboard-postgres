import { EmailTemplate } from '../../types'
import { createEmailLayout } from '../shared/layout'

export const passwordResetEmail: EmailTemplate = ({ name, resetUrl, institution }) => {
  const subject = `Reset your password - ${institution?.institutionName || 'LMS'}`
  const html = createEmailLayout({
    title: 'Reset your password',
    content: `
      <p>Hi ${name || 'there'},</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for 30 minutes and can be used only once.</p>
      <p style="margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
      </p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
    institutionName: institution?.institutionName || 'LMS',
    institutionLogo: institution?.institutionLogo,
    contactEmail: institution?.contactEmail,
    website: institution?.institutionWebsite,
    brandPrimaryColor: institution?.brandPrimaryColor,
    brandSecondaryColor: institution?.brandSecondaryColor
  })

  return { subject, html }
}



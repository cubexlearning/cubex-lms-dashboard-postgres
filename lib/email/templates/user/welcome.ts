import { EmailTemplate, UserWelcomeData } from '../../types'
import { createEmailLayout } from '../shared/layout'
import { createButton, createCredentialsBox } from '../shared/components'

export const userWelcome: EmailTemplate = (data: any) => {
  const institution = data.institution
  const roleDisplayName = {
    STUDENT: 'Student',
    TUTOR: 'Tutor',
    ADMIN: 'Administrator'
  }[data.role]

  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Welcome to ${institution?.institutionName || data.institutionName}!</h2>
    
    <p>Dear ${data.userName},</p>
    
    <p>Your ${roleDisplayName.toLowerCase()} account has been created successfully!</p>
    
    ${createCredentialsBox([
      { label: 'Email', value: data.userName },
      { label: 'Temporary Password', value: data.temporaryPassword }
    ])}
    
    <p><strong>Important:</strong> Please login and change your password as soon as possible for security reasons.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      ${createButton('Login Now', data.loginUrl, undefined, institution?.brandPrimaryColor)}
    </div>
    
    <p>If you have any questions or need assistance, please contact our support team${institution?.contactEmail ? ` at ${institution.contactEmail}` : (data.supportEmail ? ` at ${data.supportEmail}` : '')}.</p>
  `

  return {
    subject: `Welcome to ${institution?.institutionName || data.institutionName} - ${roleDisplayName} Account`,
    html: createEmailLayout({
      title: `Welcome to ${institution?.institutionName || data.institutionName}`,
      content,
      institutionName: institution?.institutionName || data.institutionName,
      institutionLogo: institution?.institutionLogo,
      brandPrimaryColor: institution?.brandPrimaryColor,
      brandSecondaryColor: institution?.brandSecondaryColor,
      contactEmail: institution?.contactEmail,
      website: institution?.website
    })
  }
}

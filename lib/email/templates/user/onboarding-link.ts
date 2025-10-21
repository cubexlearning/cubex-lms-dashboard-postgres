import { EmailTemplate, EmailTemplateData } from '../../types'
import { createEmailLayout } from '../shared/layout'
import { createButton } from '../shared/components'

export const onboardingLinkEmail: EmailTemplate = (data: any) => {
  const institution = data.institution
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Welcome to ${institution?.institutionName || 'Learning Management System'}!</h2>
    <p>Dear ${data.userName},</p>
    <p>Click the button below to start your onboarding. This link will expire soon and can be used only once.</p>
    <div style="text-align: center; margin: 30px 0;">
      ${createButton('Start Onboarding', data.link, undefined, institution?.brandPrimaryColor)}
    </div>
    <p>If you did not request this, you can safely ignore this email.</p>
  `

  return {
    subject: `Complete your onboarding for ${institution?.institutionName || 'Learning Management System'}`,
    html: createEmailLayout({
      title: `Onboarding`,
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



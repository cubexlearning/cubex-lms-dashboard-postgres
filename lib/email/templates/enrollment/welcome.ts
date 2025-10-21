import { EmailTemplate, EnrollmentWelcomeData } from '../../types'
import { createEmailLayout } from '../shared/layout'
import { createButton, createInfoBox } from '../shared/components'

export const enrollmentWelcome: EmailTemplate = (data: any) => {
  const institution = data.institution
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Welcome to Your New Course!</h2>
    
    <p>Dear ${data.studentName},</p>
    
    <p>Congratulations! You have been successfully enrolled in <strong>${data.courseTitle}</strong>.</p>
    
    ${createInfoBox(`
      <strong>Enrollment Details:</strong><br>
      Course: ${data.courseTitle}<br>
      Enrollment ID: <code>${data.enrollmentId}</code><br>
      ${data.startDate ? `Start Date: ${data.startDate}<br>` : ''}
      ${data.tutorName ? `Instructor: ${data.tutorName}<br>` : ''}
    `, 'success')}
    
    ${data.courseDescription ? `<p>${data.courseDescription}</p>` : ''}
    
    <p>We're excited to have you join our learning community! Your educational journey starts now.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      ${createButton('Access Your Course', '#', undefined, institution?.brandPrimaryColor)}
    </div>
    
    <p>If you have any questions, please don't hesitate to contact our support team${institution?.contactEmail ? ` at ${institution.contactEmail}` : ''}.</p>
  `

  return {
    subject: `Welcome to ${data.courseTitle}!`,
    html: createEmailLayout({
      title: `Welcome to ${data.courseTitle}`,
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

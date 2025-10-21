import { EmailTemplate, PaymentConfirmationData } from '../../types'
import { createEmailLayout } from '../shared/layout'
import { createInfoBox } from '../shared/components'

export const paymentConfirmation: EmailTemplate = (data: any) => {
  const institution = data.institution
  const content = `
    <h2 style="color: #333; margin-bottom: 20px;">Payment Confirmation</h2>
    
    <p>Dear ${data.studentName},</p>
    
    <p>Thank you for your payment! Your transaction has been processed successfully.</p>
    
    ${createInfoBox(`
      <strong>Payment Details:</strong><br>
      Course: ${data.courseTitle}<br>
      Amount: ${data.currency} ${data.amount.toFixed(2)}<br>
      Payment Method: ${data.paymentMethod}<br>
      Transaction ID: <code>${data.transactionId}</code><br>
      Payment Date: ${data.paymentDate}
    `, 'success')}
    
    <p>Your enrollment is now active and you can access your course materials.</p>
    
    <p>If you have any questions about your payment, please contact our support team${institution?.contactEmail ? ` at ${institution.contactEmail}` : ''}.</p>
  `

  return {
    subject: `Payment Confirmation - ${data.courseTitle}`,
    html: createEmailLayout({
      title: 'Payment Confirmation',
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

import nodemailer from 'nodemailer'
import { renderTemplate, TemplateKey } from './templates'
import { getInstitutionSettings, InstitutionEmailData } from './institution-service'

interface EmailParams {
  to: string
  template: TemplateKey
  data: any
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private connectionValidated: boolean = false

  constructor() {
    if (process.env.EMAIL_ENABLED === 'true') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
        // Add connection timeout
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      })
    }
  }

  private async validateConnection(): Promise<boolean> {
    if (!this.transporter) return false
    
    if (this.connectionValidated) return true

    try {
      await this.transporter.verify()
      this.connectionValidated = true
      console.log('SMTP connection validated successfully')
      return true
    } catch (error) {
      console.error('SMTP connection validation failed:', error)
      this.connectionValidated = false
      return false
    }
  }

  async sendEmail({ to, template, data }: EmailParams): Promise<boolean> {
    if (!this.transporter || process.env.EMAIL_ENABLED !== 'true') {
      console.log('Email disabled or not configured')
      return false
    }

    try {
      // Validate SMTP connection first
      const isConnectionValid = await this.validateConnection()
      if (!isConnectionValid) {
        console.error('SMTP connection validation failed, cannot send email')
        return false
      }

      // Fetch institution settings
      const institutionSettings = await getInstitutionSettings()
      
      // Merge institution data with template data
      const enrichedData = {
        ...data,
        institution: institutionSettings
      }
      
      const emailContent = renderTemplate(template, enrichedData)
      
      // Validate email content
      if (!emailContent.subject || !emailContent.html) {
        console.error('Invalid email content generated for template:', template)
        return false
      }

      // Send email with detailed logging
      const result = await this.transporter.sendMail({
        from: `"${institutionSettings.emailFromName}" <${institutionSettings.emailFromAddress}>`,
        to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text || emailContent.html.replace(/<[^>]*>/g, ''),
      })
      
      console.log(`Email sent successfully to ${to} using template ${template}`)
      console.log('Email message ID:', result.messageId)
      console.log('Email response:', result.response)
      
      return true
    } catch (error) {
      console.error('Email sending failed:', error)
      
      // Reset connection validation on error
      this.connectionValidated = false
      
      // Log specific error types
      if (error instanceof Error) {
        if (error.message.includes('ETIMEDOUT')) {
          console.error('SMTP connection timeout - check network and SMTP settings')
        } else if (error.message.includes('authentication')) {
          console.error('SMTP authentication failed - check credentials')
        } else if (error.message.includes('connection')) {
          console.error('SMTP connection failed - check host and port')
        }
      }
      
      return false
    }
  }
}

export const emailService = new EmailService()

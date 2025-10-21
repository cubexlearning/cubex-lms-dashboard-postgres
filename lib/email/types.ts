export interface BaseEmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface EmailTemplateData {
  [key: string]: any
}

export interface EmailTemplate {
  (data: EmailTemplateData): BaseEmailTemplate
}

// Specific template data interfaces
export interface EnrollmentWelcomeData {
  studentName: string
  courseTitle: string
  enrollmentId: string
  institutionName: string
  courseDescription?: string
  startDate?: string
  tutorName?: string
}

export interface UserWelcomeData {
  userName: string
  temporaryPassword: string
  role: 'STUDENT' | 'TUTOR' | 'ADMIN'
  institutionName: string
  loginUrl: string
  supportEmail: string
}

export interface PaymentConfirmationData {
  studentName: string
  courseTitle: string
  amount: number
  currency: string
  paymentMethod: string
  transactionId: string
  paymentDate: string
}

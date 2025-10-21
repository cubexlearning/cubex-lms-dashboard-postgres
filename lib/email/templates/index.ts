import { EmailTemplate } from '../types'

// Import all templates
import { enrollmentWelcome } from './enrollment/welcome'
import { userWelcome } from './user/welcome'
import { paymentConfirmation } from './payment/confirmation'
import { onboardingOtpEmail } from './user/onboarding-otp'
import { onboardingLinkEmail } from './user/onboarding-link'
import { passwordResetEmail } from './user/password-reset'

// Template registry
export const emailTemplates = {
  // Enrollment templates
  'enrollment.welcome': enrollmentWelcome,
  
  // User templates
  'user.welcome': userWelcome,
  'user.onboarding-otp': onboardingOtpEmail,
  'user.onboarding-link': onboardingLinkEmail,
  'user.password-reset': passwordResetEmail,
  
  // Payment templates
  'payment.confirmation': paymentConfirmation,
} as const

export type TemplateKey = keyof typeof emailTemplates

// Helper function to get template
export function getTemplate(key: TemplateKey): EmailTemplate {
  const template = emailTemplates[key]
  if (!template) {
    throw new Error(`Template '${key}' not found`)
  }
  return template
}

// Helper function to render template
export function renderTemplate(key: TemplateKey, data: any) {
  const template = getTemplate(key)
  return template(data)
}

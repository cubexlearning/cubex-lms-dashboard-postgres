import jwt from 'jsonwebtoken'

const DEFAULT_EXP_SECONDS = 24 * 60 * 60 // 24 hours

export interface OnboardingTokenPayload {
  userId: string
  role: 'STUDENT' | 'TUTOR' | 'ADMIN' | 'SUPER_ADMIN' | 'PARENT'
  purpose: 'onboarding'
  scope?: 'tutor' | 'student'
}

export function signOnboardingToken(payload: OnboardingTokenPayload, expiresInSeconds = DEFAULT_EXP_SECONDS): string {
  const secret = process.env.ONBOARDING_JWT_SECRET
  if (!secret) throw new Error('ONBOARDING_JWT_SECRET not configured')
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: expiresInSeconds })
}

export function verifyOnboardingToken(token: string): OnboardingTokenPayload & { iat: number; exp: number } {
  const secret = process.env.ONBOARDING_JWT_SECRET
  if (!secret) throw new Error('ONBOARDING_JWT_SECRET not configured')
  return jwt.verify(token, secret, { algorithms: ['HS256'] }) as any
}



"use client"
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'

export default function OnboardingPage() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''

  const [step, setStep] = useState<'verify' | 'password' | 'otp'>('verify')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [nonce, setNonce] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    const verify = async () => {
      if (!token) return
      setLoading(true)
      try {
        const res = await fetch('/api/auth/onboarding/verify-link', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error(data.error || 'Invalid or expired link')
        setEmail(data.email)
        setRole(data.role)
        setStep('password')
      } catch (e: any) {
        toast.error(e.message || 'Invalid or expired link')
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [token])

  const handleSendOtp = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/onboarding/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to send OTP')
      setStep('otp')
      toast.success('OTP sent to your email')
      setCooldown(60)
      const interval = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0 }
          return c - 1
        })
      }, 1000)
    } catch (e: any) {
      toast.error(e.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/onboarding/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: otp }) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Invalid OTP')
      setNonce(data.nonce)
      await handleSetPassword(data.nonce)
    } catch (e: any) {
      toast.error(e.message || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const handleSetPassword = async (n?: string) => {
    if (password.length < 8 || password !== confirmPassword) {
      toast.error('Passwords must match and be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/onboarding/set-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, newPassword: password, nonce: n || nonce }) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to set password')
      // Auto-login
      const login = await signIn('credentials', { redirect: false, email: data.emailForLogin, password })
      if (login?.ok) {
        toast.success('Welcome!')
        const dest = role === 'STUDENT' ? '/student' : role === 'TUTOR' ? '/tutor' : '/admin'
        router.replace(dest)
      } else {
        toast.error('Sign-in failed, please login manually')
        router.replace('/login')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to set password')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'password' && (
            <>
              <Input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
              <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              <Button disabled={loading} onClick={handleSendOtp} className="w-full">Continue</Button>
            </>
          )}
          {step === 'otp' && (
            <>
              <Input placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} />
              <div className="flex gap-2">
                <Button disabled={loading} onClick={handleVerifyOtp} className="flex-1">Verify & Finish</Button>
                <Button variant="outline" disabled={loading || cooldown > 0} onClick={handleSendOtp}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </Button>
              </div>
            </>
          )}
          {step === 'verify' && (
            <div>Verifying link...</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



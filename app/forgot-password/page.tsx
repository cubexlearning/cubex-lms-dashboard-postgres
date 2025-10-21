"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean | null
    isChecking: boolean
    message: string
  }>({
    isValid: null,
    isChecking: false,
    message: ''
  })

  // Email validation function
  const validateEmail = useCallback(async (emailToValidate: string) => {
    if (!emailToValidate || !emailToValidate.includes('@') || !emailToValidate.includes('.')) {
      setEmailValidation({
        isValid: false,
        isChecking: false,
        message: 'Please enter a valid email address'
      })
      return
    }

    setEmailValidation({
      isValid: null,
      isChecking: true,
      message: 'Checking if account exists...'
    })

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToValidate })
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.exists) {
          setEmailValidation({
            isValid: true,
            isChecking: false,
            message: `Great! We found your account (${data.user.role.toLowerCase()})`
          })
        } else {
          setEmailValidation({
            isValid: false,
            isChecking: false,
            message: 'Sorry, we couldn\'t find an account with this email address. Please check your email or contact support if you believe this is an error.'
          })
        }
      } else {
        setEmailValidation({
          isValid: false,
          isChecking: false,
          message: 'Unable to verify email. Please try again.'
        })
      }
    } catch (err) {
      setEmailValidation({
        isValid: false,
        isChecking: false,
        message: 'Unable to verify email. Please try again.'
      })
    }
  }, [])

  // Debounced email validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email && email.includes('@') && email.includes('.')) {
        validateEmail(email)
      } else if (email && !email.includes('@')) {
        setEmailValidation({
          isValid: false,
          isChecking: false,
          message: 'Please enter a valid email address'
        })
      } else if (!email) {
        setEmailValidation({
          isValid: null,
          isChecking: false,
          message: ''
        })
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [email, validateEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!emailValidation.isValid) {
      setError('Please enter a valid email address that exists in our system.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (response.ok) {
        setSent(true)
      } else {
        throw new Error('Failed to send reset link')
      }
    } catch (err) {
      setError('We\'re sorry, but we couldn\'t send the reset link right now. Please try again in a few moments.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Reset Your Password</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Enter your email address and we'll send you a secure link to reset your password.
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Reset link sent!</strong><br />
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Please check your email and follow the instructions to reset your password.
                  <br /><br />
                  <em className="text-sm">The link will expire in 30 minutes for security reasons.</em>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    disabled={loading}
                    className={`pr-10 ${
                      emailValidation.isValid === true ? 'border-green-500' : 
                      emailValidation.isValid === false ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter your email address"
                  />
                  {emailValidation.isChecking && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {emailValidation.isValid === true && !emailValidation.isChecking && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {emailValidation.isValid === false && !emailValidation.isChecking && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                
                {emailValidation.message && (
                  <div className={`text-sm ${
                    emailValidation.isValid === true ? 'text-green-600' : 
                    emailValidation.isValid === false ? 'text-red-600' : 
                    'text-blue-600'
                  }`}>
                    {emailValidation.message}
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !emailValidation.isValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  'Send Password Reset Link'
                )}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <a href="/login" className="text-blue-600 hover:text-blue-800 underline">
                    Sign in here
                  </a>
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



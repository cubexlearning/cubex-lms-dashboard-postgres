"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AdminLayout } from './layouts/admin-layout'
import { TutorLayout } from './layouts/tutor-layout'
import { StudentLayout } from './layouts/student-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Loader2 } from 'lucide-react'

interface RoleLayoutWrapperProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function RoleLayoutWrapper({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}: RoleLayoutWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(redirectTo)
      return
    }

    if (status === 'authenticated' && allowedRoles.length > 0) {
      const userRole = session?.user?.role
      if (userRole && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        switch (userRole) {
          case 'SUPER_ADMIN':
          case 'ADMIN':
            router.push('/admin')
            break
          case 'TUTOR':
            router.push('/tutor')
            break
          case 'STUDENT':
            router.push('/student')
            break
          case 'PARENT':
            router.push('/parent')
            break
          default:
            router.push('/login')
        }
        return
      }
    }
  }, [session, status, router, allowedRoles, redirectTo])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
            </CardTitle>
            <CardDescription>
              Authenticating and setting up your dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be logged in to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated but wrong role
  if (allowedRoles.length > 0 && session?.user?.role && !allowedRoles.includes(session.user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You don't have permission to access this section
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              Current role: <strong>{session.user.role}</strong>
            </p>
            <p className="text-sm text-gray-600 mt-1">Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render appropriate layout based on user role
  const userRole = session?.user?.role

  switch (userRole) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return <AdminLayout>{children}</AdminLayout>
    
    case 'TUTOR':
      return <TutorLayout>{children}</TutorLayout>
    
    case 'STUDENT':
      return <StudentLayout>{children}</StudentLayout>
    
    case 'PARENT':
      // For now, use student layout for parents - can create ParentLayout later
      return <StudentLayout>{children}</StudentLayout>
    
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader className="text-center">
              <CardTitle>Unknown Role</CardTitle>
              <CardDescription>
                Your account role is not recognized
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600">
                Please contact support for assistance.
              </p>
            </CardContent>
          </Card>
        </div>
      )
  }
}

"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ApiResponse {
  success: boolean
  message: string
  userCount?: number
  user?: any
  error?: string
  timestamp: string
  stats?: any
  credentials?: any
  alreadyExists?: boolean
}

export default function TestDatabasePage() {
  const [testResult, setTestResult] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-db')
      const data: ApiResponse = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to connect to API',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createTestUser = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-db', { method: 'POST' })
      const data: ApiResponse = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to create test user',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createSuperAdmin = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/setup/superadmin', { method: 'POST' })
      const data: ApiResponse = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to create super admin',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Database Test Page</h1>
          <p className="text-gray-600 mt-2">
            Use this page to test your database connection and functionality.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Database Tests</CardTitle>
              <CardDescription>
                Test your database connection and basic operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testConnection} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
              </Button>
              
              <Button 
                onClick={createTestUser} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Test User'}
              </Button>
              
              <Button 
                onClick={createSuperAdmin} 
                disabled={isLoading}
                variant="secondary"
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Super Admin'}
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Results from your database tests will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={testResult.success ? "default" : "destructive"}>
                      {testResult.success ? 'Success' : 'Error'}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(testResult.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div>
                    <p className="font-medium">{testResult.message}</p>
                    
                    {testResult.userCount !== undefined && (
                      <p className="text-sm text-gray-600 mt-1">
                        User count: {testResult.userCount}
                      </p>
                    )}
                    
                    {testResult.stats && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <pre>{JSON.stringify(testResult.stats, null, 2)}</pre>
                      </div>
                    )}
                    
                    {testResult.credentials && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <p className="font-medium text-green-800">Login Credentials:</p>
                        <p className="text-green-700">Email: {testResult.credentials.email}</p>
                        <p className="text-green-700">Password: {testResult.credentials.password}</p>
                      </div>
                    )}
                    
                    {testResult.user && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                        <pre>{JSON.stringify(testResult.user, null, 2)}</pre>
                      </div>
                    )}
                    
                    {testResult.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        Error: {testResult.error}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No test results yet. Click a button above to test.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>1.</strong> Create your Vercel Postgres database:</p>
              <code className="block bg-gray-100 p-2 rounded">vercel storage create postgres</code>
              
              <p><strong>2.</strong> Update your .env.local with the real DATABASE_URL</p>
              
              <p><strong>3.</strong> Generate Prisma client:</p>
              <code className="block bg-gray-100 p-2 rounded">npx prisma generate</code>
              
              <p><strong>4.</strong> Push schema to database:</p>
              <code className="block bg-gray-100 p-2 rounded">npx prisma db push</code>
              
              <p><strong>5.</strong> Test the connection using the buttons above!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

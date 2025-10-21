"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp,
  UserPlus,
  Settings,
  BarChart3,
  Plus,
  Shield,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { AddUserDialog } from '@/components/users/AddUserDialog'
import { toast } from 'sonner'

interface DashboardStats {
  statistics: {
    totalUsers: { count: number; growth: number }
    totalCourses: { count: number; growth: number }
    totalEnrollments: { count: number; growth: number }
    systemAdmins: { count: number; growth: number }
  }
  usersByRole: {
    STUDENT: number
    TUTOR: number
    PARENT: number
    ADMIN: number
    SUPER_ADMIN: number
  }
  recentActivity: Array<{
    type: string
    message: string
    timestamp: string
    color: string
  }>
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      } else {
        toast.error(data.error || 'Failed to fetch dashboard stats')
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      toast.error('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Add New User",
      description: "Create user accounts for students, tutors, or admins",
      icon: UserPlus,
      color: "bg-blue-100 text-blue-600",
      onClick: () => setAddUserDialogOpen(true)
    },
    {
      title: "System Settings",
      description: "Configure platform settings and preferences",
      icon: Settings,
      color: "bg-purple-100 text-purple-600",
      onClick: () => router.push('/admin/settings')
    },
    {
      title: "View Reports",
      description: "Access comprehensive analytics and reports",
      icon: BarChart3,
      color: "bg-green-100 text-green-600",
      onClick: () => router.push('/admin/reports')
    }
  ]

  const getGrowthBadgeClass = (growth: number) => {
    if (growth > 0) return "bg-blue-50 text-blue-700"
    if (growth < 0) return "bg-red-50 text-red-700"
    return "bg-gray-50 text-gray-700"
  }

  const formatGrowth = (growth: number) => {
    if (growth > 0) return `+${growth}% this month`
    if (growth < 0) return `${growth}% this month`
    return "No change"
  }

  return (
    <RoleLayoutWrapper allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage users, courses, and system settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={fetchDashboardStats}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Data
            </Button>
            <Button onClick={() => setAddUserDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Quick Add User
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="hover:shadow-md transition-shadow cursor-pointer border-gray-200"
              onClick={action.onClick}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.color}`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statistics Overview */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-6">
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <Badge variant="secondary" className={getGrowthBadgeClass(stats?.statistics.totalUsers.growth || 0)}>
                      {formatGrowth(stats?.statistics.totalUsers.growth || 0)}
                    </Badge>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 mb-1">
                    {stats?.statistics.totalUsers.count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <Badge variant="secondary" className={getGrowthBadgeClass(stats?.statistics.totalCourses.growth || 0)}>
                      {formatGrowth(stats?.statistics.totalCourses.growth || 0)}
                    </Badge>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 mb-1">
                    {stats?.statistics.totalCourses.count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <Badge variant="secondary" className={getGrowthBadgeClass(stats?.statistics.totalEnrollments.growth || 0)}>
                      {formatGrowth(stats?.statistics.totalEnrollments.growth || 0)}
                    </Badge>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 mb-1">
                    {stats?.statistics.totalEnrollments.count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Enrollments</div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <Badge variant="secondary" className="bg-red-50 text-red-700">
                      Admin Access
                    </Badge>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 mb-1">
                    {stats?.statistics.systemAdmins.count || 0}
                  </div>
                  <div className="text-sm text-gray-600">System Admins</div>
                </CardContent>
              </Card>
            </div>

            {/* User Distribution */}
            <div className="grid grid-cols-2 gap-8">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">User Distribution by Role</CardTitle>
                  <CardDescription>Breakdown of users across different roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { role: 'STUDENT', label: 'Students', color: 'bg-green-500' },
                      { role: 'TUTOR', label: 'Tutors', color: 'bg-blue-500' },
                      { role: 'PARENT', label: 'Parents', color: 'bg-orange-500' },
                      { role: 'ADMIN', label: 'Admins', color: 'bg-purple-500' },
                      { role: 'SUPER_ADMIN', label: 'Super Admins', color: 'bg-red-500' }
                    ].map((roleInfo) => (
                      <div key={roleInfo.role} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${roleInfo.color}`}></div>
                          <span className="text-sm font-medium text-gray-700">{roleInfo.label}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {stats?.usersByRole[roleInfo.role as keyof typeof stats.usersByRole] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                  <CardDescription>Latest system activities and user actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                      stats.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-600">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Add User Dialog */}
      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onSuccess={() => {
          fetchDashboardStats()
          setAddUserDialogOpen(false)
        }}
      />
    </RoleLayoutWrapper>
  )
}

"use client"

import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Trophy, 
  FileText, 
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Play
} from 'lucide-react'

export default function StudentDashboard() {
  const quickActions = [
    {
      title: "Continue Learning",
      description: "Resume your latest course progress",
      icon: Play,
      color: "bg-blue-100 text-blue-600",
      href: "/student/courses"
    },
    {
      title: "Submit Assignment",
      description: "Complete and submit pending assignments",
      icon: FileText,
      color: "bg-green-100 text-green-600",
      href: "/student/assignments"
    },
    {
      title: "View Schedule",
      description: "Check your upcoming classes and events",
      icon: Calendar,
      color: "bg-purple-100 text-purple-600",
      href: "/student/schedule"
    }
  ]

  return (
    <RoleLayoutWrapper allowedRoles={['STUDENT']}>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Track your learning progress and access course materials
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Trophy className="w-4 h-4 mr-2" />
              View Achievements
            </Button>
            <Button>
              <Target className="w-4 h-4 mr-2" />
              Set Goals
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer border-gray-200">
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
        <div className="grid grid-cols-4 gap-6">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  Active
                </Badge>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">4</div>
              <div className="text-sm text-gray-600">Enrolled Courses</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  This Term
                </Badge>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">B+</div>
              <div className="text-sm text-gray-600">Average Grade</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                  Due Soon
                </Badge>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">3</div>
              <div className="text-sm text-gray-600">Pending Assignments</div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                  This Week
                </Badge>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">12</div>
              <div className="text-sm text-gray-600">Study Hours</div>
            </CardContent>
          </Card>
        </div>

        {/* Course Progress & Upcoming Schedule */}
        <div className="grid grid-cols-2 gap-8">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Course Progress</CardTitle>
              <CardDescription>Your learning progress across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Mathematics</span>
                    <span className="text-sm text-gray-600">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Physics</span>
                    <span className="text-sm text-gray-600">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Chemistry</span>
                    <span className="text-sm text-gray-600">91%</span>
                  </div>
                  <Progress value={91} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">English</span>
                    <span className="text-sm text-gray-600">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Upcoming Classes</CardTitle>
              <CardDescription>Your schedule for the next few days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Mathematics</p>
                    <p className="text-xs text-gray-600">Today, 10:00 AM • Room 101</p>
                  </div>
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Physics Lab</p>
                    <p className="text-xs text-gray-600">Tomorrow, 2:00 PM • Lab B</p>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Chemistry</p>
                    <p className="text-xs text-gray-600">Wed, 9:00 AM • Room 205</p>
                  </div>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assignments & Achievements */}
        <div className="grid grid-cols-2 gap-8">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Assignments</CardTitle>
              <CardDescription>Latest assignments and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Algebra Quiz</p>
                      <p className="text-xs text-gray-600">Mathematics</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Submitted</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Lab Report</p>
                      <p className="text-xs text-gray-600">Physics</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">Due Tomorrow</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Essay</p>
                      <p className="text-xs text-gray-600">English</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Due Next Week</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Achievements</CardTitle>
              <CardDescription>Your latest accomplishments and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Perfect Attendance</p>
                    <p className="text-xs text-gray-600">Week of Sept 18-22</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Top Score</p>
                    <p className="text-xs text-gray-600">Mathematics Quiz - 98%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Course Completed</p>
                    <p className="text-xs text-gray-600">Introduction to Chemistry</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleLayoutWrapper>
  )
}

"use client"

import { useState } from "react"
import { RoleLayoutWrapper } from "@/components/role-layout-wrapper"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Download,
  Calendar,
  FileText,
  PieChart,
  LineChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30")
  const [reportType, setReportType] = useState("overview")

  // Dummy data for demonstration
  const keyMetrics = [
    { 
      label: "Total Revenue", 
      value: "₹2,45,000", 
      change: "+12.5%",
      trend: "up",
      icon: DollarSign, 
      color: "text-green-600", 
      bgColor: "bg-green-50" 
    },
    { 
      label: "New Enrollments", 
      value: "156", 
      change: "+8.2%",
      trend: "up",
      icon: Users, 
      color: "text-blue-600", 
      bgColor: "bg-blue-50" 
    },
    { 
      label: "Active Students", 
      value: "842", 
      change: "+5.7%",
      trend: "up",
      icon: TrendingUp, 
      color: "text-purple-600", 
      bgColor: "bg-purple-50" 
    },
    { 
      label: "Course Completion", 
      value: "68%", 
      change: "-2.3%",
      trend: "down",
      icon: Activity, 
      color: "text-orange-600", 
      bgColor: "bg-orange-50" 
    },
  ]

  const coursePerformance = [
    { name: "Mathematics Foundation", enrolled: 45, completed: 32, revenue: "₹67,500", rating: 4.8 },
    { name: "Physics Advanced", enrolled: 38, completed: 28, revenue: "₹57,000", rating: 4.6 },
    { name: "Chemistry Basics", enrolled: 52, completed: 41, revenue: "₹78,000", rating: 4.9 },
    { name: "Biology GCSE", enrolled: 29, completed: 19, revenue: "₹43,500", rating: 4.5 },
    { name: "English Literature", enrolled: 41, completed: 35, revenue: "₹61,500", rating: 4.7 },
  ]

  const recentActivity = [
    { type: "enrollment", message: "New enrollment in Mathematics Foundation", time: "5 minutes ago" },
    { type: "payment", message: "Payment received - ₹15,000", time: "12 minutes ago" },
    { type: "completion", message: "Student completed Physics Advanced", time: "1 hour ago" },
    { type: "enrollment", message: "New enrollment in Chemistry Basics", time: "2 hours ago" },
    { type: "payment", message: "Payment received - ₹12,500", time: "3 hours ago" },
  ]

  const availableReports = [
    {
      title: "Financial Report",
      description: "Detailed revenue, expenses, and payment tracking",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Enrollment Analytics",
      description: "Student enrollment trends and patterns",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Course Performance",
      description: "Course completion rates and student feedback",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Tutor Performance",
      description: "Tutor ratings, sessions, and student satisfaction",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Student Progress",
      description: "Individual and cohort learning outcomes",
      icon: LineChart,
      color: "text-pink-600",
      bgColor: "bg-pink-50"
    },
    {
      title: "Custom Reports",
      description: "Build your own reports with custom filters",
      icon: PieChart,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment': return <Users className="w-4 h-4 text-blue-600" />
      case 'payment': return <DollarSign className="w-4 h-4 text-green-600" />
      case 'completion': return <TrendingUp className="w-4 h-4 text-purple-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <RoleLayoutWrapper allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Comprehensive insights into your institution's performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {metric.change}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">{metric.label}</p>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>Top performing courses this month</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                View Full Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {coursePerformance.map((course, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{course.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          ⭐ {course.rating}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {course.enrolled} enrolled • {course.completed} completed • {course.revenue}
                      </p>
                    </div>
                  </div>
                  <Progress value={(course.completed / course.enrolled) * 100} className="h-2" />
                  <p className="text-xs text-gray-500">
                    {Math.round((course.completed / course.enrolled) * 100)}% completion rate
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableReports.map((report, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className={`p-3 rounded-lg ${report.bgColor} w-fit mb-4`}>
                  <report.icon className={`w-6 h-6 ${report.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{report.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-dashed border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Advanced Analytics Dashboard Coming Soon
          </h3>
          <p className="text-blue-700 max-w-2xl mx-auto">
            This is a preview of the reports interface. Interactive charts, custom date ranges, 
            drill-down capabilities, scheduled reports, and real-time data visualization will be available soon.
          </p>
        </CardContent>
      </Card>
      </div>
    </RoleLayoutWrapper>
  )
}

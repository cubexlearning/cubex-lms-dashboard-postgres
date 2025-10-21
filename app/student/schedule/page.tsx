"use client"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RoleLayoutWrapper } from "@/components/role-layout-wrapper"
import { useState } from "react"
import { Clock, User, BookOpen, AlertCircle } from "lucide-react"

export default function StudentSchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <RoleLayoutWrapper>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-gray-600">View your classes, assignments, and upcoming events</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Academic Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar 
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Mathematics 101</p>
                      <Badge variant="secondary">9:00 AM</Badge>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <User className="w-4 h-4 mr-1" />
                      Prof. Johnson
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Physics Lab</p>
                      <Badge variant="secondary">2:00 PM</Badge>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <User className="w-4 h-4 mr-1" />
                      Dr. Smith
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Math Homework #5</p>
                    <p className="text-sm text-gray-600">Due tomorrow</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Physics Lab Report</p>
                    <p className="text-sm text-gray-600">Due in 3 days</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Chemistry Quiz</p>
                    <p className="text-sm text-gray-600">Due next week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Assignments</span>
                  <span className="font-bold text-green-600">12/15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Attendance Rate</span>
                  <span className="font-bold text-blue-600">95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Grade</span>
                  <span className="font-bold text-purple-600">A-</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleLayoutWrapper>
  )
}

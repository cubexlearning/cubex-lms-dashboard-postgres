"use client"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleLayoutWrapper } from "@/components/role-layout-wrapper"
import { useState } from "react"

export default function AdminCalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <RoleLayoutWrapper>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
          <p className="text-gray-600">Manage system-wide events, holidays, and academic calendar</p>
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
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Semester Start</p>
                    <p className="text-sm text-gray-500">January 15, 2024</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Registration Deadline</p>
                    <p className="text-sm text-gray-500">January 10, 2024</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Holiday Break</p>
                    <p className="text-sm text-gray-500">December 20-31, 2023</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Active Sessions</span>
                  <span className="font-bold text-blue-600">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Scheduled Events</span>
                  <span className="font-bold text-green-600">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Holidays</span>
                  <span className="font-bold text-red-600">3</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleLayoutWrapper>
  )
}

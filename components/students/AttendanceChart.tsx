"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'

interface AttendanceChartProps {
  attendanceRecords: Array<{
    id: string
    status: string
    session: {
      title: string
      scheduledAt: string
    }
  }>
}

export function AttendanceChart({ attendanceRecords }: AttendanceChartProps) {
  const totalSessions = attendanceRecords.length
  const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length
  const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length
  const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'ABSENT': return <XCircle className="w-4 h-4 text-red-600" />
      case 'LATE': return <Clock className="w-4 h-4 text-yellow-600" />
      default: return <XCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800'
      case 'ABSENT': return 'bg-red-100 text-red-800'
      case 'LATE': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Attendance Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Attendance Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Attendance Rate</span>
            <span className="text-2xl font-bold text-blue-600">{attendanceRate}%</span>
          </div>
          <Progress value={attendanceRate} className="h-2" />
        </div>

        {/* Attendance Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <div className="text-sm text-green-700">Present</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <div className="text-sm text-red-700">Absent</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
            <div className="text-sm text-yellow-700">Late</div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div>
          <h4 className="font-medium mb-3">Recent Sessions</h4>
          <div className="space-y-2">
            {attendanceRecords.slice(0, 5).map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(record.status)}
                  <div>
                    <div className="font-medium text-sm">{record.session.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(record.session.scheduledAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(record.status)}>
                  {record.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

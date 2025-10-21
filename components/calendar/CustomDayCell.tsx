"use client"
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface DayStats {
  sessionCount: number
  attendanceRate: number
  pendingActivities: number
  totalStudents: number
  attendedStudents: number
  absentStudents: number
  status: string
  isLeaveDay: boolean
}

interface CustomDayCellProps {
  date: Date
  stats?: DayStats
  onClick?: (date: Date) => void
}

export function CustomDayCell({ date, stats, onClick }: CustomDayCellProps) {
  const isSunday = date.getDay() === 0
  const isToday = new Date().toDateString() === date.toDateString()
  const isLeaveDay = !!stats?.isLeaveDay

  const getStatusColor = () => {
    if (isSunday) return 'bg-red-100 text-red-800'
    if (isLeaveDay) return 'bg-gray-100 text-gray-500'
    if (stats?.status === 'completed') return 'bg-green-50 text-green-800'
    if (stats?.status === 'in-progress') return 'bg-yellow-50 text-yellow-800'
    if (stats?.status === 'cancelled') return 'bg-red-50 text-red-800'
    if (stats?.status === 'scheduled') return 'bg-blue-50 text-blue-800'
    return 'bg-gray-50 text-gray-800'
  }

  return (
    <div 
      className={`p-3 h-full w-full cursor-pointer hover:bg-gray-50 transition-colors ${getStatusColor()} ${
        isToday ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => onClick?.(date)}
    >
      <div className="flex items-center justify-between mb-2">
        {/* <span className="text-sm font-medium">{date.getDate()}</span> */}
        {/* Removed the icon completely */}
      </div>
      
      {/* Show attendance data only when not cancelled/holiday */}
      {stats && stats.status !== 'cancelled' && (stats.attendedStudents > 0 || stats.absentStudents > 0) && (
        <div className="space-y-1">
          {stats.attendedStudents > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{stats.attendedStudents} attended</span>
            </div>
          )}
          {stats.absentStudents > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-700">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>{stats.absentStudents} absent</span>
            </div>
          )}
        </div>
      )}
      
      {/* Show cancelled status if session is cancelled */}
      {stats && stats.status === 'cancelled' && (
        <div className="text-xs text-red-600 font-medium">
          Cancelled
        </div>
      )}
      
      {/* Show session info if no attendance data but has session and not cancelled */}
      {stats && stats.sessionCount > 0 && stats.attendedStudents === 0 && stats.absentStudents === 0 && stats.status !== 'cancelled' && (
        <div className="text-xs text-gray-600">
          {stats.sessionCount} session{stats.sessionCount > 1 ? 's' : ''}
        </div>
      )}
      
      {isLeaveDay && !stats && (
        <div className="text-sm text-gray-500">
          Off
        </div>
      )}
    </div>
  )
}
"use client"
import { useState, useMemo } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CustomDayCell } from './CustomDayCell'
import { Calendar as CalendarIcon, Users, Clock, CheckCircle } from 'lucide-react'

// Configure moment localizer properly
const localizer = momentLocalizer(moment)

interface SessionEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    courseId: string
    courseName: string
    studentCount: number
    attendanceRate: number
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  }
}

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

interface SessionCalendarProps {
  events: SessionEvent[]
  onDateClick?: (date: Date) => void
  onEventClick?: (event: SessionEvent) => void
  selectedCourse?: string
}

export function SessionCalendar({ 
  events, 
  onDateClick, 
  onEventClick, 
  selectedCourse 
}: SessionCalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [date, setDate] = useState(new Date())

  // Calculate day stats for each date
  const dayStats = useMemo(() => {
    const stats: Record<string, DayStats> = {}
    
    events.forEach(event => {
      // Ensure start is a Date object
      const startDate = event.start instanceof Date ? event.start : new Date(event.start)
      const dateKey = startDate.toDateString()
      if (!stats[dateKey]) {
        stats[dateKey] = {
          sessionCount: 0,
          attendanceRate: 0,
          pendingActivities: 0,
          totalStudents: 0,
          attendedStudents: 0,
          absentStudents: 0,
          status: '',
          isLeaveDay: false
        }
      }
      
      stats[dateKey].sessionCount++
      stats[dateKey].totalStudents += event.resource.studentCount
      
      // Calculate attended/absent students based on attendance rate
      const totalStudents = event.resource.studentCount
      const attendanceRate = event.resource.attendanceRate
      const attended = Math.round((totalStudents * attendanceRate) / 100)
      const absent = totalStudents - attended
      
      stats[dateKey].attendedStudents += attended
      stats[dateKey].absentStudents += absent
      stats[dateKey].status = event.resource.status
    })

    // Do not auto-mark Sundays as leave days; only style is handled elsewhere

    return stats
  }, [events])

  const handleDateClick = (date: Date) => {
    onDateClick?.(date)
  }

  const handleEventClick = (event: SessionEvent) => {
    onEventClick?.(event)
  }

  const navigateToToday = () => {
    setDate(new Date())
  }

  const getEventStyle = (event: SessionEvent) => {
    const baseStyle = {
      borderRadius: '4px',
      opacity: 0,
      color: 'white',
      border: '0px',
      display: 'none'
    }

    return {
      style: baseStyle
    }
  }

  const CustomEvent = ({ event }: { event: SessionEvent }) => null

  // Ensure events have proper Date objects
  const processedEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      start: event.start instanceof Date ? event.start : new Date(event.start),
      end: event.end instanceof Date ? event.end : new Date(event.end)
    }))
  }, [events])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Session Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
            >
              Day
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToToday}
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={processedEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            date={date}
            onNavigate={setDate}
            onView={(view) => setView(view as 'month' | 'week' | 'day')}
            onSelectEvent={handleEventClick}
            onSelectSlot={({ start }) => handleDateClick(start)}
            selectable
            popup
            components={{
              event: CustomEvent,
              dateCellWrapper: ({ children, value }) => {
                const dateKey = value.toDateString()
                const stats = dayStats[dateKey]
                return (
                  <div className="h-full w-full min-h-[100px] relative">
                    <CustomDayCell 
                      date={value} 
                      stats={stats} 
                      onClick={handleDateClick}
                    />
                    <div className="absolute inset-0 pointer-events-none opacity-0">
                      {children}
                    </div>
                  </div>
                )
              }
            }}
            eventPropGetter={getEventStyle}
            dayPropGetter={(date) => {
              const dateKey = date.toDateString()
              const stats = dayStats[dateKey]
              const isSunday = date.getDay() === 0
              
              let className = 'min-h-[100px]'
              if (isSunday) {
                className += ' bg-red-100'
              } else if (stats?.isLeaveDay) {
                className += ' bg-gray-50'
              } else if (stats?.status === 'completed') {
                className += ' bg-green-100'
              } else if (stats?.status === 'in-progress') {
                className += ' bg-yellow-100'
              } else if (stats?.status === 'cancelled') {
                className += ' bg-red-100'
              } else if (stats?.status === 'scheduled') {
                className += ' bg-blue-100'
              }
              return { className }
            }}
            style={{ height: '100%' }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useState } from 'react'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download } from 'lucide-react'

type ReportRow = {
  courseTitle: string
  totalStudents: number
  attendanceRate: number
  avgAssignmentScore: number
}

export default function TutorReportsPage() {
  const [timeRange, setTimeRange] = useState('last_30_days')
  const [rows, setRows] = useState<ReportRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/tutor/reports?range=${encodeURIComponent(timeRange)}`, { cache: 'no-store' })
        const json = await res.json()
        if (json.success) {
          setRows(json.data)
        } else {
          setRows([])
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [timeRange])

  const exportCsv = () => {
    const header = ['Course', 'Students', 'Attendance %', 'Avg Score']
    const lines = rows.map(r => [
      r.courseTitle,
      String(r.totalStudents),
      (r.attendanceRate * 100).toFixed(1),
      String(r.avgAssignmentScore)
    ].join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tutor-report-${timeRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <RoleLayoutWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-600">Course performance and engagement</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 days</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                <SelectItem value="this_quarter">This quarter</SelectItem>
                <SelectItem value="this_year">This year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>By Course</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    <TableHead className="text-right">Attendance</TableHead>
                    <TableHead className="text-right">Avg Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4}>Loading...</TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>No data for selected range.</TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.courseTitle}>
                        <TableCell>{r.courseTitle}</TableCell>
                        <TableCell className="text-right">{r.totalStudents}</TableCell>
                        <TableCell className="text-right">{(r.attendanceRate * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{r.avgAssignmentScore.toFixed(1)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleLayoutWrapper>
  )
}



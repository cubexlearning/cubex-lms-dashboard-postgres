"use client"
import { RoleLayoutWrapper } from "@/components/role-layout-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { Plus, Search, Edit, Trash2, Eye, User, BookOpen, MoreVertical, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { EnrollmentForm } from "@/components/enrollments/EnrollmentForm"
import { EnrollmentDetailsDialog } from "@/components/enrollments/EnrollmentDetailsDialog"

interface Enrollment {
  id: string
  student: {
    id: string
    name: string
    email: string
    phone?: string
    avatar?: string
  }
  course: {
    id: string
    title: string
    shortDescription?: string
  }
  format: string
  status: string
  paymentStatus: string
  sessionsCompleted?: number
  sessionCount: number
  finalPrice: number
  currency: string
  enrolledAt: string
  startedAt?: string
  payments?: any[]
}

export default function AdminEnrollmentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formatFilter, setFormatFilter] = useState("all")
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Load enrollments from API
  const loadEnrollments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchTerm,
        ...(statusFilter !== 'all' && { status: statusFilter.toUpperCase() }),
        ...(formatFilter !== 'all' && { format: formatFilter.toUpperCase() }),
      })

      const response = await fetch(`/api/enrollments?${params}`)
      const result = await response.json()

      if (result.success) {
        const payload = result.data ?? {}
        const enrollmentsArray: Enrollment[] = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as any).enrollments)
            ? (payload as any).enrollments
            : []
        setEnrollments(enrollmentsArray)
        const pagination = (payload as any).pagination || result.pagination || {}
        setTotalPages(pagination.pages || pagination.totalPages || 1)
      } else {
        toast.error('Failed to load enrollments')
      }
    } catch (error) {
      console.error('Error loading enrollments:', error)
      toast.error('An error occurred while loading enrollments')
    } finally {
      setLoading(false)
    }
  }

  // Load enrollments on mount and when filters change
  useEffect(() => {
    loadEnrollments()
  }, [page, statusFilter, formatFilter])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setPage(1) // Reset to first page on search
        loadEnrollments()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleEnrollmentSuccess = () => {
    setDialogOpen(false)
    loadEnrollments()
    toast.success('Enrollment created successfully!')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "COMPLETED": return "bg-blue-100 text-blue-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "CANCELLED": return "bg-red-100 text-red-800"
      case "SUSPENDED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID": return "bg-green-100 text-green-800"
      case "PARTIAL": return "bg-blue-100 text-blue-800"
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "FAILED": return "bg-red-100 text-red-800"
      case "REFUNDED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getFormatColor = (format: string) => {
    switch (format.toUpperCase()) {
      case "ONE_TO_ONE": return "bg-purple-100 text-purple-800"
      case "GROUP": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatEnrollmentFormat = (format: string) => {
    return format === 'ONE_TO_ONE' ? 'One-to-One' : 'Group'
  }

  const calculateSessionsCompleted = (enrollment: Enrollment) => {
    // Calculate from payments or sessions
    return enrollment.sessionsCompleted || 0
  }

  return (
    <RoleLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enrollment Management</h1>
            <p className="text-gray-600">Onboard students and manage enrollments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button 
              onClick={() => setDialogOpen(true)} 
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Enrollment
            </Button>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Enrollment</DialogTitle>
              </DialogHeader>
              <EnrollmentForm 
                onSuccess={handleEnrollmentSuccess}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search enrollments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formatFilter} onValueChange={setFormatFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="one_to_one">One-to-One</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Enrollments ({enrollments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading enrollments...</span>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No enrollments found</p>
                <p className="text-sm mt-1">Create your first enrollment to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-400px)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Format & Status</TableHead>
                      {/* <TableHead>Sessions</TableHead> */}
                      <TableHead>Payment</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium">{enrollment.student.name}</div>
                              <div className="text-sm text-gray-500">{enrollment.student.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium">{enrollment.course.title}</div>
                              {/* <div className="text-sm text-gray-500">ID: {enrollment.id.substring(0, 8)}</div> */}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={getFormatColor(enrollment.format)}>
                              {formatEnrollmentFormat(enrollment.format)}
                            </Badge>
                            <Badge className={getStatusColor(enrollment.status)}>
                              {enrollment.status}
                            </Badge>
                          </div>
                        </TableCell>
                        {/* <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {calculateSessionsCompleted(enrollment)}/{enrollment.sessionCount}
                            </div>
                            <div className="text-xs text-gray-500">sessions</div>
                          </div>
                        </TableCell> */}
                        <TableCell>
                          <Badge className={getPaymentStatusColor(enrollment.paymentStatus)}>
                            {enrollment.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {enrollment.currency === 'INR' ? '₹' : enrollment.currency}
                            {Number(enrollment.finalPrice).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">{formatDate(enrollment.enrolledAt)}</div>
                          {enrollment.startedAt && (
                            <div className="text-xs text-gray-400">Started: {formatDate(enrollment.startedAt)}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEnrollmentId(enrollment.id)
                                  setDetailsDialogOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem> */}
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Enrollment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2 px-4">
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Enrollment Details Dialog */}
      <EnrollmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        enrollmentId={selectedEnrollmentId}
      />
    </RoleLayoutWrapper>
  )
}
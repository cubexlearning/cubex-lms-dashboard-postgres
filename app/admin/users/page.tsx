"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { RoleLayoutWrapper } from "@/components/role-layout-wrapper"
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  GraduationCap,
  BookOpen,
  Loader2,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddUserDialog } from "@/components/users/AddUserDialog"
import { EditUserDialog } from "@/components/users/EditUserDialog"
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: string
  avatar: string | null
  createdAt: string
  lastLogin: string | null
  ageGroup: string | null
  _count: {
    enrollments: number
  }
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ACTIVE") // Default to ACTIVE only
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc") // Newest first (chronological)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    byRole: {} as Record<string, number>
  })
  // Pagination state - separate variables like courses page
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [searchQuery, roleFilter, statusFilter, sortBy, sortOrder, currentPage, pageSize])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
      })

      if (roleFilter !== 'ALL') params.append('role', roleFilter)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      console.log('Fetching users with params:', params.toString())
      const response = await fetch(`/api/users?${params}`)
      const data = await response.json()

      console.log('Users API response:', { success: data.success, dataLength: data.data?.length, pagination: data.pagination })

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      if (!data.success) {
        throw new Error(data.error || 'API returned error')
      }

      setUsers(data.data || [])
      const pagination = data.pagination || {}
      setTotalPages(pagination.totalPages || 1)
      setTotalUsers(pagination.totalCount || 0)
      setStats(data.stats || { total: 0, byRole: {} })

    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast.error(error.message || 'Failed to fetch users')
      setUsers([])
      setTotalPages(1)
      setTotalUsers(0)
    } finally {
      setLoading(false)
    }
  }

  // Pagination handlers - same pattern as courses page
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const goToFirstPage = () => handlePageChange(1)
  const goToLastPage = () => handlePageChange(totalPages)
  const goToPreviousPage = () => handlePageChange(Math.max(1, currentPage - 1))
  const goToNextPage = () => handlePageChange(Math.min(totalPages, currentPage + 1))

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800'
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      case 'TUTOR': return 'bg-blue-100 text-blue-800'
      case 'STUDENT': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'SUSPENDED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const canAddRole = (role: string) => {
    if (session?.user.role === 'SUPER_ADMIN') {
      return ['ADMIN', 'TUTOR', 'STUDENT'].includes(role)
    }
    if (session?.user.role === 'ADMIN') {
      return ['TUTOR', 'STUDENT'].includes(role)
    }
    return false
  }

  const canEditUser = (targetUserRole: string) => {
    if (session?.user.role === 'SUPER_ADMIN') {
      return true
    }
    if (session?.user.role === 'ADMIN') {
      return !['ADMIN', 'SUPER_ADMIN'].includes(targetUserRole)
    }
    return false
  }

  const canDeleteUser = (targetUserRole: string) => {
    return canEditUser(targetUserRole)
  }

  const handleResendOnboardingLink = async (user: User) => {
    try {
      const response = await fetch('/api/auth/onboarding/resend-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to resend link')
      toast.success('Onboarding link sent')
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend link')
    }
  }

  const statsCards = [
    { 
      label: "Total Users", 
      value: stats.total.toString(), 
      icon: Users, 
      color: "text-blue-600", 
      bgColor: "bg-blue-50" 
    },
    { 
      label: "Students", 
      value: (stats.byRole['STUDENT'] || 0).toString(), 
      icon: GraduationCap, 
      color: "text-green-600", 
      bgColor: "bg-green-50" 
    },
    { 
      label: "Tutors", 
      value: (stats.byRole['TUTOR'] || 0).toString(), 
      icon: BookOpen, 
      color: "text-purple-600", 
      bgColor: "bg-purple-50" 
    },
    { 
      label: "Admins", 
      value: ((stats.byRole['ADMIN'] || 0) + (stats.byRole['SUPER_ADMIN'] || 0)).toString(), 
      icon: Shield, 
      color: "text-orange-600", 
      bgColor: "bg-orange-50" 
    },
  ]

  return (
    <RoleLayoutWrapper allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">Manage all users, students, tutors, and administrators</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <CardTitle>All Users</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1) // Reset to page 1 on search
                      }}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={(value) => {
                    setRoleFilter(value)
                    setCurrentPage(1) // Reset to page 1 on filter
                  }}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      <SelectItem value="STUDENT">Students</SelectItem>
                      <SelectItem value="TUTOR">Tutors</SelectItem>
                      <SelectItem value="ADMIN">Admins</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value)
                    setCurrentPage(1) // Reset to page 1 on filter
                  }}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active Only</SelectItem>
                      <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Sort */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Joined Date</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="gap-1"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enrollments</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback className="bg-blue-600 text-white">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getRoleBadgeColor(user.role)}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getStatusBadgeColor(user.status)}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.role === 'STUDENT' ? (
                              <span className="text-sm">{user._count.enrollments} courses</span>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{formatDate(user.createdAt)}</span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEditUser(user.role) && (
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                )}
                                {user.status === 'ACTIVE' && canEditUser(user.role) && (
                                  <DropdownMenuItem onClick={() => handleResendOnboardingLink(user)}>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Resend Onboarding Link
                                  </DropdownMenuItem>
                                )}
                                {/* <DropdownMenuItem>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem> */}
                                {canDeleteUser(user.role) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => handleDeleteUser(user)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls - same pattern as courses page */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 pt-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">Rows per page:</span>
                      <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToFirstPage}
                          disabled={currentPage === 1 || loading}
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1 || loading}
                        >
                          Previous
                        </Button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const startPage = Math.max(1, currentPage - 2)
                          const pageNum = startPage + i
                          if (pageNum > totalPages) return null
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              disabled={loading}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages || loading}
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToLastPage}
                          disabled={currentPage === totalPages || loading}
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchUsers}
      />

      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchUsers}
        userId={selectedUser?.id || null}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={fetchUsers}
        user={selectedUser ? {
          id: selectedUser.id,
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role
        } : null}
      />
    </RoleLayoutWrapper>
  )
}

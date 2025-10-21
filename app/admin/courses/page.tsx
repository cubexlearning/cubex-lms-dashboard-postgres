"use client"
import { RoleLayoutWrapper } from "@/components/role-layout-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Edit, Trash2, Eye, Filter, MoreHorizontal, Copy, Archive, Users, Settings, CheckSquare, Square } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { CourseForm } from "@/components/courses/CourseForm"
import { ManageTutorsDialog } from "@/components/courses/ManageTutorsDialog"
import { toast } from "sonner"
import { useSettings } from "@/contexts/SettingsContext"

export default function AdminCoursesPage() {
  const router = useRouter()
  const { getCurrencySymbol } = useSettings()
  const currencySymbol = getCurrencySymbol()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isManageTutorsOpen, setIsManageTutorsOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [managingTutorsCourse, setManagingTutorsCourse] = useState<any>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCourses, setTotalCourses] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Load courses on component mount
  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      params.append('page', currentPage.toString())
      params.append('limit', pageSize.toString())
      
      const response = await fetch(`/api/courses?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const payload = data.data ?? {}
        const coursesArray = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.courses)
            ? payload.courses
            : []
        setCourses(coursesArray as any[])
        const pagination = payload.pagination || data.pagination || {}
        setTotalPages(pagination.pages || pagination.totalPages || 1)
        setTotalCourses(
          typeof pagination.total === 'number' ? pagination.total : (coursesArray?.length || 0)
        )
      } else {
        toast.error('Failed to load courses')
      }
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setIsLoading(false)
    }
  }

  // Reload courses when filters or pagination change
  useEffect(() => {
    loadCourses()
  }, [searchTerm, statusFilter, categoryFilter, currentPage, pageSize])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 hover:text-green-800"
      case "DRAFT": return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-800"
      case "ARCHIVED": return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800"
      default: return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800"
    }
  }

  const getFormatColor = (key: string) => {
    const k = key.toUpperCase().replace(/\s+/g, '_')
    switch (k) {
      case "BOTH_FORMATS": return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 hover:text-blue-800"
      case "ONE_TO_ONE_ONLY": return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 hover:text-purple-800"
      case "GROUP_ONLY": return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 hover:text-orange-800"
      default: return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800"
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedCourses(courses.map(course => course.id))
    } else {
      setSelectedCourses([])
    }
  }

  const handleSelectCourse = (courseId: string, checked: boolean) => {
    if (checked) {
      setSelectedCourses([...selectedCourses, courseId])
    } else {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId))
    }
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedCourses([])
    setSelectAll(false)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
    setSelectedCourses([])
    setSelectAll(false)
  }

  const goToFirstPage = () => handlePageChange(1)
  const goToLastPage = () => handlePageChange(totalPages)
  const goToPreviousPage = () => handlePageChange(Math.max(1, currentPage - 1))
  const goToNextPage = () => handlePageChange(Math.min(totalPages, currentPage + 1))

  const handleCreateCourse = async (data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Course created successfully!')
        setIsCreateModalOpen(false)
        loadCourses()
      } else {
        toast.error(result.error || 'Failed to create course')
      }
    } catch (error) {
      console.error('Error creating course:', error)
      toast.error('Failed to create course')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCourse = async (data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Course updated successfully!')
        setIsEditModalOpen(false)
        setEditingCourse(null)
        loadCourses()
      } else {
        toast.error(result.error || 'Failed to update course')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      toast.error('Failed to update course')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to archive this course?')) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Course archived successfully!')
        loadCourses()
      } else {
        toast.error(result.error || 'Failed to delete course')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('Failed to delete course')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedCourses.length === 0) {
      toast.error('Please select courses first')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/courses/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          courseIds: selectedCourses
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Bulk ${action} completed successfully!`)
        setSelectedCourses([])
        setSelectAll(false)
        loadCourses()
      } else {
        toast.error(result.error || `Failed to perform bulk ${action}`)
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
      toast.error(`Failed to perform bulk ${action}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <RoleLayoutWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600">Manage courses, pricing, and enrollment settings</p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" />
            Add Course
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search courses..."
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
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="online-tuition">Online Tuition</SelectItem>
                  <SelectItem value="exam-preparation">Exam Preparation</SelectItem>
                  <SelectItem value="arts-music">Arts and Music</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedCourses.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedCourses.length} course{selectedCourses.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBulkAction('publish')}
                    >
                      Publish
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBulkAction('archive')}
                    >
                      Archive
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBulkAction('assign-tutors')}
                    >
                      Assign Tutors
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleBulkAction('delete')}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedCourses([])}
                >
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Courses ({totalCourses})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[30%]">Course</TableHead>
                  <TableHead className="w-[12%]">Format</TableHead>
                  <TableHead className="w-[15%]">Pricing</TableHead>
                  <TableHead className="w-[8%]">Status</TableHead>
                  <TableHead className="w-[10%]">Enrollments</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Loading courses...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No courses found
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={(checked) => handleSelectCourse(course.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div>
                          <div className="font-medium">{course.title}</div>
                          {/* <div className="text-sm text-gray-500">ID: {course.id}</div> */}
                        </div>
                        <div className="flex items-start gap-2 flex-wrap flex-col">
                          <Badge variant="secondary" className="text-xs">{course.category?.name}</Badge>
                          <span className="text-xs text-gray-500">{new Date(course.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getFormatColor(course.courseFormat?.slug || course.courseFormat?.name || '')}>
                        {course.courseFormat?.name || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {course.oneToOnePrice && (
                          <div>1:1: {currencySymbol}{course.oneToOnePrice}</div>
                        )}
                        {course.groupPrice && (
                          <div>Group: {currencySymbol}{course.groupPrice}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{course._count?.enrollments || 0}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/courses/${course.id}/syllabus`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/courses/${course.id}/syllabus`)}>
                            <CheckSquare className="mr-2 h-4 w-4" />
                            View Syllabus
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingCourse(course)
                            setIsEditModalOpen(true)
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setManagingTutorsCourse(course)
                            setIsManageTutorsOpen(true)
                          }}>
                            <Users className="mr-2 h-4 w-4" />
                            Manage Tutors
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Rows per page:</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
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
                      disabled={currentPage === 1 || isLoading}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1 || isLoading}
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
                          disabled={isLoading}
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
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


        {/* Create Course Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <CourseForm
              onSubmit={handleCreateCourse}
              onCancel={() => setIsCreateModalOpen(false)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Course Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
            </DialogHeader>
            <CourseForm
              initialData={editingCourse}
              onSubmit={handleEditCourse}
              onCancel={() => {
                setIsEditModalOpen(false)
                setEditingCourse(null)
              }}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Manage Tutors Modal */}
        <ManageTutorsDialog
          open={isManageTutorsOpen}
          onOpenChange={setIsManageTutorsOpen}
          course={managingTutorsCourse}
          onSuccess={() => {
            loadCourses()
            setManagingTutorsCourse(null)
          }}
        />
      </div>
    </RoleLayoutWrapper>
  )
}

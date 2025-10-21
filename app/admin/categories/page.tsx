"use client"
import { RoleLayoutWrapper } from "@/components/role-layout-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, Eye, Palette, RotateCcw, MoreHorizontal } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog as ConfirmDialog, DialogContent as ConfirmContent, DialogHeader as ConfirmHeader, DialogTitle as ConfirmTitle } from "@/components/ui/dialog"

export default function AdminCategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "", color: "", sortOrder: 0, isActive: true })
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function formatDate(value: any) {
    try {
      const d = new Date(value)
      if (isNaN(d.getTime())) return ''
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
    } catch {
      return ''
    }
  }

  async function load() {
    try {
      setLoading(true)
      const res = await fetch(`/api/categories${showArchived ? '?includeInactive=true' : ''}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load categories')
      setItems(json.data)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [showArchived])

  const categories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter((c) =>
      c.name.toLowerCase().includes(term) ||
      c.slug.toLowerCase().includes(term) ||
      (c.description || '').toLowerCase().includes(term)
    )
  }, [items, searchTerm])

  function resetForm() {
    setForm({ name: "", slug: "", description: "", icon: "", color: "#193b71", sortOrder: 0, isActive: true })
    setEditing(null)
    setErrors({})
  }

  function validateForm() {
    const newErrors: Record<string, string> = {}
    
    if (!form.name.trim()) {
      newErrors.name = 'Category name is required'
    } else if (form.name.length > 100) {
      newErrors.name = 'Category name must be less than 100 characters'
    }
    
    if (form.color && !/^#([0-9a-fA-F]{6})$/.test(form.color)) {
      newErrors.color = 'Color must be a valid hex code (e.g., #3B82F6)'
    }
    
    if (form.sortOrder < 0) {
      newErrors.sortOrder = 'Sort order must be a positive number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function submitForm() {
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }
    
    try {
      setSaving(true)
      const payload: any = { ...form }
      if (!payload.slug) delete payload.slug
      const res = await fetch(editing ? `/api/categories/${editing.id}` : '/api/categories', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to save category')
      toast.success(editing ? 'Category updated' : 'Category created')
      resetForm()
      await load()
      setDialogOpen(false)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  async function archiveCategory(id: string) {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to archive')
      toast.success('Category archived')
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to archive')
    }
  }

  async function restoreCategory(id: string) {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to restore')
      toast.success('Category restored')
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to restore')
    }
  }

  return (
    <RoleLayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
            <p className="text-gray-600">Organize courses into categories for better navigation</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={() => { resetForm(); setDialogOpen(true) }}>
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Category' : 'Create New Category'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Category Name <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder="Enter category name" 
                    value={form.name} 
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: '' })
                    }}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <Input 
                    placeholder="category-slug (auto-generated if empty)" 
                    value={form.slug} 
                    onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from name</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input placeholder="Brief description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Icon</label>
                    <Input placeholder="Icon name" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Color</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={form.color || '#3B82F6'} 
                        onChange={(e) => {
                          setForm({ ...form, color: e.target.value })
                          if (errors.color) setErrors({ ...errors, color: '' })
                        }} 
                        className="h-10 w-12 rounded border" 
                      />
                      <Input 
                        placeholder="#3B82F6" 
                        value={form.color} 
                        onChange={(e) => {
                          setForm({ ...form, color: e.target.value })
                          if (errors.color) setErrors({ ...errors, color: '' })
                        }}
                        className={errors.color ? 'border-red-500' : ''}
                      />
                    </div>
                    {errors.color && <p className="text-sm text-red-600 mt-1">{errors.color}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Sort Order</label>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    value={form.sortOrder} 
                    onChange={(e) => {
                      setForm({ ...form, sortOrder: Number(e.target.value) })
                      if (errors.sortOrder) setErrors({ ...errors, sortOrder: '' })
                    }}
                    className={errors.sortOrder ? 'border-red-500' : ''}
                  />
                  {errors.sortOrder && <p className="text-sm text-red-600 mt-1">{errors.sortOrder}</p>}
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false) }} disabled={saving}>Cancel</Button>
                  <Button onClick={submitForm} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Save Changes' : 'Create Category')}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Categories ({categories.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant={showArchived ? 'default' : 'outline'} size="sm" onClick={() => setShowArchived(!showArchived)}>
                  {showArchived ? 'Showing Archived' : 'Show Archived'}
                </Button>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-gray-500">/{category.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {category.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{category.courseCount}</div>
                      <div className="text-sm text-gray-500">courses</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={category.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                        }
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{category.sortOrder}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">{formatDate(category.createdAt)}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(category); setForm({ name: category.name, slug: category.slug, description: category.description || '', icon: category.icon || '', color: category.color || '', sortOrder: category.sortOrder || 0, isActive: !!category.isActive }); setDialogOpen(true) }}>
                            <Edit className="w-4 h-4" /> Edit
                          </DropdownMenuItem>
                          {category.isActive ? (
                            <DropdownMenuItem className="text-red-600" onClick={() => setConfirmId(category.id)}>
                              <Trash2 className="w-4 h-4" /> Archive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => restoreCategory(category.id)}>
                              <RotateCcw className="w-4 h-4" /> Restore
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

          
      </div>
        {/* Confirm Archive Dialog */}
        <ConfirmDialog open={!!confirmId} onOpenChange={(open) => { if (!open) setConfirmId(null) }}>
          <ConfirmContent>
            <ConfirmHeader>
              <ConfirmTitle>Archive category?</ConfirmTitle>
            </ConfirmHeader>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">This will archive the category. You can restore it later from the actions menu.</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
                <Button className="text-white" onClick={async () => { if (confirmId) { await archiveCategory(confirmId); setConfirmId(null) } }}>Archive</Button>
              </div>
            </div>
          </ConfirmContent>
        </ConfirmDialog>
    </RoleLayoutWrapper>
  )
}

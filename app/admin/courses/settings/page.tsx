"use client"
import { RoleLayoutWrapper } from "@/components/role-layout-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, RotateCcw, MoreHorizontal, Edit, Trash2, Archive, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

type Row = { id: string; name: string; slug?: string; description?: string; sortOrder?: number; isActive: boolean; createdAt?: string }

export default function CourseSettingsPage() {
  const [activeTab, setActiveTab] = useState("curriculum")
  return (
    <RoleLayoutWrapper>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Settings</h1>
            <p className="text-gray-600">Manage curriculum, course types and formats</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="types">Course Types</TabsTrigger>
            <TabsTrigger value="formats">Course Formats</TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum">
            <ManageSimple
              title="Curriculum"
              columns={["Name", "Type", "Level", "Status", "Created", "Actions"]}
              fetchRows={async (page: number, limit: number, search: string) => {
                const params = new URLSearchParams({
                  page: page.toString(),
                  limit: limit.toString(),
                  includeInactive: 'true',
                  search
                })
                const res = await fetch(`/api/curriculum?${params}`)
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
                return { data: json.data, pagination: json.pagination }
              }}
              createForm={(form, setForm) => (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Input placeholder="BRITISH / SCOTTISH / INTERNATIONAL" value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Level</label>
                    <Input placeholder="GCSE / A_LEVEL / ..." value={form.level || ''} onChange={(e) => setForm({ ...form, level: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              )}
              save={async (form, editingId) => {
                const method = editingId ? 'PUT' : 'POST'
                const url = editingId ? `/api/curriculum/${editingId}` : '/api/curriculum'
                const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
              }}
              archive={async (id) => {
                const res = await fetch(`/api/curriculum/${id}`, { method: 'DELETE' })
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
              }}
              restore={async (id) => {
                const res = await fetch(`/api/curriculum/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true }) })
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
              }}
              renderRow={(row: any) => [row.name, row.type, row.level, row.isActive ? 'Active' : 'Archived', formatDate(row.createdAt)]}
            />
          </TabsContent>

          <TabsContent value="types">
            <ManageSimple
              title="Course Types"
              columns={["Name", "Slug", "Status", "Created", "Actions"]}
              fetchRows={async (page: number, limit: number, search: string) => {
                const params = new URLSearchParams({
                  page: page.toString(),
                  limit: limit.toString(),
                  includeInactive: 'true',
                  search
                })
                const res = await fetch(`/api/course-types?${params}`)
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
                return { data: json.data, pagination: json.pagination }
              }}
              createForm={(form, setForm) => (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input 
                      value={form.name || ''} 
                      onChange={(e) => {
                        const name = e.target.value
                        const slug = generateSlug(name)
                        setForm({ ...form, name, slug })
                      }} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <Input 
                      value={form.slug || ''} 
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="auto-generated-from-name"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              )}
              save={async (form, editingId) => {
                const method = editingId ? 'PUT' : 'POST'
                const url = editingId ? `/api/course-types/${editingId}` : '/api/course-types'
                const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
              }}
              archive={async (id) => {
                const res = await fetch(`/api/course-types/${id}`, { method: 'DELETE' })
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
              }}
              restore={async (id) => {
                const res = await fetch(`/api/course-types/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true }) })
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
              }}
              renderRow={(row: any) => [row.name, row.slug, row.isActive ? 'Active' : 'Archived', formatDate(row.createdAt)]}
            />
          </TabsContent>

          <TabsContent value="formats">
            <ManageSimple
              title="Course Formats"
              columns={["Name", "Slug", "Status", "Created", "Actions"]}
              fetchRows={async (page: number, limit: number, search: string) => {
                const params = new URLSearchParams({
                  page: page.toString(),
                  limit: limit.toString(),
                  includeInactive: 'true',
                  search
                })
                const res = await fetch(`/api/course-formats?${params}`)
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
                return { data: json.data, pagination: json.pagination }
              }}
              createForm={(form, setForm) => (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input 
                      value={form.name || ''} 
                      onChange={(e) => {
                        const name = e.target.value
                        const slug = generateSlug(name)
                        setForm({ ...form, name, slug })
                      }} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Slug</label>
                    <Input 
                      value={form.slug || ''} 
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="auto-generated-from-name"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              )}
              save={async (form, editingId) => {
                const method = editingId ? 'PUT' : 'POST'
                const url = editingId ? `/api/course-formats/${editingId}` : '/api/course-formats'
                const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
              }}
              archive={async (id) => {
                const res = await fetch(`/api/course-formats/${id}`, { method: 'DELETE' })
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
              }}
              restore={async (id) => {
                const res = await fetch(`/api/course-formats/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true }) })
                const json = await res.json()
                if (!json.success) throw new Error(json.error)
              }}
              renderRow={(row: any) => [row.name, row.slug, row.isActive ? 'Active' : 'Archived', formatDate(row.createdAt)]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </RoleLayoutWrapper>
  )
}

function formatDate(value: any) {
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  } catch {
    return ''
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading/trailing spaces
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

function ManageSimple({ title, columns, fetchRows, createForm, save, archive, restore, renderRow }: {
  title: string
  columns: string[]
  fetchRows: (page: number, limit: number, search: string) => Promise<{ data: any[], pagination: any }>
  createForm: (form: any, setForm: (f: any) => void) => React.ReactNode
  save: (form: any, editingId?: string | null) => Promise<void>
  archive: (id: string) => Promise<void>
  restore: (id: string) => Promise<void>
  renderRow: (row: any) => React.ReactNode[]
}) {
  const [items, setItems] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<any>(null)

  async function load() {
    try { 
      setLoading(true)
      const result = await fetchRows(page, limit, searchTerm)
      setItems(result.data)
      setPagination(result.pagination)
    } catch (e: any) { 
      toast.error(e.message || 'Failed to load') 
    } finally { 
      setLoading(false) 
    }
  }
  
  useEffect(() => { load() }, [page, limit])
  
  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        load()
      } else {
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const filtered = useMemo(() => {
    // Filter by active status only (search is now handled server-side)
    return showArchived ? items : items.filter((r) => r.isActive !== false)
  }, [items, showArchived])

  async function onSave() {
    try { setSaving(true); await save(form, editing?.id || null); setDialogOpen(false); setForm({}); setEditing(null); await load(); toast.success('Saved') } catch (e: any) { toast.error(e.message || 'Failed to save') } finally { setSaving(false) }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title} ({pagination?.total || 0})</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant={showArchived ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Showing Archived' : 'Show Archived'}
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RotateCcw className="w-4 h-4" /></Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={() => { setForm({}); setEditing(null); setDialogOpen(true) }}><Plus className="w-4 h-4" /> Add</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Create'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {createForm(form, setForm)}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                  <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (<TableHead key={c}>{c}</TableHead>))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                    {showArchived ? 'No archived items found' : 'No items found. Click "Add" to create one.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row: any) => (
                <TableRow key={row.id}>
                  {renderRow(row).map((cell, idx) => (<TableCell key={idx}>{cell}</TableCell>))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditing(row); setForm(row); setDialogOpen(true) }}><Edit className="w-4 h-4" /> Edit</DropdownMenuItem>
                        {row.isActive ? (
                          <DropdownMenuItem className="text-red-600" onClick={() => setConfirmId(row.id)}><Trash2 className="w-4 h-4" /> Archive</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={async () => { await restore(row.id); await load(); toast.success('Restored') }}><RotateCcw className="w-4 h-4" /> Restore</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        )}
        <Dialog open={!!confirmId} onOpenChange={(open) => { if (!open) setConfirmId(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Archive item?</DialogTitle></DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
              <Button onClick={async () => { if (confirmId) { await archive(confirmId); setConfirmId(null); await load(); toast.success('Archived') } }}>Archive</Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} items
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm">
                Page {page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <select
                className="ml-2 border rounded px-2 py-1 text-sm"
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  userId: string | null
}

export function EditUserDialog({ open, onOpenChange, onSuccess, userId }: EditUserDialogProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [fetchingUser, setFetchingUser] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [changePassword, setChangePassword] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    role: "",
    status: "ACTIVE",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    joinedDate: "",
    bio: "",
    password: "",
    
    // Tutor fields
    qualifications: [] as string[],
    qualificationInput: "",
    experience: "",
    specializations: [] as string[],
    specializationInput: "",
    hourlyRate: "",
    
    // Student fields
    ageGroup: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    address: "",
    emergencyContact: "",
    guardianRelation: "",
  })

  useEffect(() => {
    if (open && userId) {
      fetchUser()
    }
  }, [open, userId])

  const fetchUser = async () => {
    if (!userId) return

    setFetchingUser(true)
    try {
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user')
      }

      const user = data.data
      
      // Parse name into firstName and lastName if available
      const nameParts = user.name ? user.name.split(' ') : []
      const firstName = user.firstName || (nameParts.length > 0 ? nameParts[0] : "")
      const lastName = user.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : "")
      
      setFormData({
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
        status: user.status || "ACTIVE",
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
        joinedDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : "",
        bio: user.bio || "",
        password: "",
        
        qualifications: user.qualifications || [],
        qualificationInput: "",
        experience: user.experience?.toString() || "",
        specializations: user.specializations || [],
        specializationInput: "",
        hourlyRate: user.hourlyRate?.toString() || "",
        
        ageGroup: user.ageGroup || "",
        parentName: user.parentName || "",
        parentEmail: user.parentEmail || "",
        parentPhone: user.parentPhone || "",
        address: user.address || "",
        emergencyContact: user.emergencyContact || "",
        guardianRelation: user.guardianRelation || "",
      })
      setSelectedRole(user.role || "")
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch user')
    } finally {
      setFetchingUser(false)
    }
  }

  const canEditRole = (targetRole: string) => {
    if (session?.user.role === 'SUPER_ADMIN') {
      return true
    }
    if (session?.user.role === 'ADMIN') {
      return !['ADMIN', 'SUPER_ADMIN'].includes(targetRole)
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Dynamically calculate full name from firstName and lastName
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
      
      const payload: any = {
        name: fullName || formData.email.split('@')[0], // Fallback to email username if no names provided
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        createdAt: formData.joinedDate ? new Date(formData.joinedDate).toISOString() : undefined,
        bio: formData.bio || undefined,
      }

      // Only include role if user can change it
      if (canEditRole(selectedRole) && formData.role !== selectedRole) {
        payload.role = formData.role
      }

      // Include password only if changePassword is checked
      if (changePassword && formData.password) {
        payload.password = formData.password
      }

      // Add role-specific fields
      if (formData.role === 'TUTOR') {
        payload.qualifications = formData.qualifications
        payload.experience = formData.experience ? parseInt(formData.experience) : undefined
        payload.specializations = formData.specializations
        payload.hourlyRate = formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined
      }

      if (formData.role === 'STUDENT') {
        payload.ageGroup = formData.ageGroup || undefined
        payload.parentName = formData.parentName || undefined
        payload.parentEmail = formData.parentEmail || undefined
        payload.parentPhone = formData.parentPhone || undefined
        payload.address = formData.address || undefined
        payload.emergencyContact = formData.emergencyContact || undefined
        payload.guardianRelation = formData.guardianRelation || undefined
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      toast.success('User updated successfully')
      handleClose()
      onSuccess()

    } catch (error: any) {
      toast.error(error.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      email: "",
      phone: "",
      role: "",
      status: "ACTIVE",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      joinedDate: "",
      bio: "",
      password: "",
      qualifications: [],
      qualificationInput: "",
      experience: "",
      specializations: [],
      specializationInput: "",
      hourlyRate: "",
      ageGroup: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      address: "",
      emergencyContact: "",
      guardianRelation: "",
    })
    setSelectedRole("")
    setChangePassword(false)
    onOpenChange(false)
  }

  const addQualification = () => {
    if (formData.qualificationInput.trim()) {
      setFormData({
        ...formData,
        qualifications: [...formData.qualifications, formData.qualificationInput.trim()],
        qualificationInput: ""
      })
    }
  }

  const removeQualification = (index: number) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications.filter((_, i) => i !== index)
    })
  }

  const addSpecialization = () => {
    if (formData.specializationInput.trim()) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, formData.specializationInput.trim()],
        specializationInput: ""
      })
    }
  }

  const removeSpecialization = (index: number) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((_, i) => i !== index)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and settings.
          </DialogDescription>
        </DialogHeader>

        {fetchingUser ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  {canEditRole(selectedRole) ? (
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {session?.user.role === 'SUPER_ADMIN' && (
                          <>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </>
                        )}
                        <SelectItem value="TUTOR">Tutor</SelectItem>
                        <SelectItem value="STUDENT">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={formData.role.replace('_', ' ')} disabled className="bg-gray-100" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                  />
                </div>

                <div>
                  <Label htmlFor="joinedDate">Joined Date</Label>
                  <Input
                    id="joinedDate"
                    type="date"
                    value={formData.joinedDate}
                    onChange={(e) => setFormData({ ...formData, joinedDate: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    min="2000-01-01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Date when the user joined the organization
                  </p>
                </div>
              </div>

              {/* Password Change */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="changePassword"
                    checked={changePassword}
                    onCheckedChange={(checked) => setChangePassword(checked as boolean)}
                  />
                  <Label htmlFor="changePassword" className="cursor-pointer">
                    Change Password
                  </Label>
                </div>

                {changePassword && (
                  <div>
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter new password (min 8 characters)"
                      minLength={8}
                    />
                  </div>
                )}
              </div>

              {/* Tutor-specific fields */}
              {(formData.role === 'TUTOR') && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-sm">Tutor Information</h3>
                  
                  <div>
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <div className="flex gap-2">
                      <Input
                        id="qualifications"
                        value={formData.qualificationInput}
                        onChange={(e) => setFormData({ ...formData, qualificationInput: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                        placeholder="Add qualification and press Enter"
                      />
                      <Button type="button" onClick={addQualification} variant="outline">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.qualifications.map((qual, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                          {qual}
                          <button type="button" onClick={() => removeQualification(index)} className="text-blue-600 hover:text-blue-800">×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specializations">Specializations</Label>
                    <div className="flex gap-2">
                      <Input
                        id="specializations"
                        value={formData.specializationInput}
                        onChange={(e) => setFormData({ ...formData, specializationInput: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                        placeholder="Add specialization and press Enter"
                      />
                      <Button type="button" onClick={addSpecialization} variant="outline">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.specializations.map((spec, index) => (
                        <div key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                          {spec}
                          <button type="button" onClick={() => removeSpecialization(index)} className="text-purple-600 hover:text-purple-800">×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="experience">Experience (years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Student-specific fields */}
              {(formData.role === 'STUDENT') && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-sm">Student Information</h3>
                  
                  <div>
                    <Label htmlFor="ageGroup">Age Group</Label>
                    <Select
                      value={formData.ageGroup}
                      onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="11-14">11-14 years</SelectItem>
                        <SelectItem value="15-17">15-17 years</SelectItem>
                        <SelectItem value="18+">18+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="parentName">Parent/Guardian Name</Label>
                      <Input
                        id="parentName"
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="guardianRelation">Relation</Label>
                      <Input
                        id="guardianRelation"
                        value={formData.guardianRelation}
                        onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                        placeholder="e.g., Father, Mother"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="parentEmail">Parent Email</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="parentPhone">Parent Phone</Label>
                      <Input
                        id="parentPhone"
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="bio">Bio / Notes</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={2}
                  placeholder="Additional information..."
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update User
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}


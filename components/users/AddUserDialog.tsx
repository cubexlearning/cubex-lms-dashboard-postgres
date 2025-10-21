"use client"

import { useState } from "react"
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
import { Loader2, Eye, EyeOff, Copy, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    role: "",
    status: "ACTIVE",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    joinedDate: new Date().toISOString().split('T')[0], // Default to today
    bio: "",
    
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

  const canAddRole = (role: string) => {
    if (session?.user.role === 'SUPER_ADMIN') {
      return ['ADMIN', 'TUTOR', 'STUDENT'].includes(role)
    }
    if (session?.user.role === 'ADMIN') {
      return ['TUTOR', 'STUDENT'].includes(role)
    }
    return false
  }

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return "Email is required"
    if (!emailRegex.test(email)) return "Please enter a valid email address"
    return ""
  }

  const validatePhone = (phone: string) => {
    if (!phone) return "Phone number is required"
    
    // Remove all non-digit characters except + at the beginning
    const cleaned = phone.replace(/[^\d+]/g, '')
    
    // Check if it starts with + (international) or is a regular number
    const phoneRegex = /^(\+[1-9]\d{0,14}|\d{7,15})$/
    
    if (!phoneRegex.test(cleaned)) {
      return "Please enter a valid phone number (7-15 digits, optionally starting with +)"
    }
    
    return ""
  }

  const validateName = (name: string, fieldName: string) => {
    if (!name) return `${fieldName} is required`
    if (name.trim().length < 1) return `${fieldName} must be at least 1 character`
    if (name.trim().length > 50) return `${fieldName} must be less than 50 characters`
    return ""
  }

  const validateDate = (date: string, fieldName: string, isRequired: boolean = false) => {
    if (!date) return isRequired ? `${fieldName} is required` : ""
    const dateObj = new Date(date)
    const today = new Date()
    if (isNaN(dateObj.getTime())) return "Please enter a valid date"
    if (dateObj > today) return `${fieldName} cannot be in the future`
    return ""
  }

  const validateAgeGroup = (ageGroup: string) => {
    if (!ageGroup) return "Age group is required for students"
    return ""
  }

  const validateParentInfo = (parentName: string, parentEmail: string, parentPhone: string, studentEmail?: string) => {
    const errors: string[] = []
    
    // Parent email is now optional - can be empty or same as student email
    if (parentEmail && parentEmail !== studentEmail) {
      const emailError = validateEmail(parentEmail)
      if (emailError) errors.push(emailError)
    }
    
    // Parent phone is required when parent name is provided
    if (parentName && !parentPhone) {
      errors.push("Parent phone is required when parent name is provided")
    }
    if (parentPhone) {
      const phoneError = validatePhone(parentPhone)
      if (phoneError) errors.push(phoneError)
    }
    return errors.join(", ")
  }

  const validateEmergencyContact = (emergencyContact: string) => {
    if (!emergencyContact) return "" // Optional field
    return validatePhone(emergencyContact) // Use same phone validation
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Basic validation
    newErrors.firstName = validateName(formData.firstName, "First name")
    newErrors.lastName = validateName(formData.lastName, "Last name")
    newErrors.email = validateEmail(formData.email)
    newErrors.phone = validatePhone(formData.phone)
    newErrors.role = !formData.role ? "Role is required" : ""
    newErrors.dateOfBirth = validateDate(formData.dateOfBirth, "Date of birth")
    newErrors.joinedDate = validateDate(formData.joinedDate, "Joined date", true)

    // Role-specific validation
    if (formData.role === 'STUDENT') {
      newErrors.ageGroup = validateAgeGroup(formData.ageGroup)
      const parentError = validateParentInfo(formData.parentName, formData.parentEmail, formData.parentPhone, formData.email)
      if (parentError) {
        newErrors.parentInfo = parentError
      }
      newErrors.emergencyContact = validateEmergencyContact(formData.emergencyContact)
    }

    // Experience validation for tutors
    if (formData.role === 'TUTOR' && formData.experience) {
      const experience = parseInt(formData.experience)
      if (isNaN(experience) || experience < 0 || experience > 50) {
        newErrors.experience = "Experience must be between 0 and 50 years"
      }
    }

    setErrors(newErrors)
    return Object.values(newErrors).every(error => error === "")
  }

  const clearFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting')
      return
    }

    setLoading(true)

    try {
      // Dynamically calculate full name from firstName and lastName
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
      
      const payload: any = {
        name: fullName || formData.email.split('@')[0], // Fallback to email username if no names provided
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        status: formData.status,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        createdAt: formData.joinedDate ? new Date(formData.joinedDate).toISOString() : undefined,
        bio: formData.bio || undefined,
      }

      // Add role-specific fields
      if (formData.role === 'TUTOR') {
        payload.qualifications = formData.qualifications
        payload.experience = formData.experience ? parseInt(formData.experience) : undefined
        payload.specializations = formData.specializations
        payload.hourlyRate = 0 // Default value
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

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle backend validation errors
        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors)
          toast.error('Please fix the validation errors')
          return
        }
        throw new Error(data.error || 'Failed to create user')
      }

      // Show credentials
      if (data.credentials) {
        setCredentials({
          email: data.credentials.email,
          password: data.credentials.temporaryPassword
        })
        toast.success('User created successfully! Please save the credentials.')
      } else {
        toast.success('User created successfully')
        handleClose()
        onSuccess()
      }

    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'Failed to create user')
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
      joinedDate: new Date().toISOString().split('T')[0],
      bio: "",
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
    setCredentials(null)
    setPasswordCopied(false)
    setShowPassword(false)
    setErrors({})
    onOpenChange(false)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setPasswordCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setPasswordCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
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

  // If credentials are shown, display them
  if (credentials) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Created Successfully!</DialogTitle>
            <DialogDescription>
              Please save these credentials and share them with the user. The password cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={credentials.email} readOnly className="bg-gray-50" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(credentials.email)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Temporary Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative flex-1">
                        <Input
                          value={credentials.password}
                          type={showPassword ? "text" : "password"}
                          readOnly
                          className="bg-gray-50 pr-10"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(credentials.password)}
                      >
                        {passwordCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      The user should change this password after their first login.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={() => {
              handleClose()
              onSuccess()
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with role-based access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
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
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value })
                      clearFieldError('firstName')
                    }}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => {
                    setFormData({ ...formData, role: value })
                    setSelectedRole(value)
                  }}
                >
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {session?.user.role === 'SUPER_ADMIN' && (
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    )}
                    {canAddRole('TUTOR') && <SelectItem value="TUTOR">Tutor</SelectItem>}
                    {canAddRole('STUDENT') && <SelectItem value="STUDENT">Student</SelectItem>}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500 mt-1">{errors.role}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      clearFieldError('email')
                    }}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      clearFieldError('phone')
                    }}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
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
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <Label htmlFor="joinedDate">Joined Date *</Label>
                <Input
                  id="joinedDate"
                  type="date"
                  value={formData.joinedDate}
                  onChange={(e) => setFormData({ ...formData, joinedDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  min="2000-01-01"
                  className={errors.joinedDate ? "border-red-500" : ""}
                />
                {errors.joinedDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.joinedDate}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Date when the user joined the organization
                </p>
              </div>
            </div>

            {/* Tutor-specific fields */}
            {selectedRole === 'TUTOR' && (
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
                    className={errors.experience ? "border-red-500" : ""}
                    min="0"
                    max="50"
                  />
                  {errors.experience && (
                    <p className="text-sm text-red-500 mt-1">{errors.experience}</p>
                  )}
                </div>
              </div>
            )}

            {/* Student-specific fields */}
            {selectedRole === 'STUDENT' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-sm">Student Information</h3>
                
                <div>
                  <Label htmlFor="ageGroup">Age Group *</Label>
                  <Select
                    value={formData.ageGroup}
                    onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
                  >
                    <SelectTrigger className={errors.ageGroup ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="11-14">11-14 years</SelectItem>
                      <SelectItem value="15-17">15-17 years</SelectItem>
                      <SelectItem value="18+">18+ years</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.ageGroup && (
                    <p className="text-sm text-red-500 mt-1">{errors.ageGroup}</p>
                  )}
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
                    <Label htmlFor="parentEmail">Parent Email (Optional)</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      className={errors.parentEmail ? "border-red-500" : ""}
                      placeholder="Can be same as student email or left empty"
                    />
                    {errors.parentEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.parentEmail}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty if parent doesn't have an email, or use student's email
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="parentPhone">Parent Phone</Label>
                    <Input
                      id="parentPhone"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className={errors.parentPhone ? "border-red-500" : ""}
                    />
                    {errors.parentPhone && (
                      <p className="text-sm text-red-500 mt-1">{errors.parentPhone}</p>
                    )}
                  </div>
                </div>

                {errors.parentInfo && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{errors.parentInfo}</p>
                  </div>
                )}

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
                    onChange={(e) => {
                      setFormData({ ...formData, emergencyContact: e.target.value })
                      clearFieldError('emergencyContact')
                    }}
                    className={errors.emergencyContact ? "border-red-500" : ""}
                  />
                  {errors.emergencyContact && (
                    <p className="text-sm text-red-500 mt-1">{errors.emergencyContact}</p>
                  )}
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
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}



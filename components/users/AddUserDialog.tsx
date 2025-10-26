"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { isValidPhoneNumber } from "libphonenumber-js"
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

// Zod validation schema
const addUserSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .max(100, "Email must not exceed 100 characters")
    .email("Invalid email address")
    .toLowerCase(),
  phone: z.string()
    .min(1, "Phone is required")
    .refine((val) => {
      try {
        return isValidPhoneNumber(val)
      } catch {
        return false
      }
    }, "Invalid phone number format"),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  firstName: z.string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z.string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  dateOfBirth: z.string().optional(),
  joinedDate: z.string().min(1, "Joined date is required"),
  bio: z.string()
    .max(500, "Bio must not exceed 500 characters")
    .optional(),
  
  // Tutor fields
  qualifications: z.array(
    z.string()
      .min(2, "Qualification must be at least 2 characters")
      .max(100, "Qualification must not exceed 100 characters")
  )
    .max(5, "Maximum 5 qualifications allowed")
    .default([]),
  qualificationInput: z.string()
    .max(100, "Qualification must not exceed 100 characters")
    .default(""),
  experience: z.string()
    .refine((val) => {
      if (!val) return true // Allow empty for non-tutors
      const num = parseInt(val)
      return !isNaN(num) && num >= 0 && num <= 50
    }, "Experience must be between 0 and 50 years")
    .optional(),
  specializations: z.array(
    z.string()
      .min(2, "Specialization must be at least 2 characters")
      .max(100, "Specialization must not exceed 100 characters")
  )
    .max(5, "Maximum 5 specializations allowed")
    .default([]),
  specializationInput: z.string()
    .max(100, "Specialization must not exceed 100 characters")
    .default(""),
  hourlyRate: z.string()
    .refine((val) => {
      if (!val) return true
      const num = parseFloat(val)
      return !isNaN(num) && num >= 0 && num <= 10000
    }, "Hourly rate must be between 0 and 10000")
    .optional(),
  
  // Student fields
  ageGroup: z.string().optional(),
  parentName: z.string()
    .max(100, "Parent name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s'-]*$/, "Parent name can only contain letters, spaces, hyphens, and apostrophes")
    .optional(),
  parentEmail: z.string()
    .max(100, "Email must not exceed 100 characters")
    .email("Invalid email")
    .toLowerCase()
    .optional()
    .or(z.literal("")),
  parentPhone: z.string()
    .refine((val) => {
      if (!val) return true
      try {
        return isValidPhoneNumber(val)
      } catch {
        return false
      }
    }, "Invalid phone number format")
    .optional(),
  address: z.string()
    .max(200, "Address must not exceed 200 characters")
    .optional(),
  emergencyContact: z.string()
    .refine((val) => {
      if (!val) return true
      try {
        return isValidPhoneNumber(val)
      } catch {
        return false
      }
    }, "Invalid phone number format")
    .optional(),
  guardianRelation: z.string()
    .max(50, "Relation must not exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]*$/, "Relation can only contain letters, spaces, hyphens, and apostrophes")
    .optional(),
}).refine((data) => {
  // If role is STUDENT, ageGroup is required
  if (data.role === 'STUDENT' && !data.ageGroup) {
    return false
  }
  return true
}, {
  message: "Age group is required for students",
  path: ["ageGroup"]
}).refine((data) => {
  // If role is TUTOR, qualifications are required
  if (data.role === 'TUTOR' && data.qualifications.length === 0) {
    return false
  }
  return true
}, {
  message: "At least one qualification is required for tutors",
  path: ["qualificationInput"]
}).refine((data) => {
  // If role is TUTOR, specializations are required
  if (data.role === 'TUTOR' && data.specializations.length === 0) {
    return false
  }
  return true
}, {
  message: "At least one specialization is required for tutors",
  path: ["specializationInput"]
}).refine((data) => {
  // If role is TUTOR, experience is required
  if (data.role === 'TUTOR' && !data.experience) {
    return false
  }
  return true
}, {
  message: "Experience is required for tutors",
  path: ["experience"]
})

type AddUserFormData = z.infer<typeof addUserSchema>

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const { data: session } = useSession()
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: "",
      phone: "",
      role: "",
      status: "ACTIVE",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      joinedDate: new Date().toISOString().split('T')[0], // Default to today
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
    },
    mode: "onChange"
  })

  const { handleSubmit, reset, setValue: _setValue, watch, setError, formState: { errors, isSubmitting } } = form

  const setValue = (key: keyof AddUserFormData , value: any) => {
    _setValue(key, value,{
      shouldDirty:true,
      shouldTouch:true,
      shouldValidate:true
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

  const onSubmit = async (data: AddUserFormData) => {
    try {
      // Dynamically calculate full name from firstName and lastName
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()
      
      const payload: any = {
        name: fullName || data.email.split('@')[0], // Fallback to email username if no names provided
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        createdAt: data.joinedDate ? new Date(data.joinedDate).toISOString() : undefined,
        bio: data.bio || undefined,
      }

      // Add role-specific fields
      if (data.role === 'TUTOR') {
        payload.qualifications = data.qualifications
        payload.experience = data.experience ? parseInt(data.experience) : undefined
        payload.specializations = data.specializations
        payload.hourlyRate = 0 // Default value
      }

      if (data.role === 'STUDENT') {
        payload.ageGroup = data.ageGroup || undefined
        payload.parentName = data.parentName || undefined
        payload.parentEmail = data.parentEmail || undefined
        payload.parentPhone = data.parentPhone || undefined
        payload.address = data.address || undefined
        payload.emergencyContact = data.emergencyContact || undefined
        payload.guardianRelation = data.guardianRelation || undefined
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create user')
      }

      // Show credentials
      if (responseData.credentials) {
        setCredentials({
          email: responseData.credentials.email,
          password: responseData.credentials.temporaryPassword
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
      if(error.message === "Email already exists"){
        setError("email", {
          type: "manual",
          message: "Email already exists"
        })
      }
    }
  }

  const handleClose = () => {
    reset({
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
    const qualificationInput = watch("qualificationInput")
    const qualifications = watch("qualifications")
    
    if (qualifications.length >= 5) {
      toast.error("Maximum 5 qualifications allowed")
      return
    }
    
    const trimmedInput = qualificationInput.trim()
    
    if (!trimmedInput) {
      toast.error("Qualification cannot be empty")
      return
    }
    
    if (trimmedInput.length < 2) {
      toast.error("Qualification must be at least 2 characters")
      return
    }
    
    if (trimmedInput.length > 100) {
      toast.error("Qualification must not exceed 100 characters")
      return
    }
    
    setValue("qualifications", [...qualifications, trimmedInput])
    setValue("qualificationInput", "")
  }

  const removeQualification = (index: number) => {
    const qualifications = watch("qualifications")
    setValue("qualifications", qualifications.filter((_, i) => i !== index))
  }

  const addSpecialization = () => {
    const specializationInput = watch("specializationInput")
    const specializations = watch("specializations")
    
    if (specializations.length >= 5) {
      toast.error("Maximum 5 specializations allowed")
      return
    }
    
    const trimmedInput = specializationInput.trim()
    
    if (!trimmedInput) {
      toast.error("Specialization cannot be empty")
      return
    }
    
    if (trimmedInput.length < 2) {
      toast.error("Specialization must be at least 2 characters")
      return
    }
    
    if (trimmedInput.length > 100) {
      toast.error("Specialization must not exceed 100 characters")
      return
    }
    
    setValue("specializations", [...specializations, trimmedInput])
    setValue("specializationInput", "")
  }

  const removeSpecialization = (index: number) => {
    const specializations = watch("specializations")
    setValue("specializations", specializations.filter((_, i) => i !== index))
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

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={watch("firstName")}
                    onChange={(e) => setValue("firstName", e.target.value)}
                    className={errors.firstName ? "border-red-500" : ""}
                    minLength={2}
                    maxLength={50}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={watch("lastName")}
                    onChange={(e) => setValue("lastName", e.target.value)}
                    className={errors.lastName ? "border-red-500" : ""}
                    minLength={2}
                    maxLength={50}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={watch("role")}
                  onValueChange={(value) => {
                    setValue("role", value)
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
                  <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={watch("email")}
                    onChange={(e) => setValue("email", e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                    maxLength={100}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={watch("phone")}
                    onChange={(e) => setValue("phone", e.target.value)}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={watch("dateOfBirth")}
                  onChange={(e) => setValue("dateOfBirth", e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min="1900-01-01"
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="joinedDate">Joined Date *</Label>
                <Input
                  id="joinedDate"
                  type="date"
                  value={watch("joinedDate")}
                  onChange={(e) => setValue("joinedDate", e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min="2000-01-01"
                  className={errors.joinedDate ? "border-red-500" : ""}
                />
                {errors.joinedDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.joinedDate.message}</p>
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
                  <Label htmlFor="qualifications">Qualifications * ({watch("qualifications").length}/5)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="qualifications"
                      value={watch("qualificationInput")}
                      onChange={(e) => setValue("qualificationInput", e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                      placeholder="Add qualification and press Enter (min 2 chars)"
                      minLength={2}
                      maxLength={100}
                      className={errors.qualificationInput ? "border-red-500" : ""}
                      disabled={watch("qualifications").length >= 5}
                    />
                    <Button 
                      type="button" 
                      onClick={addQualification} 
                      variant="outline"
                      disabled={watch("qualifications").length >= 5}
                    >
                      Add
                    </Button>
                  </div>
                  {errors.qualificationInput && (
                    <p className="text-sm text-red-500 mt-1">{errors.qualificationInput.message}</p>
                  )}
                  {errors.qualifications && (
                    <p className="text-sm text-red-500 mt-1">{errors.qualifications.message}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {watch("qualifications").map((qual, index) => (
                      <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                        {qual}
                        <button type="button" onClick={() => removeQualification(index)} className="text-blue-600 hover:text-blue-800">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="specializations">Specializations * ({watch("specializations").length}/5)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="specializations"
                      value={watch("specializationInput")}
                      onChange={(e) => setValue("specializationInput", e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                      placeholder="Add specialization and press Enter (min 2 chars)"
                      minLength={2}
                      maxLength={100}
                      className={errors.specializationInput ? "border-red-500" : ""}
                      disabled={watch("specializations").length >= 5}
                    />
                    <Button 
                      type="button" 
                      onClick={addSpecialization} 
                      variant="outline"
                      disabled={watch("specializations").length >= 5}
                    >
                      Add
                    </Button>
                  </div>
                  {errors.specializationInput && (
                    <p className="text-sm text-red-500 mt-1">{errors.specializationInput.message}</p>
                  )}
                  {errors.specializations && (
                    <p className="text-sm text-red-500 mt-1">{errors.specializations.message}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {watch("specializations").map((spec, index) => (
                      <div key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                        {spec}
                        <button type="button" onClick={() => removeSpecialization(index)} className="text-purple-600 hover:text-purple-800">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="experience">Experience (years) *</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={watch("experience")}
                    onChange={(e) => setValue("experience", e.target.value)}
                    className={errors.experience ? "border-red-500" : ""}
                    min="0"
                    max="50"
                    step="1"
                    required
                  />
                  {errors.experience && (
                    <p className="text-sm text-red-500 mt-1">{errors.experience.message}</p>
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
                    value={watch("ageGroup")}
                    onValueChange={(value) => setValue("ageGroup", value)}
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
                    <p className="text-sm text-red-500 mt-1">{errors.ageGroup.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentName">Parent/Guardian Name</Label>
                    <Input
                      id="parentName"
                      value={watch("parentName")}
                      onChange={(e) => setValue("parentName", e.target.value)}
                      maxLength={100}
                    />
                    {errors.parentName && (
                      <p className="text-sm text-red-500 mt-1">{errors.parentName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="guardianRelation">Relation</Label>
                    <Input
                      id="guardianRelation"
                      value={watch("guardianRelation")}
                      onChange={(e) => setValue("guardianRelation", e.target.value)}
                      placeholder="e.g., Father, Mother"
                      maxLength={50}
                    />
                    {errors.guardianRelation && (
                      <p className="text-sm text-red-500 mt-1">{errors.guardianRelation.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentEmail">Parent Email (Optional)</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={watch("parentEmail")}
                      onChange={(e) => setValue("parentEmail", e.target.value)}
                      className={errors.parentEmail ? "border-red-500" : ""}
                      placeholder="Can be same as student email or left empty"
                      maxLength={100}
                    />
                    {errors.parentEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.parentEmail.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty if parent doesn't have an email, or use student's email
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="parentPhone">Parent Phone</Label>
                    <Input
                      id="parentPhone"
                      value={watch("parentPhone")}
                      onChange={(e) => setValue("parentPhone", e.target.value)}
                      className={errors.parentPhone ? "border-red-500" : ""}
                    />
                    {errors.parentPhone && (
                      <p className="text-sm text-red-500 mt-1">{errors.parentPhone.message}</p>
                    )}
                  </div>
                </div>


                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={watch("address")}
                    onChange={(e) => setValue("address", e.target.value)}
                    rows={2}
                    maxLength={200}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={watch("emergencyContact")}
                    onChange={(e) => setValue("emergencyContact", e.target.value)}
                    className={errors.emergencyContact ? "border-red-500" : ""}
                  />
                  {errors.emergencyContact && (
                    <p className="text-sm text-red-500 mt-1">{errors.emergencyContact.message}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="bio">Bio / Notes</Label>
              <Textarea
                id="bio"
                value={watch("bio")}
                onChange={(e) => setValue("bio", e.target.value)}
                rows={2}
                placeholder="Additional information..."
                maxLength={500}
              />
              {errors.bio && (
                <p className="text-sm text-red-500 mt-1">{errors.bio.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as "ACTIVE" | "INACTIVE" | "SUSPENDED")}
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}



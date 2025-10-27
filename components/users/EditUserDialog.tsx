"use client"

import { useState, useEffect } from "react"
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
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  userId: string | null
}

// Zod validation schema
const editUserSchema = z.object({
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
  joinedDate: z.string().optional(),
  bio: z.string()
    .max(500, "Bio must not exceed 500 characters")
    .optional(),
  password: z.string().optional(),
  changePassword: z.boolean().default(false),
  
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
  // If changePassword is true, password must be at least 8 characters
  if (data.changePassword && (!data.password || data.password.length < 8)) {
    return false
  }
  return true
}, {
  message: "Password must be at least 8 characters when changing password",
  path: ["password"]
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

type EditUserFormData = z.infer<typeof editUserSchema>

export function EditUserDialog({ open, onOpenChange, onSuccess, userId }: EditUserDialogProps) {
  const { data: session } = useSession()
  const [fetchingUser, setFetchingUser] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
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
      changePassword: false,
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

  const { handleSubmit, reset, setValue:_setValue, watch, formState: { errors, isSubmitting } } = form


  const setValue = (key:keyof EditUserFormData,value:any)=>{
    _setValue(key,value,{
      shouldDirty:true,
      shouldTouch:true,
      shouldValidate:true
    })
  } 

  const watchedRole = watch("role")
  const watchedChangePassword = watch("changePassword")

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
      
      reset({
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
        changePassword: false,
        
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

  const onSubmit = async (data: EditUserFormData) => {
    try {
      // Dynamically calculate full name from firstName and lastName
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()
      
      const payload: any = {
        name: fullName || data.email.split('@')[0],
        email: data.email,
        phone: data.phone,
        status: data.status,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        createdAt: data.joinedDate ? new Date(data.joinedDate).toISOString() : undefined,
        bio: data.bio || undefined,
      }

      // Only include role if user can change it
      if (canEditRole(selectedRole) && data.role !== selectedRole) {
        payload.role = data.role
      }

      // Include password only if changePassword is checked
      if (data.changePassword && data.password) {
        payload.password = data.password
      }

      // Add role-specific fields
      if (data.role === 'TUTOR') {
        payload.qualifications = data.qualifications
        payload.experience = data.experience ? parseInt(data.experience) : undefined
        payload.specializations = data.specializations
        payload.hourlyRate = data.hourlyRate ? parseFloat(data.hourlyRate) : undefined
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

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update user')
      }

      toast.success('User updated successfully')
      handleClose()
      onSuccess()

    } catch (error: any) {
      toast.error(error.message || 'Failed to update user')
    }
  }

  const handleClose = () => {
    reset()
    setSelectedRole("")
    onOpenChange(false)
  }

  const addQualification = () => {
    const input = watch("qualificationInput")
    const current = watch("qualifications")
    
    if (current.length >= 5) {
      toast.error("Maximum 5 qualifications allowed")
      return
    }
    
    const trimmedInput = input.trim()
    
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
    
    setValue("qualifications", [...current, trimmedInput])
    setValue("qualificationInput", "")
  }

  const removeQualification = (index: number) => {
    const current = watch("qualifications")
    setValue("qualifications", current.filter((_, i) => i !== index))
  }

  const addSpecialization = () => {
    const input = watch("specializationInput")
    const current = watch("specializations")
    
    if (current.length >= 5) {
      toast.error("Maximum 5 specializations allowed")
      return
    }
    
    const trimmedInput = input.trim()
    
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
    
    setValue("specializations", [...current, trimmedInput])
    setValue("specializationInput", "")
  }

  const removeSpecialization = (index: number) => {
    const current = watch("specializations")
    setValue("specializations", current.filter((_, i) => i !== index))
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...form.register("firstName")}
                      required
                      minLength={2}
                      maxLength={50}
                      pattern="[a-zA-Z\s'-]+"
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...form.register("lastName")}
                      required
                      minLength={2}
                      maxLength={50}
                      pattern="[a-zA-Z\s'-]+"
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  {canEditRole(selectedRole) ? (
                    <Select
                      value={watchedRole}
                      onValueChange={(value) => setValue("role", value)}
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
                    <Input value={watchedRole.replace('_', ' ')} disabled className="bg-gray-100" />
                  )}
                  {errors.role && (
                    <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      required
                      maxLength={100}
                      placeholder="user@example.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      required
                      placeholder="+1234567890"
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth")}
                    max={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                  />
                </div>

                <div>
                  <Label htmlFor="joinedDate">Joined Date</Label>
                  <Input
                    id="joinedDate"
                    type="date"
                    {...form.register("joinedDate")}
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
                    checked={watchedChangePassword}
                    onCheckedChange={(checked) => setValue("changePassword", checked as boolean)}
                  />
                  <Label htmlFor="changePassword" className="cursor-pointer">
                    Change Password
                  </Label>
                </div>

                {watchedChangePassword && (
                  <div>
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...form.register("password")}
                      minLength={8}
                      maxLength={100}
                      placeholder="Enter new password (min 8 characters)"
                    />
                    {errors.password && (
                      <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Tutor-specific fields */}
              {watchedRole === 'TUTOR' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-sm">Tutor Information</h3>
                  
                  <div>
                    <Label htmlFor="qualifications">Qualifications * ({watch("qualifications").length}/5)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="qualifications"
                        {...form.register("qualificationInput")}
                        minLength={2}
                        maxLength={100}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                        placeholder="Add qualification and press Enter (min 2 chars)"
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
                        {...form.register("specializationInput")}
                        minLength={2}
                        maxLength={100}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                        placeholder="Add specialization and press Enter (min 2 chars)"
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
                      {...form.register("experience")}
                      min={0}
                      max={50}
                      step={1}
                      placeholder="0"
                      required
                      className={errors.experience ? "border-red-500" : ""}
                    />
                    {errors.experience && (
                      <p className="text-xs text-red-500 mt-1">{errors.experience.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      {...form.register("hourlyRate")}
                      min={0}
                      max={10000}
                      step={0.01}
                      placeholder="0.00"
                    />
                    {errors.hourlyRate && (
                      <p className="text-xs text-red-500 mt-1">{errors.hourlyRate.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Student-specific fields */}
              {watchedRole === 'STUDENT' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium text-sm">Student Information</h3>
                  
                  <div>
                    <Label htmlFor="ageGroup">Age Group</Label>
                    <Select
                      value={watch("ageGroup")}
                      onValueChange={(value) => setValue("ageGroup", value)}
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
                        {...form.register("parentName")}
                        maxLength={100}
                        pattern="[a-zA-Z\s'-]*"
                        placeholder="Enter parent/guardian name"
                      />
                      {errors.parentName && (
                        <p className="text-xs text-red-500 mt-1">{errors.parentName.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="guardianRelation">Relation</Label>
                      <Input
                        id="guardianRelation"
                        {...form.register("guardianRelation")}
                        maxLength={50}
                        pattern="[a-zA-Z\s'-]*"
                        placeholder="e.g., Father, Mother"
                      />
                      {errors.guardianRelation && (
                        <p className="text-xs text-red-500 mt-1">{errors.guardianRelation.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="parentEmail">Parent Email</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        {...form.register("parentEmail")}
                        maxLength={100}
                        placeholder="parent@example.com"
                      />
                      {errors.parentEmail && (
                        <p className="text-xs text-red-500 mt-1">{errors.parentEmail.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="parentPhone">Parent Phone</Label>
                      <Input
                        id="parentPhone"
                        type="tel"
                        {...form.register("parentPhone")}
                        placeholder="+1234567890"
                      />
                      {errors.parentPhone && (
                        <p className="text-xs text-red-500 mt-1">{errors.parentPhone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      {...form.register("address")}
                      rows={2}
                      maxLength={200}
                      placeholder="Enter full address"
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {watch("address")?.length || 0}/200 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      type="tel"
                      {...form.register("emergencyContact")}
                      placeholder="+1234567890"
                    />
                    {errors.emergencyContact && (
                      <p className="text-xs text-red-500 mt-1">{errors.emergencyContact.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="bio">Bio / Notes</Label>
                <Textarea
                  id="bio"
                  {...form.register("bio")}
                  rows={2}
                  maxLength={500}
                  placeholder="Additional information..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {watch("bio")?.length || 0}/500 characters
                </p>
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
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
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
                Update User
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
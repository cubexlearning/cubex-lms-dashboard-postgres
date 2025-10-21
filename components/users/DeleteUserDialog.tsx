"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

export function DeleteUserDialog({ open, onOpenChange, onSuccess, user }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409 && data.details) {
          // User has dependencies
          throw new Error(
            `Cannot delete user. They have ${data.details.enrollments} enrollment(s) and ${data.details.courses} course(s). Please reassign or remove them first.`
          )
        }
        throw new Error(data.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully')
      onOpenChange(false)
      onSuccess()

    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Delete User
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently deactivate the user account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">You are about to delete:</p>
                <div className="ml-4 space-y-1">
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role.replace('_', ' ')}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertDescription className="text-sm text-gray-600">
              <strong>Note:</strong> The user account will be set to INACTIVE status. 
              If the user has active enrollments or courses, you will need to reassign 
              or remove them before deletion.
            </AlertDescription>
          </Alert>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete User
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}


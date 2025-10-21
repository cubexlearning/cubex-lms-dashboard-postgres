"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollmentId: string
  currency: string
  onSuccess: () => void
}

export function AddPaymentDialog({ 
  open, 
  onOpenChange, 
  enrollmentId, 
  currency,
  onSuccess 
}: AddPaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    method: 'CARD',
    dueDate: new Date().toISOString().split('T')[0],
    markAsPaid: false,
    transactionId: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          method: formData.method,
          status: formData.markAsPaid ? 'PAID' : 'PENDING',
          dueDate: formData.dueDate,
          paidAt: formData.markAsPaid ? new Date().toISOString() : undefined,
          transactionId: formData.transactionId || undefined,
          description: formData.description || undefined,
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Payment added successfully')
        onSuccess()
        // Reset form
        setFormData({
          amount: '',
          method: 'CARD',
          dueDate: new Date().toISOString().split('T')[0],
          markAsPaid: false,
          transactionId: '',
          description: '',
        })
      } else {
        toast.error(result.error || 'Failed to add payment')
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency === 'INR' ? '₹' : currency}) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method *</Label>
            <Select 
              value={formData.method} 
              onValueChange={(value) => setFormData({ ...formData, method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="NET_BANKING">Net Banking</SelectItem>
                <SelectItem value="WALLET">Wallet</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="PAYPAL">PayPal</SelectItem>
                <SelectItem value="STRIPE">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Second installment"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="markAsPaid"
              checked={formData.markAsPaid}
              onCheckedChange={(checked) => setFormData({ ...formData, markAsPaid: checked as boolean })}
            />
            <Label htmlFor="markAsPaid" className="cursor-pointer">
              Mark as paid immediately
            </Label>
          </div>

          {formData.markAsPaid && (
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID (optional)</Label>
              <Input
                id="transactionId"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                placeholder="TXN123456789"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Payment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MoreVertical, 
  Loader2,
  CreditCard,
  Receipt
} from 'lucide-react'
import { toast } from 'sonner'
import { AddPaymentDialog } from './AddPaymentDialog'

interface Payment {
  id: string
  amount: number
  currency: string
  method: string
  status: string
  dueDate: string
  paidAt?: string
  transactionId?: string
  description?: string
  createdAt: string
}

interface PaymentTrackerProps {
  enrollmentId: string
  totalAmount: number
  currency: string
}

export function PaymentTracker({ enrollmentId, totalAmount, currency }: PaymentTrackerProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [markPaidLoading, setMarkPaidLoading] = useState<string | null>(null)
  const [confirmMarkPaid, setConfirmMarkPaid] = useState<Payment | null>(null)

  const loadPayments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}/payments`)
      const result = await response.json()

      if (result.success) {
        setPayments(result.data)
      } else {
        toast.error('Failed to load payments')
      }
    } catch (error) {
      console.error('Error loading payments:', error)
      toast.error('An error occurred while loading payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (enrollmentId) {
      loadPayments()
    }
  }, [enrollmentId])

  const handleAddPaymentSuccess = () => {
    setAddDialogOpen(false)
    loadPayments()
  }

  const handleMarkAsPaid = async (payment: Payment) => {
    setMarkPaidLoading(payment.id)
    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paidAt: new Date().toISOString(),
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Payment marked as paid')
        loadPayments()
      } else {
        toast.error(result.error || 'Failed to update payment')
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error)
      toast.error('An error occurred')
    } finally {
      setMarkPaidLoading(null)
      setConfirmMarkPaid(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'INR' ? '₹' : currency
    return `${symbol}${Number(amount).toFixed(2)}`
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'FAILED':
      case 'REFUNDED':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'CARD': 'Card',
      'UPI': 'UPI',
      'NET_BANKING': 'Net Banking',
      'WALLET': 'Wallet',
      'BANK_TRANSFER': 'Bank Transfer',
      'CASH': 'Cash',
      'PAYPAL': 'PayPal',
      'STRIPE': 'Stripe',
    }
    return labels[method] || method
  }

  // Calculate payment summary
  const totalPaid = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0)
  
  const totalPending = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const paymentPercentage = (totalPaid / totalAmount) * 100

  return (
    <div className="space-y-6">
      {/* Payment Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Summary
          </CardTitle>
          <Button onClick={() => setAddDialogOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Payment
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Paid</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Outstanding</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalAmount - totalPaid)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Progress</span>
              <span className="font-medium">{paymentPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={paymentPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No payments recorded yet</p>
              <p className="text-sm mt-1">Add your first payment to track progress</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          Due: {formatDate(payment.dueDate)}
                        </div>
                        {payment.paidAt && (
                          <div className="text-xs text-green-600">
                            Paid: {formatDate(payment.paidAt)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(payment.amount)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getMethodLabel(payment.method)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {payment.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 font-mono">
                        {payment.transactionId || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {payment.status === 'PENDING' && (
                            <DropdownMenuItem 
                              onClick={() => setConfirmMarkPaid(payment)}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Receipt className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <AddPaymentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        enrollmentId={enrollmentId}
        currency={currency}
        onSuccess={handleAddPaymentSuccess}
      />

      {/* Confirm Mark as Paid Dialog */}
      <AlertDialog open={!!confirmMarkPaid} onOpenChange={() => setConfirmMarkPaid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Payment as Paid?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this payment of {confirmMarkPaid && formatCurrency(confirmMarkPaid.amount)} as paid?
              This action will update the enrollment payment status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmMarkPaid && handleMarkAsPaid(confirmMarkPaid)}
              disabled={!!markPaidLoading}
            >
              {markPaidLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

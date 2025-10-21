"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calculator } from 'lucide-react'

interface PricingCalculatorProps {
  basePrice: number | null | undefined
  currency: string
  taxRate: number // e.g., 0.18 for 18%
  onPricingChange: (pricing: PricingBreakdown) => void
}

export interface PricingBreakdown {
  basePrice: number
  discountType: 'NONE' | 'PERCENTAGE' | 'AMOUNT'
  discountValue: number
  discountAmount: number
  subtotal: number
  taxAmount: number
  finalPrice: number
}

export function PricingCalculator({ 
  basePrice, 
  currency, 
  taxRate,
  onPricingChange 
}: PricingCalculatorProps) {
  const [discountType, setDiscountType] = useState<'NONE' | 'PERCENTAGE' | 'AMOUNT'>('NONE')
  const [discountValue, setDiscountValue] = useState<number>(0)
  const safeBasePrice = typeof basePrice === 'number' && !isNaN(basePrice) ? basePrice : 0
  
  const [pricing, setPricing] = useState<PricingBreakdown>({
    basePrice: safeBasePrice,
    discountType: 'NONE',
    discountValue: 0,
    discountAmount: 0,
    subtotal: safeBasePrice,
    taxAmount: safeBasePrice * taxRate,
    finalPrice: safeBasePrice * (1 + taxRate)
  })

  // Calculate pricing whenever inputs change
  useEffect(() => {
    const safeBasePrice = typeof basePrice === 'number' && !isNaN(basePrice) ? basePrice : 0
    let discountAmount = 0
    
    if (discountType === 'PERCENTAGE' && discountValue > 0) {
      discountAmount = safeBasePrice * (discountValue / 100)
    } else if (discountType === 'AMOUNT' && discountValue > 0) {
      discountAmount = Math.min(discountValue, safeBasePrice) // Discount can't exceed base price
    }
    
    const subtotal = safeBasePrice - discountAmount
    const taxAmount = subtotal * taxRate
    const finalPrice = subtotal + taxAmount
    
    const newPricing: PricingBreakdown = {
      basePrice: safeBasePrice,
      discountType,
      discountValue,
      discountAmount,
      subtotal,
      taxAmount,
      finalPrice
    }
    
    setPricing(newPricing)
    onPricingChange(newPricing)
  }, [basePrice, discountType, discountValue, taxRate]) // Removed onPricingChange to prevent infinite loops

  const formatCurrency = (amount: number | null | undefined) => {
    const symbol = currency === 'INR' ? '₹' : currency
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
    return `${symbol}${safeAmount.toFixed(2)}`
  }

  const getTaxLabel = () => {
    const percentage = (taxRate * 100).toFixed(0)
    return currency === 'INR' ? `GST (${percentage}%)` : `Tax (${percentage}%)`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5" />
          Pricing & Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Base Price Display */}
        <div className="space-y-2">
          <Label>Base Price</Label>
          <div className="text-2xl font-bold">{formatCurrency(basePrice)}</div>
          <p className="text-xs text-gray-500">From course pricing</p>
        </div>

        {/* Discount Section */}
        <div className="space-y-4">
          <Label>Discount (Optional)</Label>
          <RadioGroup value={discountType} onValueChange={(value: any) => {
            setDiscountType(value)
            if (value === 'NONE') setDiscountValue(0)
          }}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="NONE" id="no-discount" />
              <Label htmlFor="no-discount" className="cursor-pointer font-normal">
                No Discount
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PERCENTAGE" id="percentage-discount" />
              <Label htmlFor="percentage-discount" className="cursor-pointer font-normal">
                Percentage Discount
              </Label>
            </div>
            
            {discountType === 'PERCENTAGE' && (
              <div className="ml-6 flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder="10"
                  className="w-24"
                />
                <span>%</span>
                <span className="text-sm text-gray-600">
                  = {formatCurrency(pricing.discountAmount)}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AMOUNT" id="amount-discount" />
              <Label htmlFor="amount-discount" className="cursor-pointer font-normal">
                Fixed Amount
              </Label>
            </div>
            
            {discountType === 'AMOUNT' && (
              <div className="ml-6 flex items-center gap-2">
                <span className="text-sm">{currency === 'INR' ? '₹' : currency}</span>
                <Input
                  type="number"
                  min="0"
                  max={basePrice}
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  placeholder="500"
                  className="w-32"
                />
              </div>
            )}
          </RadioGroup>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-3">Price Breakdown</div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Price</span>
            <span className="font-medium">{formatCurrency(basePrice)}</span>
          </div>
          
          {pricing.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Discount {discountType === 'PERCENTAGE' ? `(${discountValue}%)` : ''}
              </span>
              <span className="font-medium text-green-600">
                -{formatCurrency(pricing.discountAmount)}
              </span>
            </div>
          )}
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{getTaxLabel()}</span>
            <span className="font-medium">+{formatCurrency(pricing.taxAmount)}</span>
          </div>
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold">Final Amount</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(pricing.finalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg">
          <strong>Note:</strong> Tax rate ({(taxRate * 100).toFixed(0)}%) is configured in Institution Settings. 
          The final amount includes all applicable taxes.
        </div>
      </CardContent>
    </Card>
  )
}

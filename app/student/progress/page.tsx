"use client"

import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function StudentProgressPage() {
  return (
    <RoleLayoutWrapper allowedRoles={["STUDENT"]}>
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Track your learning progress here.</p>
        </CardContent>
      </Card>
    </RoleLayoutWrapper>
  )
}



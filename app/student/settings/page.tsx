"use client"

import { useEffect, useState } from 'react'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'

export default function StudentSettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [sessionReminders, setSessionReminders] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/profile', { cache: 'no-store' })
        const json = await res.json()
        if (json.success && json.data) {
          setDisplayName(json.data.name || '')
          setEmail(json.data.email || '')
          setPhone(json.data.phone || '')
          setBio(json.data.bio || '')
          setAvatar(json.data.avatar || '')
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    try {
      setIsSavingProfile(true)
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName, phone, bio, avatar })
      })
      const json = await res.json()
      if (!json.success) {
        console.error('Save failed', json)
      }
    } catch (e) {
      console.error('Save error', e)
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <RoleLayoutWrapper allowedRoles={["STUDENT"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600">Manage your profile and preferences</p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading profile...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    id="displayName"
                    placeholder="Your full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (read-only)</Label>
                  <Input id="email" value={email} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="Contact number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input id="avatar" placeholder="https://..." value={avatar} onChange={(e) => setAvatar(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" placeholder="Short bio" value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>

                <div className="pt-2">
                  <Button onClick={handleSave} disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save profile'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email notifications</div>
                    <div className="text-sm text-gray-600">Announcements and updates</div>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Session reminders</div>
                    <div className="text-sm text-gray-600">Remind me before sessions start</div>
                  </div>
                  <Switch checked={sessionReminders} onCheckedChange={setSessionReminders} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </RoleLayoutWrapper>
  )
}




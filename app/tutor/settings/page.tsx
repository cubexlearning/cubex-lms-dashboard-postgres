"use client"

import { useEffect, useState } from 'react'
import { RoleLayoutWrapper } from '@/components/role-layout-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export default function TutorSettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [sessionReminders, setSessionReminders] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' })
        const json = await res.json()
        if (json.success && json.data) {
          setDisplayName(json.data.name || '')
          setEmail(json.data.email || '')
          setPhone(json.data.phone || '')
          setBio(json.data.bio || '')
          setAvatar(json.data.avatar || '')
        }
      } catch (e) {
        console.error('Failed to load profile', e)
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
    <RoleLayoutWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600">Manage your tutor preferences</p>
        </div>

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
                  placeholder="Your name as shown to students"
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

              <div className="pt-2">
                <Button variant="outline" onClick={handleSave} disabled={isSavingNotifications}>
                  {isSavingNotifications ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save notification settings'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleLayoutWrapper>
  )
}



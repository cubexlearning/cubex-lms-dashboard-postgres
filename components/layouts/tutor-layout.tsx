"use client"

import { useState } from 'react'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from 'next-auth/react'
import { 
  Search, 
  Bell, 
  Home, 
  BookOpen,
  Users,
  Calendar,
  BarChart3,
  Settings,
  ArrowRight,
  LogOut,
  User,
  GraduationCap,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { InstitutionLogo } from "@/components/institution-logo"

const tutorNavigation = [
  { name: "Dashboard", href: "/tutor", icon: Home },
  { name: "My Courses", href: "/tutor/courses", icon: BookOpen },
  { name: "Students", href: "/tutor/students", icon: Users },
  { name: "Sessions", href: "/tutor/sessions", icon: Calendar },
  { name: "Assignments", href: "/tutor/assignments", icon: FileText },
  { name: "Reports", href: "/tutor/reports", icon: BarChart3 },
  { name: "Settings", href: "/tutor/settings", icon: Settings },
]

interface TutorLayoutProps {
  children: React.ReactNode
}

export function TutorLayout({ children }: TutorLayoutProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'TUTOR': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCurrentPageName = () => {
    if (pathname === "/tutor") return "Dashboard"
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length > 1) {
      return segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
    }
    return "Tutor"
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Use Institution Logo from Settings */}
          <InstitutionLogo size="sm" showName={true} />
          <div className="text-sm text-gray-500">
            <span>Tutor Panel</span> <span className="mx-1">/</span>
            <span className="capitalize">{getCurrentPageName()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search courses, students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64"
            />
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session?.user?.avatar || undefined} alt={session?.user?.name || ''} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {session?.user?.name?.[0] || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{session?.user?.name}</span>
                  <Badge className={`text-xs ${getRoleBadgeColor(session?.user?.role || '')}`}>
                    {session?.user?.role}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] border-r border-gray-200 bg-gray-50 p-4">
          <nav className="space-y-1">
            {tutorNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {isActive && <ArrowRight className="w-4 h-4 ml-auto" />}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
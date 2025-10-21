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
  FileText,
  Trophy,
  Calendar,
  BarChart3,
  Settings,
  ArrowRight,
  LogOut,
  User,
  GraduationCap
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

const studentNavigation = [
  { name: "Dashboard", href: "/student", icon: Home },
  { name: "My Courses", href: "/student/courses", icon: BookOpen },
  { name: "Assignments", href: "/student/assignments", icon: FileText },
  // Removed Grades and Schedule per requirements
  { name: "Progress", href: "/student/progress", icon: BarChart3 },
  { name: "Settings", href: "/student/settings", icon: Settings },
]

interface StudentLayoutProps {
  children: React.ReactNode
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  const getCurrentPageName = () => {
    if (pathname === "/student") return "Dashboard"
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length > 1) {
      return segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
    }
    return "Student"
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Use Institution Logo from Settings */}
          <InstitutionLogo size="sm" showName={true} />
          <div className="text-sm text-gray-500">
            <span>Student Portal</span> <span className="mx-1">/</span>
            <span className="capitalize">{getCurrentPageName()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search courses, assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session?.user?.avatar || "/placeholder.svg?height=32&width=32"} />
                  <AvatarFallback>
                    {session?.user?.name ? session.user.name.split(' ').map(n => n[0]).join('') : 'S'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session?.user?.name || 'Student'}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                  <Badge className="bg-green-100 text-green-800" variant="secondary">
                    STUDENT
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 border-r border-gray-200 bg-white h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Quick search..." className="pl-10 bg-gray-50 border-gray-200 text-sm" />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6"
              >
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <nav className="space-y-1">
              {studentNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center w-full justify-start px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? "bg-green-50 text-green-700 hover:bg-green-100" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Student Status Card */}
            <div className="mt-8 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Student Access</span>
              </div>
              <p className="text-xs text-green-700">
                Access your courses and track your learning progress.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
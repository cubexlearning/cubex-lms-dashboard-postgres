export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    
    const session = await getServerSession(authOptions)
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate date ranges
    const now = new Date()
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Fetch statistics in parallel
    const [
      totalUsers,
      currentMonthUsers,
      lastMonthUsers,
      totalCourses,
      currentMonthCourses,
      lastMonthCourses,
      totalEnrollments,
      currentMonthEnrollments,
      lastMonthEnrollments,
      usersByRole,
      systemAdmins,
      recentUsers,
      recentCourses,
      recentEnrollments,
      recentPayments
    ] = await Promise.all([
      // Total Users (only ACTIVE)
      prisma.user.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.user.count({
        where: { 
          status: 'ACTIVE',
          createdAt: { gte: startOfCurrentMonth }
        }
      }),
      prisma.user.count({
        where: { 
          status: 'ACTIVE',
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Total Courses
      prisma.course.count(),
      prisma.course.count({
        where: { createdAt: { gte: startOfCurrentMonth } }
      }),
      prisma.course.count({
        where: { 
          createdAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Total Enrollments
      prisma.enrollment.count(),
      prisma.enrollment.count({
        where: { enrolledAt: { gte: startOfCurrentMonth } }
      }),
      prisma.enrollment.count({
        where: { 
          enrolledAt: { 
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Users by Role (only ACTIVE)
      prisma.user.groupBy({
        by: ['role'],
        where: {
          status: 'ACTIVE'
        },
        _count: {
          role: true
        }
      }),
      
      // System Admins (only ACTIVE)
      prisma.user.count({
        where: {
          status: 'ACTIVE',
          role: {
            in: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      }),
      
      // Recent Users (last 2, only ACTIVE)
      prisma.user.findMany({
        take: 2,
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          role: true,
          createdAt: true
        }
      }),
      
      // Recent Courses (last 2)
      prisma.course.findMany({
        take: 2,
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          courseTutors: {
            take: 1,
            include: {
              tutor: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }),
      
      // Recent Enrollments (last 2)
      prisma.enrollment.findMany({
        take: 2,
        orderBy: { enrolledAt: 'desc' },
        select: {
          id: true,
          enrolledAt: true,
          student: {
            select: {
              name: true
            }
          },
          course: {
            select: {
              title: true
            }
          }
        }
      }),
      
      // Recent Payments (last 1)
      prisma.payment.findMany({
        take: 1,
        where: { status: 'PAID' },
        orderBy: { paidAt: 'desc' },
        select: {
          id: true,
          amount: true,
          paidAt: true,
          enrollment: {
            select: {
              student: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    ])

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const usersGrowth = calculateGrowth(currentMonthUsers, lastMonthUsers)
    const coursesGrowth = calculateGrowth(currentMonthCourses, lastMonthCourses)
    const enrollmentsGrowth = calculateGrowth(currentMonthEnrollments, lastMonthEnrollments)

    // Format users by role
    const roleDistribution = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.role
      return acc
    }, {} as Record<string, number>)

    // Ensure all roles are present with 0 if not found
    const completeRoleDistribution = {
      STUDENT: roleDistribution.STUDENT || 0,
      TUTOR: roleDistribution.TUTOR || 0,
      PARENT: roleDistribution.PARENT || 0,
      ADMIN: roleDistribution.ADMIN || 0,
      SUPER_ADMIN: roleDistribution.SUPER_ADMIN || 0,
    }

    // Format recent activity
    const formatTimeAgo = (date: Date): string => {
      const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)
      
      if (seconds < 60) return `${seconds} seconds ago`
      if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
      if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
      return `${Math.floor(seconds / 86400)} days ago`
    }

    const recentActivity: any[] = []

    // Add recent users
    recentUsers.forEach(user => {
      recentActivity.push({
        type: 'user_registered',
        message: `${user.name} registered as ${user.role.toLowerCase().replace('_', ' ')}`,
        timestamp: formatTimeAgo(user.createdAt),
        color: 'green',
        sortDate: user.createdAt
      })
    })

    // Add recent courses
    recentCourses.forEach(course => {
      const tutorName = course.courseTutors[0]?.tutor?.name || 'Unknown'
      recentActivity.push({
        type: 'course_created',
        message: `${course.title} created by ${tutorName}`,
        timestamp: formatTimeAgo(course.createdAt),
        color: 'blue',
        sortDate: course.createdAt
      })
    })

    // Add recent enrollments
    recentEnrollments.forEach(enrollment => {
      recentActivity.push({
        type: 'enrollment_created',
        message: `${enrollment.student.name} enrolled in ${enrollment.course.title}`,
        timestamp: formatTimeAgo(enrollment.enrolledAt),
        color: 'purple',
        sortDate: enrollment.enrolledAt
      })
    })

    // Add recent payments
    recentPayments.forEach(payment => {
      recentActivity.push({
        type: 'payment_completed',
        message: `£${payment.amount} payment received from ${payment.enrollment.student.name}`,
        timestamp: formatTimeAgo(payment.paidAt!),
        color: 'emerald',
        sortDate: payment.paidAt
      })
    })

    // Sort by most recent and take top 3
    recentActivity.sort((a, b) => 
      new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
    )
    const topActivity = recentActivity.slice(0, 3).map(({ sortDate, ...rest }) => rest)

    // Build response
    return NextResponse.json({
      success: true,
      data: {
        statistics: {
          totalUsers: {
            count: totalUsers,
            growth: usersGrowth
          },
          totalCourses: {
            count: totalCourses,
            growth: coursesGrowth
          },
          totalEnrollments: {
            count: totalEnrollments,
            growth: enrollmentsGrowth
          },
          systemAdmins: {
            count: systemAdmins,
            growth: 0 // Admin changes are typically stable
          }
        },
        usersByRole: completeRoleDistribution,
        recentActivity: topActivity
      },
      generatedAt: now.toISOString()
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { z } from 'zod'

const updateSelfSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  bio: z.string().optional(),
  // Allow empty string to clear avatar
  avatar: z.string().url().optional().or(z.literal('')),
})

// GET /api/profile - get current user's profile
export async function GET() {
  try {
    await ensurePrismaConnected()
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        avatar: true,
        role: true,
        status: true,
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('GET /api/profile error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PUT /api/profile - update current user's profile (email cannot be changed here)
export async function PUT(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateSelfSchema.parse(body)

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validated.name,
        phone: validated.phone,
        bio: validated.bio,
        avatar: validated.avatar === '' ? null : validated.avatar,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        avatar: true,
        role: true,
        status: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({ success: true, data: updated, message: 'Profile updated' })
  } catch (error) {
    console.error('PUT /api/profile error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 })
  }
}



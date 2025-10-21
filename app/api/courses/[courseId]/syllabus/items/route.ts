export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const createItemSchema = z.object({
  phaseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0).optional()
})

function isAdmin(role?: string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    await ensurePrismaConnected()
    const session = await getServerSession(authOptions)
    if (!session || !isAdmin(session.user?.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const data = createItemSchema.parse(body)
    const maxOrder = await prisma.courseSyllabusItem.aggregate({
      _max: { order: true },
      where: { courseId: params.courseId, phaseId: data.phaseId }
    })
    const nextOrder = data.order ?? ((maxOrder._max.order ?? -1) + 1)
    const item = await prisma.courseSyllabusItem.create({
      data: {
        courseId: params.courseId,
        phaseId: data.phaseId,
        title: data.title,
        description: data.description,
        order: nextOrder,
      }
    })
    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('POST syllabus item error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 })
  }
}



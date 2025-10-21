export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const createPhaseSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().min(0).optional()
})

function isAdmin(role?: string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    await ensurePrismaConnected()
    const { courseId } = await params
    const phases = await prisma.courseSyllabusPhase.findMany({
      where: { courseId: courseId },
      orderBy: { order: 'asc' },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      }
    })
    
    // Flatten all items from all phases
    const items = phases.flatMap(phase => phase.items)
    
    return NextResponse.json({ success: true, data: { phases, items } })
  } catch (error) {
    console.error('GET syllabus phases error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch syllabus' }, { status: 500 })
  }
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
    const { courseId } = await params
    const body = await request.json()
    const data = createPhaseSchema.parse(body)
    const maxOrder = await prisma.courseSyllabusPhase.aggregate({
      _max: { order: true },
      where: { courseId: courseId }
    })
    const nextOrder = data.order ?? ((maxOrder._max.order ?? -1) + 1)
    const phase = await prisma.courseSyllabusPhase.create({
      data: { courseId: params.courseId, name: data.name, order: nextOrder }
    })
    return NextResponse.json({ success: true, data: phase }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('POST syllabus phase error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create phase' }, { status: 500 })
  }
}



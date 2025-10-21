export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  level: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensurePrismaConnected()
    const row = await prisma.curriculum.findUnique({ where: { id: params.id } })
    if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: row })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch curriculum' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensurePrismaConnected()
    const body = await request.json()
    const parsed = updateSchema.parse(body)
    const updated = await prisma.curriculum.update({ where: { id: params.id }, data: parsed })
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.flatten() }, { status: 400 })
    if (e?.code === 'P2025') return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: false, error: 'Failed to update curriculum' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensurePrismaConnected()
    const updated = await prisma.curriculum.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: false, error: 'Failed to delete curriculum' }, { status: 500 })
  }
}



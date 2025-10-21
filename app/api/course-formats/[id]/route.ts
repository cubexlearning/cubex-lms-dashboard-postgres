export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensurePrismaConnected()
    const body = await request.json()
    const parsed = schema.parse(body)
    const data: any = { ...parsed }
    if (parsed.slug) {
      let baseSlug = slugify(parsed.slug)
      let uniqueSlug = baseSlug
      let counter = 1
      while (true) {
        const exists = await prisma.courseFormatModel.findUnique({ where: { slug: uniqueSlug } })
        if (!exists || exists.id === params.id) break
        uniqueSlug = `${baseSlug}-${counter++}`
      }
      data.slug = uniqueSlug
    }
    const updated = await prisma.courseFormatModel.update({ where: { id: params.id }, data })
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Validation failed', details: e.flatten() }, { status: 400 })
    if (e?.code === 'P2025') return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: false, error: 'Failed to update course format' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensurePrismaConnected()
    const updated = await prisma.courseFormatModel.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: false, error: 'Failed to delete course format' }, { status: 500 })
  }
}



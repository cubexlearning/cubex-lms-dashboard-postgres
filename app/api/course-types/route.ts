export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const where: any = {}
    if (!includeInactive) where.isActive = true
    const rows = await prisma.courseType.findMany({ where, orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ success: true, data: rows })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch course types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const body = await request.json()
    const parsed = schema.parse(body)
    const baseSlug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.name)
    let uniqueSlug = baseSlug
    let counter = 1
    while (true) {
      const exists = await prisma.courseType.findUnique({ where: { slug: uniqueSlug } })
      if (!exists) break
      uniqueSlug = `${baseSlug}-${counter++}`
    }
    const created = await prisma.courseType.create({
      data: {
        name: parsed.name,
        slug: uniqueSlug,
        description: parsed.description,
        sortOrder: parsed.sortOrder ?? 0,
        isActive: parsed.isActive ?? true,
      },
    })
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: e.flatten() }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to create course type' }, { status: 500 })
  }
}



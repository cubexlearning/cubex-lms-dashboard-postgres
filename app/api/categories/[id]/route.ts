export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Color must be a hex like #RRGGBB').optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// GET /api/categories/[id] - fetch single
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: { _count: { select: { courses: true } } },
    })
    if (!category) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: { ...category, courseCount: category._count.courses } })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch category' }, { status: 500 })
  }
}

// PUT /api/categories/[id] - update
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    const body = await request.json()
    const parsed = updateSchema.parse(body)

    const data: any = { ...parsed }
    if (parsed.slug) {
      data.slug = slugify(parsed.slug)
    }

    // make slug unique if provided
    if (data.slug) {
      let uniqueSlug = data.slug
      let counter = 1
      while (true) {
        const exists = await prisma.category.findUnique({ where: { slug: uniqueSlug } })
        if (!exists || exists.id === params.id) break
        uniqueSlug = `${data.slug}-${counter++}`
      }
      data.slug = uniqueSlug
    }

    const updated = await prisma.category.update({ where: { id: params.id }, data })
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.flatten() }, { status: 400 })
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 409 })
    }
    console.error('Error updating category:', error)
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE /api/categories/[id] - soft delete (archive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensurePrismaConnected()
    const updated = await prisma.category.update({
      where: { id: params.id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }
    console.error('Error archiving category:', error)
    return NextResponse.json({ success: false, error: 'Failed to archive category' }, { status: 500 })
  }
}



export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma, ensurePrismaConnected } from '@/lib/db'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(120).optional(),
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

// GET /api/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (!includeInactive) {
      where.isActive = true
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { courses: true }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    const data = categories.map((c) => ({ ...c, courseCount: c._count.courses }))

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a category
export async function POST(request: NextRequest) {
  try {
    await ensurePrismaConnected()
    const body = await request.json()
    const parsed = categorySchema.parse(body)

    const name = parsed.name
    const slug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.name)

    // ensure unique slug (append -n if needed)
    let uniqueSlug = slug
    let counter = 1
    while (true) {
      const exists = await prisma.category.findUnique({ where: { slug: uniqueSlug } })
      if (!exists) break
      uniqueSlug = `${slug}-${counter++}`
    }

    const created = await prisma.category.create({
      data: {
        name,
        slug: uniqueSlug,
        description: parsed.description,
        icon: parsed.icon,
        color: parsed.color,
        sortOrder: parsed.sortOrder ?? 0,
        isActive: parsed.isActive ?? true,
      },
    })

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: error.flatten() }, { status: 400 })
    }
    // Prisma unique constraint
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 409 })
    }
    console.error('Error creating category:', error)
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 })
  }
}
